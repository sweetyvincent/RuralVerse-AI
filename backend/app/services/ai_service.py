import os
import json
import logging
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.ai_tutor import AITutorConfig, AIUsageLog
from app.models.lesson import Document, DocumentChunk
from app.services.rag_service import retrieve_relevant_passages

logger = logging.getLogger(__name__)


def get_ai_config(db: Session) -> AITutorConfig:
    config = db.query(AITutorConfig).first()
    if not config:
        config = AITutorConfig(
            provider="gemini",
            model_name=settings.AI_MODEL_NAME or "gemini-1.5-flash",
            temperature=0.7,
            max_tokens=1000,
            system_instructions=(
                "You are RuralVerse AI, a compassionate and knowledgeable multilingual educational tutor "
                "dedicated to helping rural students understand complex concepts in science, math, and general subjects. "
                "Explain concepts simply, step-by-step, with relatable real-world analogies. "
                "Always distinguish verified facts from general knowledge. When context from approved textbooks "
                "is provided, base your answers on it and cite the document title."
            ),
            supported_languages=json.dumps(["en", "ta", "hi", "te"]),
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def chat_with_tutor(
    db: Session,
    user_id: int,
    message: str,
    language: str = "en",
    context: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Handle educational queries with RAG context retrieval and real Gemini model call.
    Returns honest errors when API keys or configurations are missing.
    """
    ai_config = get_ai_config(db)
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "AI Tutor is currently unconfigured. Please configure the GEMINI_API_KEY "
                "in platform settings or backend environment to enable live AI responses."
            ),
        )

    # 1. RAG Passage Retrieval
    passages = retrieve_relevant_passages(db, query=message, top_k=3)
    sources = []
    rag_context_text = ""

    if passages:
        rag_context_text = "\n\n--- Verified Reference Material ---\n"
        for p in passages:
            sources.append(p["document_title"])
            rag_context_text += f"[Source: {p['document_title']}]\n{p['content']}\n\n"
        rag_context_text += "--- End of Reference Material ---\n"
        sources = list(set(sources))

    # 2. Build full prompt
    language_instruction = f"Please reply in the language requested: '{language}'."
    prompt = f"""
{ai_config.system_instructions}

{language_instruction}

{rag_context_text}

Student Question: {message}

Instructions:
- If Reference Material is present above, cite the specific source names in your explanation.
- If the question cannot be answered from the provided reference material, explain the concept using accurate fundamentals, but clearly state: "Note: This answer is based on general foundational principles as no matching verified local textbook passage was found."
"""

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name=ai_config.model_name or "gemini-1.5-flash")
        
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": ai_config.temperature,
                "max_output_tokens": ai_config.max_tokens,
            }
        )

        response_text = response.text

        # Log usage in audit / analytics
        log_entry = AIUsageLog(
            user_id=user_id,
            prompt_tokens=len(prompt.split()),
            completion_tokens=len(response_text.split()),
            model_name=ai_config.model_name,
            status="success",
        )
        db.add(log_entry)
        db.commit()

        return {
            "response": response_text,
            "sources": sources,
        }

    except Exception as e:
        logger.error(f"Gemini API invocation failed: {e}")
        # Log failure
        log_entry = AIUsageLog(
            user_id=user_id,
            prompt_tokens=len(prompt.split()),
            completion_tokens=0,
            model_name=ai_config.model_name,
            status="error",
            error_message=str(e),
        )
        db.add(log_entry)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service provider returned an error: {str(e)}",
        )


def generate_questions_from_document(
    db: Session,
    document_id: int,
    num_questions: int = 5,
) -> Dict[str, Any]:
    """
    RAG-driven feature: Reads the indexed text chunks of an uploaded lesson PDF
    and prompts the LLM to generate educational assessment questions directly from it.
    """
    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GEMINI_API_KEY is not configured on the server.",
        )

    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).order_by(DocumentChunk.chunk_index).limit(8).all()
    if not chunks:
        raise HTTPException(status_code=400, detail="Document has not been indexed or has no content.")

    combined_text = "\n\n".join([c.content for c in chunks])

    prompt = f"""
You are an expert curriculum developer. Based strictly on the following textbook lesson excerpt,
generate {num_questions} educational assessment questions with answers.

Textbook Document: "{doc.title}"
Excerpt:
{combined_text[:4000]}

Return valid JSON strictly adhering to this format:
[
  {{
    "question": "Question text here?",
    "type": "multiple_choice",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Why this is correct based on the text."
  }}
]
"""

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(model_name="gemini-1.5-flash")
        
        response = model.generate_content(
            prompt,
            generation_config={"temperature": 0.3, "response_mime_type": "application/json"}
        )

        questions = json.loads(response.text)
        return {
            "document_title": doc.title,
            "document_id": doc.id,
            "questions": questions,
        }

    except Exception as e:
        logger.error(f"Error generating questions from PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")


def test_ai_connection(api_key: Optional[str] = None, model_name: str = "gemini-1.5-flash") -> Dict[str, Any]:
    """Test AI connection to verify provider credentials."""
    key = api_key or settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    if not key:
        return {"status": "unconfigured", "message": "No API key configured"}

    try:
        import google.generativeai as genai
        genai.configure(api_key=key)
        model = genai.GenerativeModel(model_name=model_name)
        res = model.generate_content("Ping. Reply with 'pong'.", generation_config={"max_output_tokens": 10})
        return {
            "status": "connected",
            "model": model_name,
            "response": res.text.strip(),
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
        }
