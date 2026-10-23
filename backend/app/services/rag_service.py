import os
import re
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
try:
    from pypdf import PdfReader
except ImportError:
    try:
        from PyPDF2 import PdfReader
    except ImportError:
        PdfReader = None

from app.models.lesson import Document, DocumentChunk
from app.models.lesson import Lesson, LearningResource

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> str:
    """Extract clean text content from a PDF file using pypdf or PyPDF2."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    if PdfReader is None:
        raise ImportError("Neither pypdf nor PyPDF2 is installed on the server.")
    
    reader = PdfReader(file_path)
    extracted_text = []
    for i, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        if page_text.strip():
            extracted_text.append(f"[Page {i+1}]\n{page_text}")
            
    return "\n\n".join(extracted_text)


def chunk_text(text: str, chunk_size: int = 1200, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks suitable for semantic context retrieval."""
    if not text.strip():
        return []

    # Clean whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        if end >= len(text):
            break
        start += (chunk_size - overlap)

    return chunks


def index_document(db: Session, document_id: int) -> int:
    """Index a document: extract text, chunk it, and store chunks with metadata."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    try:
        # Clear existing chunks
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()

        # Extract text
        if doc.file_path.lower().endswith(".pdf"):
            full_text = extract_text_from_pdf(doc.file_path)
        else:
            with open(doc.file_path, "r", encoding="utf-8", errors="ignore") as f:
                full_text = f.read()

        if not full_text.strip():
            doc.status = "failed"
            db.commit()
            raise HTTPException(status_code=400, detail="No readable text extracted from document")

        # Chunk text
        chunks = chunk_text(full_text)
        
        for idx, chunk_str in enumerate(chunks):
            # Compute a lightweight word-frequency token map for fast BM25/keyword retrieval
            words = [w.lower() for w in re.findall(r'\b\w{3,}\b', chunk_str)]
            word_freq = {}
            for w in words:
                word_freq[w] = word_freq.get(w, 0) + 1

            chunk_record = DocumentChunk(
                document_id=doc.id,
                content=chunk_str,
                chunk_index=idx,
                embedding=json.dumps(word_freq),  # Lightweight term vector
            )
            db.add(chunk_record)

        doc.status = "indexed"
        db.commit()
        return len(chunks)

    except Exception as e:
        logger.error(f"Error indexing document {document_id}: {e}")
        doc.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Indexing failed: {str(e)}")


def retrieve_relevant_passages(db: Session, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Retrieve top relevant document chunks matching user query."""
    query_words = [w.lower() for w in re.findall(r'\b\w{3,}\b', query)]
    if not query_words:
        return []

    # Query all indexed chunks
    chunks = (
        db.query(DocumentChunk, Document)
        .join(Document, DocumentChunk.document_id == Document.id)
        .filter(Document.status == "indexed")
        .all()
    )

    scored_chunks = []
    for chunk, doc in chunks:
        score = 0
        if chunk.embedding:
            try:
                term_freq = json.loads(chunk.embedding)
                for qw in query_words:
                    if qw in term_freq:
                        score += term_freq[qw] * 2
            except Exception:
                pass

        # Text containment bonus
        chunk_lower = chunk.content.lower()
        for qw in query_words:
            if qw in chunk_lower:
                score += 1

        if score > 0:
            scored_chunks.append({
                "score": score,
                "content": chunk.content,
                "document_title": doc.title,
                "document_id": doc.id,
                "chunk_index": chunk.chunk_index,
            })

    # Sort descending by score
    scored_chunks.sort(key=lambda x: x["score"], reverse=True)
    return scored_chunks[:top_k]


def get_indexed_documents(db: Session) -> List[Document]:
    return db.query(Document).order_by(Document.created_at.desc()).all()


def delete_document(db: Session, document_id: int) -> None:
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError:
            pass

    db.delete(doc)
    db.commit()
