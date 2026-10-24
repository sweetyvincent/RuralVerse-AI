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
    Analyzes an uploaded student lesson/PDF and generates exhaustive Key Revision Notes
    strictly formatted in structured bullet points (covering all important content from the text),
    along with assessment questions (MCQs & Short Answer).
    """
    clean_title = title.strip() or "Uploaded Student Lesson"
    clean_text = content.strip()

    if not clean_text:
        raise HTTPException(status_code=400, detail="Lesson content is empty.")

    api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")

    if api_key:
        prompt = f"""
You are an expert curriculum developer and academic tutor. A student has uploaded a lesson document/PDF.
You must extract and synthesize ALL IMPORTANT CONTENT from the entire document into structured, high-yield KEY POINTS.

CRITICAL INSTRUCTIONS:
- Format ALL notes strictly in BULLET POINTS / KEY POINTS. Do NOT write long paragraphs of prose.
- Cover ALL key topics, subtopics, scientific principles, facts, data, mechanisms, and examples present in the text so nothing important is missed.
- Organize the output clearly into:
  1. "summary_points": 4-6 high-yield summary bullet points outlining the core thesis of the lesson.
  2. "comprehensive_key_points": Section-by-section breakdown of the entire document into categorized key points (e.g. "Fundamental Principles", "Structure & Anatomy", "Working Mechanism & Reactions", "Applications & Observations", "Important Rules & Constants"). Each category must have 4-8 comprehensive bullet points.
  3. "key_concepts": All crucial terms, nomenclature, and definitions defined as concise bullet points.
  4. "formulas_and_rules": All equations, formulas, mathematical relationships, chemical reactions, or physical laws in bullet points with parameter explanations.
  5. "bullet_takeaways": 6-8 rapid-fire exam recall points.
  6. "mcq_questions": 4-5 multiple choice questions with options and explanations.
  7. "short_answer_questions": 2-3 conceptual questions with model answers.

Lesson Title: "{clean_title}"
Language requested: "{language}"
Lesson Content:
{clean_text[:7500]}

