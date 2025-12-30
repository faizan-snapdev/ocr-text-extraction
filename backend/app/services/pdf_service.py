import fitz  # PyMuPDF
from PIL import Image
import io
import os
from datetime import datetime
from typing import List

def convert_pdf_to_images(file_bytes: bytes) -> List[Image.Image]:
    """
    Converts a PDF file (bytes) into a list of PIL Images (one per page).
    Saves debug images to backend/debug_images/<timestamp>/.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    images = []

    # Create debug directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    debug_dir = os.path.join("debug_images", timestamp)
    os.makedirs(debug_dir, exist_ok=True)
    print(f"DEBUG: Saving PDF images to {debug_dir}")

    for i, page in enumerate(doc):
        # Set DPI to 150 (approximate) using matrix zoom. Default is 72 DPI.
        # 150 / 72 = 2.0833...
        zoom = 150 / 72
        matrix = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=matrix)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        # Save debug image
        image_path = os.path.join(debug_dir, f"page_{i+1}.png")
        img.save(image_path)
        
        images.append(img)
    
    print(f"DEBUG: Saved {len(images)} images.")
    return images

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from a PDF file provided as bytes.
    """
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    return text