# RuralVerse AI — Deployment Guide

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm 9+

### Backend Setup

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt

# Create .env from template
cp ../.env.example .env
# Edit .env with your settings (at minimum, set SECRET_KEY)

# Initialize database
python -c "from app.core.database import init_db; init_db()"

# Run migrations
alembic upgrade head

# Start backend
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Admin Bootstrap

Set these environment variables before first startup:
```
INITIAL_ADMIN_EMAIL=admin@yourdomain.com
INITIAL_ADMIN_PASSWORD=your-secure-temporary-password
```

The admin account will be created on first startup. You will be required to change the password on first login.

**IMPORTANT:** Remove INITIAL_ADMIN_PASSWORD from .env after the first admin account is created.

## Docker Deployment

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with production values

# Build and start
docker-compose up -d --build

# Run migrations
docker-compose exec backend alembic upgrade head
```

## Production Configuration

### Required Environment Variables
- `SECRET_KEY` — Random 32+ character string
- `DATABASE_URL` — PostgreSQL connection string
- `FRONTEND_URL` — Frontend origin for CORS

### Optional Environment Variables
- `GEMINI_API_KEY` — For AI tutor functionality
- `INITIAL_ADMIN_EMAIL` — First admin bootstrap (one-time)
- `INITIAL_ADMIN_PASSWORD` — First admin password (one-time, remove after use)

### Security Checklist
- [ ] Change SECRET_KEY to a cryptographically random value
- [ ] Use PostgreSQL in production
- [ ] Set appropriate CORS origins
- [ ] Enable HTTPS
- [ ] Remove bootstrap credentials after admin creation
- [ ] Configure rate limiting
- [ ] Set up database backups
