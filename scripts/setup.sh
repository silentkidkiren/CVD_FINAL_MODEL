#!/bin/bash
set -e

echo "╔══════════════════════════════════════════╗"
echo "║     CardioAI Pro — Setup Script          ║"
echo "╚══════════════════════════════════════════╝"

# ── PostgreSQL ────────────────────────────────
echo ""
echo "🗄️  Setting up PostgreSQL..."
sudo service postgresql start || true
sleep 2
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='cardioai'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER cardioai WITH PASSWORD 'cardioai123';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='cardioai_db'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE cardioai_db OWNER cardioai;"
echo "✅ PostgreSQL ready"

# ── Backend ───────────────────────────────────
echo ""
echo "🐍 Setting up Backend..."
cd backend
python -m venv venv
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
cp .env.example .env
echo "⚠️  Please edit backend/.env and add your GROQ_API_KEY"

# Run migrations
alembic upgrade head

# Seed data
python scripts/seed_data.py
echo "✅ Backend ready"
deactivate
cd ..

# ── Frontend ──────────────────────────────────
echo ""
echo "⚛️  Setting up Frontend..."
cd frontend
npm install --silent
cp .env.example .env.local
echo "✅ Frontend ready"
cd ..

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                      ║"
echo "║                                          ║"
echo "║  To start:                               ║"
echo "║  Terminal 1: cd backend && source        ║"
echo "║    venv/bin/activate && uvicorn          ║"
echo "║    app.main:app --reload --port 8000     ║"
echo "║                                          ║"
echo "║  Terminal 2: cd frontend && npm run dev  ║"
echo "╚══════════════════════════════════════════╝"