# PDFExtractPro Backend Architecture

## 1. Project Structure

We will use a standard, modular FastAPI directory structure to ensure scalability and maintainability.

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Application entry point
│   ├── core/                   # Core configuration
│   │   ├── __init__.py
│   │   ├── config.py           # Environment variables & settings
│   │   ├── database.py         # Database connection & session
│   │   └── security.py         # JWT handling & password hashing
│   ├── models/                 # SQLAlchemy database models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── extraction.py
│   ├── schemas/                # Pydantic models for request/response validation
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── token.py
│   │   └── extraction.py
│   ├── services/               # Business logic
│   │   ├── __init__.py
│   │   ├── pdf_service.py      # Native PDF parsing (PyMuPDF)
│   │   └── gemini_service.py   # Google Gemini AI integration
│   └── api/                    # API Route Handlers
│       ├── __init__.py
│       └── v1/
│           ├── __init__.py
│           ├── auth.py         # Authentication endpoints
│           └── extraction.py   # PDF extraction & history endpoints
├── .env                        # Environment variables (gitignored)
├── .gitignore
├── requirements.txt            # Python dependencies
└── README.md
```

## 2. Database Schema (SQLite)

We will use **SQLAlchemy** (ORM) with **SQLite** for the MVP.

### Table: `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | PK, Auto-increment | Unique user ID |
| `email` | String | Unique, Not Null, Index | User email address |
| `hashed_password` | String | Not Null | Bcrypt hashed password |
| `is_active` | Boolean | Default: True | Account status |
| `created_at` | DateTime | Default: func.now() | Registration timestamp |

### Table: `extractions`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | Integer | PK, Auto-increment | Unique extraction ID |
| `user_id` | Integer | FK(`users.id`), Index | Owner of the extraction |
| `filename` | String | Not Null | Name of the uploaded file |
| `file_size` | Integer | Not Null | Size in bytes |
| `extracted_text` | Text | Not Null | The final text content |
| `created_at` | DateTime | Default: func.now() | Extraction timestamp |

## 3. API Specification

All endpoints will be prefixed with `/api/v1`.

### Authentication
*   **POST** `/auth/register`
    *   **Body:** `{ "email": "user@example.com", "password": "securepassword" }`
    *   **Response:** `201 Created` - `{ "id": 1, "email": "..." }`
*   **POST** `/auth/login` (OAuth2 Password Request Form)
    *   **Body:** `username` (email), `password`
    *   **Response:** `200 OK` - `{ "access_token": "...", "token_type": "bearer" }`

### Extraction & History
*   **POST** `/extraction/upload`
    *   **Auth:** Required (Bearer Token)
    *   **Body:** `file` (Multipart/Form-Data)
    *   **Process:**
        1.  Validate PDF.
        2.  Extract text using `pdf_service` (PyMuPDF).
        3.  Validate/Normalize text using `gemini_service` (Google Gemini).
        4.  Save record to `extractions` table.
    *   **Response:** `200 OK` - `{ "id": 123, "filename": "doc.pdf", "text": "Extracted content..." }`
*   **GET** `/extraction/history`
    *   **Auth:** Required
    *   **Response:** `200 OK` - `[ { "id": 1, "filename": "...", "created_at": "..." }, ... ]`
*   **GET** `/extraction/history/{id}`
    *   **Auth:** Required (Must own the record)
    *   **Response:** `200 OK` - `{ "id": 1, "filename": "...", "text": "...", "created_at": "..." }`
*   **DELETE** `/extraction/history/{id}`
    *   **Auth:** Required (Must own the record)
    *   **Response:** `204 No Content`

## 4. Implementation Plan

This plan is designed for the **Code Mode** assistant to follow step-by-step.

### Step 1: Environment & Setup
1.  Create `backend` directory.
2.  Initialize virtual environment (optional but recommended) and create `requirements.txt`:
    *   `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `pydantic`, `python-multipart`, `python-jose[cryptography]`, `passlib[bcrypt]`, `pymupdf` (or `pdfplumber`), `google-generativeai`.
3.  Create basic `app/main.py` "Hello World" to verify setup.

### Step 2: Database & Core Configuration
1.  Implement `app/core/config.py` using `pydantic-settings` to manage env vars (`DATABASE_URL`, `SECRET_KEY`, `GEMINI_API_KEY`).
2.  Implement `app/core/database.py` to set up SQLAlchemy engine and `SessionLocal`.
3.  Implement `app/models/user.py` and `app/models/extraction.py`.
4.  Run a script or startup event to `Base.metadata.create_all(bind=engine)` to create tables.

### Step 3: Authentication System
1.  Implement `app/core/security.py` for password hashing (`passlib`) and JWT creation/decoding (`python-jose`).
2.  Create Pydantic schemas in `app/schemas/user.py` and `app/schemas/token.py`.
3.  Implement CRUD utilities for Users (create user, get user by email).
4.  Create `app/api/v1/auth.py` with `register` and `login` endpoints.
5.  Add `get_current_user` dependency for protecting routes.

### Step 4: PDF & Gemini Services
1.  Implement `app/services/pdf_service.py`:
    *   Function `extract_text_from_pdf(file_bytes) -> str`.
    *   Use `PyMuPDF` (aka `fitz`) for speed.
2.  Implement `app/services/gemini_service.py`:
    *   Configure Google Generative AI client.
    *   Function `refine_text_with_gemini(text) -> str`.
    *   Prompt engineering: "Correct any OCR errors and normalize whitespace in the following text...".

### Step 5: Extraction Endpoints
1.  Create `app/schemas/extraction.py`.
2.  Implement `app/api/v1/extraction.py`.
3.  **POST /upload**:
    *   Read uploaded file.
    *   Call `pdf_service`.
    *   (Optional: Async background task if too slow, but for MVP keep synchronous).
    *   Call `gemini_service`.
    *   Save to DB.
    *   Return result.
4.  **GET /history** & **DELETE**: Standard CRUD linked to `current_user`.

### Step 6: Integration & Refinement
1.  Wire up all routers in `app/main.py`.
2.  Add CORS middleware to allow requests from the React frontend (localhost:5173).
3.  Test endpoints using Swagger UI (`/docs`).

## 5. Notes for Code Implementation
*   **Security:** Ensure `SECRET_KEY` and `GEMINI_API_KEY` are read from environment variables.
*   **Error Handling:** Use `HTTPException` for standard errors (400 for bad login, 401 for unauthorized, 404 for not found).
*   **Validation:** Use Pydantic models strictly for request/response validation.