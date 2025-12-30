from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.config import settings
import os
from pathlib import Path
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class GeminiKeyUpdate(BaseModel):
    key: str

@router.get("/gemini-key")
def get_gemini_key_status():
    """
    Get the current status of the Gemini API key.
    Returns a masked version of the key if it exists.
    """
    key = settings.GEMINI_API_KEY
    is_set = bool(key)
    masked_key = None
    
    if is_set:
        if len(key) > 8:
            masked_key = f"{key[:4]}...{key[-4:]}"
        else:
            masked_key = "***"
    
    return {
        "is_set": is_set,
        "key": masked_key
    }

@router.post("/gemini-key")
def update_gemini_key(key_data: GeminiKeyUpdate):
    """
    Update the Gemini API key in the .env file and trigger a server reload.
    """
    new_key = key_data.key.strip()
    
    if not new_key:
        raise HTTPException(status_code=400, detail="API key cannot be empty")

    # Determine paths
    # Current file: backend/app/api/v1/config.py
    # Backend root: backend/
    current_file = Path(__file__).resolve()
    backend_root = current_file.parent.parent.parent.parent
    
    env_path = backend_root / ".env"
    main_py_path = backend_root / "app" / "main.py"
    
    # Fallback checks if standard structure isn't found (e.g. running from different context)
    if not env_path.exists():
        # Try finding .env in current working directory or one level up
        cwd = Path.cwd()
        if (cwd / "backend" / ".env").exists():
            env_path = cwd / "backend" / ".env"
            backend_root = cwd / "backend"
            main_py_path = backend_root / "app" / "main.py"
        elif (cwd / ".env").exists():
            env_path = cwd / ".env"
            # Assume we are in backend root
            backend_root = cwd
            main_py_path = backend_root / "app" / "main.py"

    logger.info(f"Updating .env at {env_path}")

    # Read existing .env content
    env_lines = []
    if env_path.exists():
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                env_lines = f.readlines()
        except Exception as e:
            logger.error(f"Failed to read .env file: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to read configuration: {str(e)}")
    
    # Update or Append GEMINI_API_KEY
    new_lines = []
    key_updated = False
    
    for line in env_lines:
        if line.strip().startswith("GEMINI_API_KEY="):
            new_lines.append(f"GEMINI_API_KEY={new_key}\n")
            key_updated = True
        else:
            new_lines.append(line)
            
    if not key_updated:
        # Ensure there is a newline before appending if the file wasn't empty and didn't end with one
        if new_lines and not new_lines[-1].endswith("\n"):
            new_lines[-1] += "\n"
        new_lines.append(f"GEMINI_API_KEY={new_key}\n")
        
    # Write back to .env
    try:
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception as e:
        logger.error(f"Failed to write .env file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update configuration: {str(e)}")

    # Trigger server reload by updating the modification time of main.py
    try:
        if main_py_path.exists():
            logger.info(f"Touching {main_py_path} to trigger reload")
            os.utime(main_py_path, None)
        else:
            logger.warning(f"Could not find main.py at {main_py_path} to trigger reload")
            # If main.py is not found, we can't easily trigger a reload from code 
            # without something like touching the file uvicorn is watching.
    except Exception as e:
        logger.warning(f"Failed to touch main.py: {e}")
        
    return {
        "message": "API Key updated. Server is reloading...",
        "status": "reloading"
    }