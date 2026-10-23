# RuralVerse AI — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ React UI │ │MediaPipe │ │ Three.js │ │ Service Worker    │  │
│  │ (Vite)   │ │(Air-Write)│ │(AR Lab)  │ │ (Offline/PWA)    │  │
│  └────┬─────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│       │                                                         │
│       │ REST API (JWT Auth)                                     │
└───────┼─────────────────────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────────────────────┐
│                     FastAPI Backend                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │   Auth   │ │  Admin   │ │ AI Tutor │ │  RAG Pipeline    │   │
│  │ (JWT+    │ │  (RBAC)  │ │ (Gemini) │ │ (PDF→Chunk→Embed)│   │
│  │  RBAC)   │ │          │ │          │ │                  │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────────────┘   │
│       │             │            │             │                 │
│       └─────────────┴────────────┴─────────────┘                │
│                          │                                      │
│                    SQLAlchemy ORM                                │
└──────────────────────────┼──────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │   SQLite (Dev) /        │
              │   PostgreSQL (Prod)     │
              └─────────────────────────┘
```

## Key Design Decisions

### Authentication
- JWT tokens with configurable expiration
- bcrypt password hashing via passlib
- Role-based access control (admin, teacher, student)
- Admin bootstrap via environment variables
- Server-side role enforcement on every endpoint

### Data Integrity
- All metrics derived from database queries
- No fake/seed data in production
- Empty states display zero counts
- Audit logging for admin actions

### AI Integration
- Gemini API for LLM chat
- RAG: PDF upload → text extraction → chunking → embedding → similarity search
- Graceful fallback when API key not configured
- Server-side only — no API keys in frontend

### Air-Writing
- MediaPipe Hand Landmarker (client-side)
- HTML Canvas for stroke rendering
- Mouse/touch fallback
- No camera frames sent to server

### AR Science Lab
- Three.js / React Three Fiber
- Interactive 3D simulations
- Fallback 3D viewer (no VR required)

### Offline Support
- Service Worker for asset caching
- IndexedDB for offline lesson storage
- Sync queue for progress events
