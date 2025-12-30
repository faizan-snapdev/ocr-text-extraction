import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, NotFound
from PIL import Image
from typing import List
import time
from app.core.config import settings

def extract_text_from_images(images: List[Image.Image]) -> str:
    """
    Extracts text from a list of images using Google Gemini Vision.
    """
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "DUMMY_KEY_FOR_NOW":
         raise ValueError("Gemini API Key is missing or invalid.")

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        # Use gemini-2.0-flash for stability on free tier
        model_name = 'gemini-2.0-flash'
        model = genai.GenerativeModel(model_name)
        
        full_text = ""
        batch_size = 15
        
        for i in range(0, len(images), batch_size):
            batch_images = images[i : i + batch_size]
            
            # Add delay to respect free tier rate limits (15 RPM)
            # With batching, we make fewer requests, so 1s delay is sufficient
            if i > 0:
                time.sleep(1)
                
            try:
                prompt_text = "Extract the text EXACTLY as it appears in these images. Do NOT add any headers, page numbers, or metadata that are not visible in the image. Do NOT use markdown for page breaks. Just output the raw text content sequentially."
                content = [prompt_text] + batch_images
                
                response = model.generate_content(content)
                if response.text:
                    print(f"DEBUG: Batch extracted {len(response.text)} characters.")
                    full_text += response.text + "\n\n"
            except NotFound:
                print(f"Model {model_name} not found. Please check if the API key supports this model.")
                raise ValueError(f"Model {model_name} not found or not available.")
            except ResourceExhausted:
                raise
            except Exception as e:
                print(f"Error processing batch starting at index {i}: {e}")
                continue
        
        return full_text
    except Exception as e:
        print(f"Gemini Vision API Error: {e}")
        raise e

def refine_text_with_gemini(text: str) -> str:
    """
    Refines and normalizes the extracted text using Google Gemini.
    """
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "DUMMY_KEY_FOR_NOW":
         # Raise exception instead of silently failing
         raise ValueError("Gemini API Key is missing or invalid (refine_text).")

    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        prompt = f"""
        Please correct any OCR errors, fix broken lines, and normalize whitespace in the following text. 
        Return only the corrected text.
        
        Text:
        {text[:30000]} 
        """
        # Limit characters to avoid token limits for this MVP
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API Error (refine_text): {e}")
        raise e