from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class ExtractionBase(BaseModel):
    filename: str
    file_size: int
    extracted_text: str
    page_count: Optional[int] = None

class ExtractionCreate(ExtractionBase):
    pass

class Extraction(ExtractionBase):
    id: int
    created_at: datetime
    processing_time: Optional[float] = None

    class Config:
        from_attributes = True