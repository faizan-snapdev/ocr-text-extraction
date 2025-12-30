import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.api.v1 import auth, extraction, config

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# CORS Configuration
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:5137",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5137",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(extraction.router, prefix=f"{settings.API_V1_STR}/extraction", tags=["Extraction"])
app.include_router(config.router, prefix=f"{settings.API_V1_STR}/config", tags=["Configuration"])

@app.get("/")
def read_root():
    return {"message": "Welcome to PDFExtractPro API", "docs_url": "/docs"}

@app.on_event("startup")
async def startup_event():
    logger = logging.getLogger("uvicorn.info")
    if settings.GEMINI_API_KEY:
        masked_key = f"{settings.GEMINI_API_KEY[:4]}...{settings.GEMINI_API_KEY[-4:]}" if len(settings.GEMINI_API_KEY) > 8 else "***"
        logger.info(f"Startup Config Check: GEMINI_API_KEY found: {masked_key}")
    else:
        logger.warning("Startup Config Check: GEMINI_API_KEY is MISSING or empty.")