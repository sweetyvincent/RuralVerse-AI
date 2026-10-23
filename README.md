# RuralVerse AI

> **Intelligent • Multilingual • Immersive**  
> An accessible AI-powered educational web application built for rural students featuring **Air-Writing with webcam hand tracking**, an **Interactive 3D AR Science Lab**, **Multilingual AI Tutoring with RAG citations**, and **Offline-First learning support**.

---

## 🌟 Key Features

### 1. Air-Writing Studio (Replaces VR Classroom)
- **Zero expensive hardware**: Students write letters, equations, and science diagrams directly in the air in front of standard webcams.
- **MediaPipe Hand Landmarker**: Powered by client-side AI computer vision tracking the index fingertip (landmark 8) and thumb pinch gestures (pen lift).
- **4 Pedagogical Modes**: Free Expression, Alphabet & Number Practice, Math Board, and Science Diagrams.
- **Mouse / Touch / Stylus Fallback**: Automatically provides an alternative canvas for devices without camera access.
- **100% In-Browser Privacy**: Camera frames are processed strictly locally in the browser; no video footage is streamed to servers.

### 2. AR Virtual Science Laboratory
- **Interactive 3D Circuit Simulation**: Manipulate 9V battery terminals, wires, and knife switches. Real Ohm's law physics causes tungsten filament incandescence upon completing the closed loop.
- **Solar System 3D Exploration**: Gravitational orbital physics with planetary telemetry and atmosphere facts.
- **Human Heart Anatomy 3D**: 72 BPM cardiac systole/diastole pulse with labeled chambers (Aorta, Vena Cava, Ventricles).
- **Database Verified Completion**: Experiment sessions are recorded only upon genuine interaction events.

### 3. Multilingual AI Tutor with RAG & PDF Question Generation
- **Pedagogical AI**: Step-by-step tutoring in English, தமிழ் (Tamil), हिन्दी (Hindi), and తెలుగు (Telugu).
- **Retrieval-Augmented Generation (RAG)**: Extracts text from uploaded lesson textbooks, chunks passages, and retrieves verified citations.
- **PDF Question Generator**: Generates assessment questions directly from uploaded curriculum PDFs.
- **Transparent Status**: Returns honest status and clear configuration prompts when `GEMINI_API_KEY` is unconfigured.

### 4. Separate, Role-Guarded Access Portals
- **Student Portal (`/student/*`)**: Learning dashboard, AI tutor, Air-Writing studio, AR science lab, offline library, and quiz evaluation.
- **Teacher Portal (`/teacher/*`)**: Assigned class cohorts, student performance analysis, and lesson authoring.
- **Super Administrator Console (`/admin/*`)**: Real database-backed metrics, user role management, last-admin deletion safeguards, AI configuration, knowledge base PDF indexing, and security audit trail.

### 5. Offline-First Architecture
- Service worker caching for web application shell.
- Downloadable lesson packages for offline study.
- Local Air-Writing functionality and session persistence.
- Reconnection sync queue with duplicate attempt prevention.

### 6. Strict Real-Data Policy
- **Zero Mock Data**: Dashboards query the database in real time. Empty tables show genuine zero counts with clean empty states.
- **No Fabricated Users or Scores**: All assessment evaluations, completion records, and audit logs are real.

---

## 🛠️ Mandatory Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router v6, Three.js, MediaPipe Tasks Vision.
- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2, python-jose (JWT), passlib (bcrypt), PyPDF / PyPDF2.
- **Database**: SQLite (local development) / PostgreSQL (production target via Docker Compose).

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm 9+

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

Edit `backend/.env` with your settings:
```ini
DATABASE_URL=sqlite:///./ruralverse.db
SECRET_KEY=your-random-cryptographic-secret-key-at-least-32-chars
INITIAL_ADMIN_EMAIL=admin@ruralverse.org
INITIAL_ADMIN_PASSWORD=SuperAdminSecretPass123!
GEMINI_API_KEY=your-gemini-api-key-here
AI_MODEL_NAME=gemini-1.5-flash
FRONTEND_URL=http://localhost:5173
UPLOAD_DIR=./uploads
```

Initialize database & start the backend API:
```bash
# Initialize DB tables and bootstrap admin account
python -c "from app.core.database import init_db; init_db()"

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
API Documentation will be available at: `http://localhost:8000/api/docs`

### 3. Frontend Setup

In a new terminal:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔐 Secure Administrator Bootstrap

1. On first server launch, if `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` are configured in `.env` and no administrator exists, the server bootstraps the initial admin account.
2. The account is flagged with `must_change_password=True`.
3. After initial login at `/admin/login`, the admin is prompted to set a permanent password.
4. Remove `INITIAL_ADMIN_PASSWORD` from your `.env` file after first setup.

---

## 🧪 Running Automated Tests

Run backend tests verifying authentication, role isolation, admin security safeguards, and lesson lifecycles:

```bash
cd backend
python -m pytest tests -v
```

Run frontend type check & production build:
```bash
cd frontend
npm run build
```

---

## 🐳 Docker Deployment

To run the complete production stack (PostgreSQL + FastAPI + Frontend Nginx):

```bash
cp .env.example .env
docker-compose up -d --build
```

---

## 📄 License
Open-access educational platform built for rural advancement.