Return valid JSON strictly matching this schema:
{{
  "title": "{clean_title}",
  "summary_points": [
    "Key point 1 summarizing the core concept...",
    "Key point 2 summarizing the mechanism..."
  ],
  "comprehensive_key_points": [
    {{
      "category": "Topic / Section Name",
      "points": [
        "Exhaustive, high-yield key point 1...",
        "Exhaustive, high-yield key point 2...",
        "Exhaustive, high-yield key point 3..."
      ]
    }}
  ],
  "key_concepts": [
    {{"term": "Term Name", "definition": "Clear, precise bullet definition", "key_takeaway": "Why it matters in exams"}}
  ],
  "formulas_and_rules": [
    "Formula, equation, or law with parameter definitions"
  ],
  "bullet_takeaways": [
    "High-yield must-know point for exam revision"
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
      "ideal_answer": "Complete model answer in points.",
      "key_point": "Key mark-scoring keyword or principle"
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

    # Comprehensive Algorithmic Fallback Analyzer
    lines = [line.strip() for line in clean_text.split("\n") if line.strip()]
    sentences = [s.strip() for s in clean_text.replace("\n", " ").split(".") if len(s.strip()) > 15]

    # Summary in crisp points
    summary_points = [
        f"{s}." for s in sentences[:5]
    ] if sentences else [f"Comprehensive review of {clean_title}."]

    # Extract all concepts and definitions from colons or bullet patterns
    concepts = []
    formulas = []
    for line in lines:
        cleaned_line = line.replace("-", "").replace("*", "").replace("•", "").strip()
        if ":" in cleaned_line and len(cleaned_line) < 200:
            parts = cleaned_line.split(":", 1)
            term = parts[0].strip()
            def_text = parts[1].strip()
            if len(term) < 40 and len(def_text) > 8:
                concepts.append({"term": term, "definition": def_text, "key_takeaway": f"Core definition for {term}."})
        elif any(char in line for char in ["=", "➔", "->", "+", "λ", "Ω", "Δ", "×"]):
            if len(line) < 180 and not line.startswith("http"):
                formulas.append(line)

    if not concepts:
        concepts = [
            {"term": "Core Scientific Principle", "definition": sentences[0] if sentences else "Primary conceptual foundation.", "key_takeaway": "Fundamental exam definition."},
            {"term": "Working Mechanism", "definition": sentences[1] if len(sentences) > 1 else "Governing operational process.", "key_takeaway": "Process and causal relationship."},
            {"term": "Key Property / Factor", "definition": sentences[2] if len(sentences) > 2 else "Measurable physical/biological trait.", "key_takeaway": "Standard classification criteria."}
        ]

    if not formulas:
        formulas = [
            "Ensure all standard SI units and dimensional parameters are verified during calculations.",
            "Consistently apply fundamental conservation laws (Mass, Energy, Momentum, Charge) across boundary conditions.",
        ]

    # Group comprehensive key points by section/topic covering all content
    categorized_points = []
    
    # Split by headings (#, ##, or capitalized titles) or chunk sentences
    section_title = "Fundamental Core Concepts"
    current_points = []
    
    for line in lines:
        if line.startswith("#") or (line.isupper() and len(line) < 50):
            if current_points:
                categorized_points.append({"category": section_title, "points": current_points[:8]})
                current_points = []
            section_title = line.replace("#", "").strip()
        elif len(line) > 20:
            clean_p = line.replace("-", "").replace("*", "").replace("•", "").strip()
            if clean_p and clean_p not in current_points:
                current_points.append(clean_p)

    if current_points:
        categorized_points.append({"category": section_title, "points": current_points[:8]})

    if not categorized_points:
        categorized_points = [
            {
                "category": f"Key Principles of {clean_title}",
                "points": [f"{s}." for s in sentences[:8]],
            }
        ]

    takeaways = [
        f"Master the core definition: {concepts[0]['term']} is defined as {concepts[0]['definition']}.",
        f"Remember the primary governing rule: {formulas[0]}.",
        f"Examine how {clean_title} operates under varying physical/environmental parameters.",
        "Practice drawing labeled diagrams and schematics for descriptive examination sections.",
        "Test yourself with the auto-generated assessment quiz questions below."
    ]

    mcqs = []
    for idx, c in enumerate(concepts[:3]):
        mcqs.append({
            "id": idx + 1,
            "question": f"According to the lesson, which statement accurately defines '{c['term']}'?",
            "options": [
                c["definition"],
                f"An extraneous secondary effect that opposes {c['term'].lower()}.",
                f"A property that only occurs at extreme non-standard temperatures.",
                "None of the above statements represent the correct definition.",
            ],
            "correct_answer": c["definition"],
            "explanation": f"As highlighted in the study material: {c['term']} is defined as {c['definition']}.",
        })

    mcqs.append({
        "id": len(mcqs) + 1,
        "question": f"What is the central focus of the lesson '{clean_title}'?",
        "options": [
            summary_points[0] if summary_points else "Foundational study material.",
            "Historical origins of unrelated mechanical devices.",
            "Purely fictional hypotheses with no scientific relevance.",
            "Non-standard conjectures unsupported by experimental evidence.",
        ],
        "correct_answer": summary_points[0] if summary_points else "Foundational study material.",
        "explanation": "This represents the primary thesis and conceptual foundation of the uploaded text.",
    })

    return {
        "title": clean_title,
        "summary_points": summary_points,
        "comprehensive_key_points": categorized_points,
        "key_concepts": concepts,
        "formulas_and_rules": formulas,
        "bullet_takeaways": takeaways,
        "mcq_questions": mcqs,
        "short_answer_questions": [
            {
                "id": 1,
                "question": f"State the primary significance of {clean_title} in physical or natural systems.",
                "ideal_answer": " • " + "\n • ".join(summary_points[:3]),
                "key_point": "State the fundamental concept and explain how it governs the observed phenomenon.",
            },
            {
                "id": 2,
                "question": "What key takeaway from this lesson can be observed in everyday rural life or agriculture?",
                "ideal_answer": " • Scientific principles apply directly to local energy, botanical growth, or physical mechanics.\n • Observation and measurement verify theoretical models in everyday environments.",
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
