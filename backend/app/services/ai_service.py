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


def analyze_lesson_content(
    title: str,
    content: str,
    language: str = "en",
) -> Dict[str, Any]:
    """
    Analyzes an uploaded student lesson and generates comprehensive Key Revision Notes
    and assessment questions (MCQs & Short Answer) based strictly on the lesson text.
    """
    clean_title = title.strip() or "Uploaded Student Lesson"
    clean_text = content.strip()

    if not clean_text:
        raise HTTPException(status_code=400, detail="Lesson content is empty.")

    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")

    if api_key:
        prompt = f"""
You are an expert rural education tutor and curriculum analyst. A student has uploaded their own lesson notes.
Carefully analyze the lesson text and generate:
1. An Executive Summary (clear, easy to understand).
2. Key Concepts & Definitions.
3. Important Formulas, Laws, or Principles.
4. Key Takeaways (5 bullet points for quick exam revision).
5. 4 Multiple-Choice Questions (MCQs) with 4 options, the exact correct answer, and an explanation.
6. 2 Conceptual Short-Answer Questions with ideal model answers.

Lesson Title: "{clean_title}"
Language requested: "{language}"
Lesson Content:
{clean_text[:6000]}

Return valid JSON strictly matching this schema:
{{
  "title": "{clean_title}",
  "summary": "Clear executive summary of the lesson...",
  "key_concepts": [
    {{"term": "Term Name", "definition": "Clear concise definition"}}
  ],
  "formulas_and_rules": [
    "Formula or rule with explanation"
  ],
  "bullet_takeaways": [
    "Core revision takeaway point"
  ],
  "mcq_questions": [
    {{
      "id": 1,
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Why this answer is correct based on the lesson."
    }}
  ],
  "short_answer_questions": [
    {{
      "id": 1,
      "question": "Conceptual question?",
      "ideal_answer": "Complete model answer for revision.",
      "key_point": "Key phrase required to score full marks"
    }}
  ]
}}
"""
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(model_name="gemini-1.5-flash")
            response = model.generate_content(
                prompt,
                generation_config={"temperature": 0.3, "response_mime_type": "application/json"},
            )
            data = json.loads(response.text)
            return data
        except Exception as e:
            logger.warning(f"Gemini API call failed, falling back to algorithmic analyzer: {e}")

    # Algorithmic fallback analyzer
    lines = [line.strip() for line in clean_text.split("\n") if line.strip()]
    sentences = [s.strip() for s in clean_text.replace("\n", " ").split(".") if len(s.strip()) > 15]

    summary_text = " ".join(sentences[:3]) if sentences else clean_text[:250] + "..."

    # Extract potential bullet points and concepts
    concepts = []
    for line in lines:
        if ":" in line and len(line) < 140:
            parts = line.split(":", 1)
            term = parts[0].replace("-", "").replace("*", "").strip()
            definition = parts[1].strip()
            if term and definition:
                concepts.append({"term": term, "definition": definition})
        if len(concepts) >= 4:
            break

    if not concepts:
        concepts = [
            {"term": "Core Principle", "definition": sentences[0] if sentences else "Primary conceptual foundation."},
            {"term": "Key Application", "definition": sentences[1] if len(sentences) > 1 else "Real-world physical or biological behavior."},
        ]

    takeaways = []
    for s in sentences[1:6]:
        takeaways.append(s + ".")
    if not takeaways:
        takeaways = [
            "Review the key definitions and formulas presented in this lesson.",
            "Practice recalling the core concepts before attempting the assessment questions.",
            "Consult the AI Tutor for clarification on challenging topics.",
        ]

    # Generate sample MCQs from the text
    mcqs = []
    for idx, c in enumerate(concepts[:3]):
        mcqs.append({
            "id": idx + 1,
            "question": f"Which of the following correctly defines '{c['term']}' according to the lesson?",
            "options": [
                c["definition"],
                f"An unrelated property that opposes {c['term'].lower()}.",
                f"A secondary factor that only applies at absolute zero temperature.",
                "None of the above statements are supported by the lesson.",
            ],
            "correct_answer": c["definition"],
            "explanation": f"As highlighted in the study material: {c['term']} is defined as {c['definition']}.",
        })

    # Add a general comprehension question
    mcqs.append({
        "id": len(mcqs) + 1,
        "question": f"What is the primary scientific focus of '{clean_title}'?",
        "options": [
            summary_text[:80] + "...",
            "Historical origins of unrelated mechanical devices.",
            "Hypothetical situations with no practical significance.",
            "Only theoretical mathematics without empirical observation.",
        ],
        "correct_answer": summary_text[:80] + "...",
        "explanation": "This represents the central executive theme of the uploaded study document.",
    })

    return {
        "title": clean_title,
        "summary": summary_text,
        "key_concepts": concepts,
        "formulas_and_rules": [
            "Pay close attention to standard SI units and dimensional quantities.",
            "Verify all conservation laws and boundary conditions stated in the text.",
        ],
        "bullet_takeaways": takeaways,
        "mcq_questions": mcqs,
        "short_answer_questions": [
            {
                "id": 1,
                "question": f"Explain the main significance of {clean_title} in physical or natural systems.",
                "ideal_answer": summary_text,
                "key_point": "State the fundamental concept and explain how it governs the observed phenomenon.",
            },
            {
                "id": 2,
                "question": "What key takeaway from this lesson can be observed in everyday rural life or agriculture?",
                "ideal_answer": "The concepts demonstrate how foundational scientific rules apply to local energy, botanical growth, or physical mechanics.",
                "key_point": "Connect the theoretical law to tangible real-world physical observations.",
            },
        ],
    }


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
