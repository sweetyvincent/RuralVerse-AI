import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.models.lesson import Document
from app.schemas.ai_tutor import ChatMessage, ChatResponse
from app.schemas.lesson import DocumentResponse
from app.services import ai_service, rag_service
from app.services.audit_service import log_action

router = APIRouter(prefix="/ai", tags=["AI Multilingual Tutor & RAG"])


@router.post("/chat", response_model=ChatResponse)
def chat_with_ai(
    data: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student", "teacher", "admin"])),
):
    """
    Multilingual AI Tutor query endpoint.
    Retrieves verified reference passages from uploaded textbooks via RAG
    and calls Google Gemini to formulate pedagogical explanations with cited sources.
    """
    result = ai_service.chat_with_tutor(
        db=db,
        user_id=current_user.id,
        message=data.message,
        language=data.language or "en",
        context=data.context,
    )
    return ChatResponse(response=result["response"], sources=result["sources"])


@router.post("/generate-questions/{document_id}")
def generate_questions_from_pdf(
    document_id: int,
    num_questions: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["student", "teacher", "admin"])),
):
    """
    RAG-powered Assessment Generator:
    Extracts knowledge from an uploaded lesson PDF and generates comprehension
    and quiz questions directly from the textbook material.
    """
    return ai_service.generate_questions_from_document(
        db=db,
        document_id=document_id,
        num_questions=num_questions,
    )


@router.get("/knowledge-base/documents", response_model=List[DocumentResponse])
def list_knowledge_documents(
    db: Session = Depends(get_db),
    user: User = Depends(require_role(["admin", "teacher"])),
):
    """List all reference documents uploaded for RAG indexing."""
    return rag_service.get_indexed_documents(db)


@router.post("/knowledge-base/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_knowledge_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin", "teacher"])),
):
    """Upload educational PDF document for RAG indexing."""
    upload_dir = os.path.join(settings.UPLOAD_DIR, "knowledge_base")
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)
    file_type = file.content_type or os.path.splitext(file.filename)[1]

    doc = Document(
        title=file.filename,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        status="pending",
        uploaded_by=admin.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    log_action(db, actor_id=admin.id, action="UPLOAD_KNOWLEDGE_DOC", target_type="document", target_id=doc.id)
    return doc


@router.post("/student/upload-lesson")
def upload_student_lesson_file(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["student", "teacher", "admin"])),
):
    """
    Accepts student-uploaded lesson documents (PDF, TXT, MD) and extracts clean text
    for note synthesis and question generation.
    """
    filename = file.filename or "Uploaded_Lesson.txt"
    ext = os.path.splitext(filename)[1].lower()

    content_text = ""
    try:
        file_bytes = file.file.read()
        if ext == ".pdf":
            import io
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            text_pages = [page.extract_text() for page in reader.pages if page.extract_text()]
            content_text = "\n\n".join(text_pages)
        else:
            content_text = file_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")

    if not content_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract readable text from the uploaded document.")

    title = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ")
    return {
        "title": title,
        "filename": filename,
        "content": content_text,
        "char_count": len(content_text),
    }


@router.post("/student/analyze-lesson")
def analyze_student_lesson(
    payload: dict,
    current_user: User = Depends(require_role(["student", "teacher", "admin"])),
):
    """
    Analyzes student lesson text and generates structured Key Notes and Assessment Questions.
    """
    title = payload.get("title", "Student Lesson")
    content = payload.get("content", "")
    language = payload.get("language", "en")

    if not content.strip():
        raise HTTPException(status_code=400, detail="Lesson content is required.")

    return ai_service.analyze_lesson_content(title=title, content=content, language=language)


@router.post("/knowledge-base/documents/{document_id}/index")
def trigger_document_indexing(
    document_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin", "teacher"])),
):
    """Extract text from uploaded PDF, segment into chunks, and index for semantic retrieval."""
    chunks_created = rag_service.index_document(db, document_id)
    log_action(db, actor_id=admin.id, action="INDEX_KNOWLEDGE_DOC", target_type="document", target_id=document_id)
    return {
        "status": "success",
        "message": f"Successfully indexed {chunks_created} passages from document.",
        "chunks_indexed": chunks_created,
    }


@router.delete("/knowledge-base/documents/{document_id}")
def delete_knowledge_document(
    document_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role(["admin"])),
):
    """Remove a reference document and its indexed semantic chunks."""
    rag_service.delete_document(db, document_id)
    log_action(db, actor_id=admin.id, action="DELETE_KNOWLEDGE_DOC", target_type="document", target_id=document_id)
    return {"message": "Document deleted successfully"}
