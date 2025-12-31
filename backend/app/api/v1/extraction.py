import time
import logging
from typing import Any, List
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.extraction import Extraction
from app.schemas import extraction as extraction_schema
from google.api_core.exceptions import ResourceExhausted
from app.services import pdf_service, gemini_service

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload", response_model=extraction_schema.Extraction)
async def upload_pdf(
    *,
    db: Session = Depends(get_db),
    file: UploadFile = File(...)
) -> Any:
    """
    Upload a PDF file, extract text, refine it with Gemini, and save the result.
    """
    start_time = time.time()
    logger.info(f"Started uploading file: {file.filename}")

    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF allowed.")
    
    file_content = await file.read()
    file_size = len(file_content)
    logger.info(f"File received. Size: {file_size} bytes")
    
    # 1. Convert PDF to images (Gemini extraction pipeline)
    logger.info("Converting PDF to images...")
    try:
        images = pdf_service.convert_pdf_to_images(file_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error converting PDF to images: {str(e)}")
    
    page_count = len(images)
    logger.info(f"PDF converted to {page_count} images. Sending to Gemini Vision...")

    # 2. Extract text using Gemini Vision
    try:
        raw_text = gemini_service.extract_text_from_images(images)
    except ResourceExhausted:
        logger.warning("Gemini API Quota Exceeded (Vision).")
        raise HTTPException(status_code=429, detail="Gemini API Quota Exceeded. Please try again in a minute.")
    except Exception as e:
        logger.error(f"Gemini Vision Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error extracting text with Gemini Vision: {str(e)}")
    
    logger.info(f"Gemini Vision extraction finished. Text length: {len(raw_text)}")

    # 3. Refine text using Gemini - DISABLED for speed and to reduce hallucinations
    # We now trust the raw Vision extraction directly.
    
    end_time = time.time()
    processing_time = end_time - start_time
    logger.info(f"Saving to database. Total processing time: {processing_time:.2f}s")

    # 3. Save to database
    extraction = Extraction(
        filename=file.filename,
        file_size=file_size,
        extracted_text=raw_text,
        processing_time=processing_time,
        page_count=page_count
    )
    db.add(extraction)
    db.commit()
    db.refresh(extraction)
    
    return extraction

@router.get("/history", response_model=List[extraction_schema.Extraction])
def read_history(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve extraction history.
    """
    extractions = (
        db.query(Extraction)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return extractions

@router.get("/history/{id}", response_model=extraction_schema.Extraction)
def read_extraction(
    *,
    db: Session = Depends(get_db),
    id: int,
) -> Any:
    """
    Get a specific extraction by ID.
    """
    extraction = db.query(Extraction).filter(Extraction.id == id).first()
    if not extraction:
        raise HTTPException(status_code=404, detail="Extraction not found")
    return extraction

@router.delete("/history/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_extraction(
    *,
    db: Session = Depends(get_db),
    id: int,
):
    """
    Delete an extraction.
    """
    extraction = db.query(Extraction).filter(Extraction.id == id).first()
    if not extraction:
        raise HTTPException(status_code=404, detail="Extraction not found")
    
    db.delete(extraction)
    db.commit()
    return None