# MedGuard
# MedGuard – Medication Safety Intelligence

> **"Every Prescription Deserves a Second Look."**  
> *TalentAP Mega Hackathon 2026 — Healthcare Problem Track H4*  
> **Development Stage:** Phase 1: Project Foundation Only

---

## 1. Project Overview

MedGuard is an enterprise-grade medication safety intelligence platform inspired by modern hospital information systems and clinical decision support protocols. Designed to prevent adverse drug events (ADEs), drug-drug interactions, and contraindication risks before medications are dispensed, MedGuard provides a clinical second look at every prescription.

Phase 1 establishes the foundational monorepo architecture, development environment, clinical design system, and decoupled frontend/backend services.

---

## 2. Monorepo Architecture

```text
MedGuard/
├── FULL_CODE/
│   ├── web/                     # Frontend: React + TypeScript + Vite + Tailwind CSS
│   │   ├── src/
│   │   │   ├── components/      # Modular UI components (Layout, Common, Views)
│   │   │   ├── services/        # API client and health service
│   │   │   ├── types/           # Navigation and API interfaces
│   │   │   ├── App.tsx          # Application shell & state
│   │   │   └── index.css        # Tailwind CSS v4 clinical design tokens
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts       # Vite configuration with proxy to FastAPI (:8000)
│   ├── api/                     # Backend: Python + FastAPI + Uvicorn
│   │   ├── app/
│   │   │   ├── core/            # Configuration and environment settings
│   │   │   ├── routes/          # API route definitions (health check)
│   │   │   ├── models/          # Data models module
│   │   │   ├── services/        # Clinical safety business logic (Phase 2+)
│   │   │   └── main.py          # FastAPI application entrypoint
│   │   └── requirements.txt     # Python dependency specifications
│   ├── pipeline/                # Safety intelligence & ingestion pipelines (Phase 2+)
│   │   ├── __init__.py
│   │   └── README.md
│   ├── tests/                   # Automated test suite
│   │   ├── __init__.py
│   │   └── test_health.py       # Health check API test cases
│   ├── db/                      # Database persistence layer
│   │   ├── schema.sql           # SQLite initial schema (Supabase-ready)
│   │   └── init_db.py           # Database bootstrap script
│   └── .env.example             # Environment configuration template
├── README.md                    # Project documentation
└── .gitignore                   # Monorepo version control ignore rules
```

---

## 3. Design Identity

Built specifically for high-acuity clinical environments, avoiding generic consumer AI dashboard patterns, neon colors, glassmorphism, or non-functional animations.

| Design Token | Value | Clinical Usage |
| :--- | :--- | :--- |
| **Deep Navy** | `#17324D` | Clinical header, primary navigation, emphasized typography |
| **Teal** | `#168C83` | Action indicators, active clinical state, verification badges |
| **White** | `#FFFFFF` | Card surfaces, modal dialogs, data table backgrounds |
| **Light Grey** | `#F4F6F8` | Application background, subtle dividers, neutral panels |
| **Borders** | `#E2E8F0` | High-contrast clinical grid lines and structured cards |

---

## 4. Technology Stack

- **Frontend**: React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide React icons
- **Backend**: Python 3.13, FastAPI, Uvicorn (ASGI), Pydantic v2
- **Database**: SQLite (initial Phase 1 foundation; clean DDL ready for Supabase PostgreSQL migration)
- **Testing**: Pytest, FastAPI TestClient, TypeScript strict compiler check
- **Version Control**: Git

---

## 5. Getting Started & Setup Instructions

### Prerequisites
- **Node.js**: v20.18.0 or higher
- **npm**: v10.8.0 or higher
- **Python**: 3.10 or higher
- **Git**

---

### Step 1: Initialize Environment Configuration
Copy `.env.example` in `FULL_CODE/` to `.env`:
```powershell
cp FULL_CODE/.env.example FULL_CODE/.env
```

---

### Step 2: Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```powershell
   cd FULL_CODE/api
   ```

2. Create a virtual environment:
   ```powershell
   python -m venv .venv
   ```

3. Activate the virtual environment:
   - **Windows PowerShell**:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - **Linux/macOS**:
     ```bash
     source .venv/bin/activate
     ```

4. Install backend dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

5. Initialize the SQLite database:
   ```powershell
   cd ../db
   ..\api\.venv\Scripts\python.exe init_db.py
   cd ../api
   ```

6. Start the FastAPI development server:
   ```powershell
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   The backend API is available at:
   - Health Check: `http://127.0.0.1:8000/api/health`
   - Interactive Swagger Docs: `http://127.0.0.1:8000/docs`
   - Alternative ReDoc: `http://127.0.0.1:8000/redoc`

---

### Step 3: Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the web directory:
   ```powershell
   cd FULL_CODE/web
   ```

2. Install npm dependencies:
   ```powershell
   npm install
   ```

3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   The application shell is available at: `http://localhost:5173`

4. Verify production build:
   ```powershell
   npm run build
   ```

---

### Step 4: Run Automated Tests

To run the backend test suite:
```powershell
cd FULL_CODE/tests
..\api\.venv\Scripts\pytest.exe -v
```

---

## 6. Health Check API Specification

- **Endpoint**: `GET /api/health`
- **Response Format**:
  ```json
  {
    "status": "healthy",
    "service": "MedGuard - Medication Safety Intelligence",
    "tagline": "Every Prescription Deserves a Second Look",
    "hackathon": "TalentAP Mega Hackathon 2026 – Healthcare Problem H4",
    "version": "0.1.0",
    "stage": "Phase 1: Project foundation",
    "timestamp": "2026-10-30T06:21:22.121196+00:00",
    "database": {
      "type": "sqlite",
      "status": "ready"
    }
  }
  ```

---

## 7. Phase 1 Implementation Safeguards

- **No Synthetic Patient Data**: No fabricated clinical outcomes, mock patients, or fake safety verdicts have been inserted into the database.
- **Strict Decoupling**: Frontend and backend can run and be developed independently.
- **Modular Codebase**: Clean separation of layout, views, common components, models, routes, and configuration.
- **Supabase Integration Staged**: Database schema uses strict relational types that easily migrate to Supabase in subsequent phases.
