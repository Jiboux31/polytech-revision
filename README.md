# PolytechRevision 🎓

Application web de révision pour le concours Geipi Polytech 2026.

## Stack
- **Frontend** : React + Vite + TypeScript + fabric.js + KaTeX
- **Backend** : Python 3.10 + FastAPI + SQLite
- **IA** : Google Gemini 3 (Flash/Pro) pour OCR manuscrit et correction

## Installation

### Pré-requis
- Python 3.10+
- Node.js 18+
- Clés API (voir `.env.example`)

### Backend
```bash
cd backend
python3.10 -m pip install -r requirements.txt
cp ../.env.example ../.env  # Remplir les clés
python3.10 -m uvicorn main:app --host 0.0.0.0 --port 8042 --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Documentation
- [Spec Générale](docs/SPEC_GENERALE_V1.md)
- [Changelog](docs/CHANGELOG.md)
