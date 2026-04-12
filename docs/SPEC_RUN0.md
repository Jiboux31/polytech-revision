# SPEC_RUN0_ENVIRONNEMENT_V1.md — Setup initial

> **Run** : 0 — Environnement & Structure
> **Objectif** : Projet bootable sur le VPS, repo GitHub prêt, frontend + backend qui démarrent
> **Durée estimée** : 1h-2h
> **Pré-requis** : Accès VPS (195.154.114.204), compte GitHub JB

---

## 1. Contexte

Ce run pose les fondations du projet **polytech-revision** : une web app de révision pour le concours Geipi Polytech 2026. L'architecture complète est décrite dans `SPEC_GENERALE_V1.md` (à lire avant ce document).

Le VPS tourne sous Ubuntu 20.04 avec Python 3.10 (`/usr/local/bin/python3.10`), 4 Go RAM + 4 Go swap. Léo travaille dans `/root/.openclaw/workspace-coder/`.

---

## 2. Tâches

### 2.1 Créer le repo GitHub

- Créer un nouveau repository `polytech-revision` sur le compte GitHub de JB
- **NE PAS** toucher aux autres repos existants
- Initialiser avec un `.gitignore` (Node + Python) et un `README.md` minimal
- Cloner dans le workspace : `/root/.openclaw/workspace-coder/polytech-revision/`

### 2.2 Structure des dossiers

Créer l'arborescence suivante :

```
polytech-revision/
├── .gitignore
├── .env.example                # Template des variables d'environnement
├── README.md
├── docs/
│   ├── SPEC_GENERALE_V1.md     # Copier depuis le fichier fourni
│   ├── SPEC_RUN0.md            # Ce fichier
│   ├── CHANGELOG.md            # Initialisé avec Run 0
│   └── DEVLOG.md               # Journal de développement Léo
├── backend/
│   ├── requirements.txt
│   ├── main.py                 # FastAPI minimal
│   ├── config.py               # Chargement .env
│   ├── models/
│   │   └── __init__.py
│   ├── routers/
│   │   └── __init__.py
│   ├── services/
│   │   └── __init__.py
│   ├── data/
│   │   ├── questions/           # Vide pour l'instant
│   │   ├── cours/               # Vide pour l'instant
│   │   └── annales/             # Vide pour l'instant
│   └── prompts/                 # Vide pour l'instant
├── frontend/
│   └── (créé par Vite, voir ci-dessous)
└── tests/
    └── __init__.py
```

### 2.3 Backend — FastAPI minimal

**Fichier** : `backend/requirements.txt`
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
python-dotenv==1.0.1
httpx==0.27.0
google-genai==1.14.0
pydantic==2.9.0
aiosqlite==0.20.0
Pillow==10.4.0
```

**Fichier** : `backend/config.py`
```python
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME = "PolytechRevision"
    VERSION = "0.1.0"
    
    # API Keys
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    MATHPIX_APP_ID = os.getenv("MATHPIX_APP_ID", "")
    MATHPIX_APP_KEY = os.getenv("MATHPIX_APP_KEY", "")
    
    # Paths
    DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
    DB_PATH = os.path.join(DATA_DIR, "polytech.db")
    
    # LLM
    GEMINI_MODEL_FAST = "gemini-3-flash"
    GEMINI_MODEL_PRO = "gemini-3-pro"

settings = Settings()
```

**Fichier** : `backend/main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # MVP : pas de restriction
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "PolytechRevision API", "version": settings.VERSION}

@app.get("/health")
async def health():
    return {"status": "ok"}
```

**Installation** :
```bash
cd /root/.openclaw/workspace-coder/polytech-revision/backend
/usr/local/bin/python3.10 -m pip install -r requirements.txt
```

**Test** :
```bash
cd /root/.openclaw/workspace-coder/polytech-revision/backend
/usr/local/bin/python3.10 -m uvicorn main:app --host 0.0.0.0 --port 8042 --reload
# Vérifier : curl http://localhost:8042/health → {"status": "ok"}
```

Port choisi : **8042** (peu probable d'être déjà utilisé).

### 2.4 Frontend — React + Vite + TypeScript

**Initialisation** :
```bash
cd /root/.openclaw/workspace-coder/polytech-revision
npx create-vite@latest frontend --template react-ts
cd frontend
npm install
```

**Dépendances additionnelles** :
```bash
npm install react-router-dom katex fabric axios
npm install -D @types/fabric
```

**Modifier** `frontend/vite.config.ts` :
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8042',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

**Créer** `frontend/src/App.tsx` minimal :
```tsx
function App() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>PolytechRevision</h1>
        <p>Bienvenue Garance ! 🎓</p>
        <p style={{ color: '#666' }}>L'app de révision est en cours de construction...</p>
      </div>
    </div>
  )
}

export default App
```

**Test** :
```bash
cd /root/.openclaw/workspace-coder/polytech-revision/frontend
npm run dev
# Vérifier : http://195.154.114.204:5173 → Page d'accueil
```

### 2.5 Fichier `.env.example`

```env
# === API Keys ===
GEMINI_API_KEY=your_gemini_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
MATHPIX_APP_ID=your_mathpix_app_id_here
MATHPIX_APP_KEY=your_mathpix_app_key_here

# === Server ===
BACKEND_PORT=8042
FRONTEND_PORT=5173
```

JB devra créer le vrai `.env` à partir de ce template.

### 2.6 Fichier `.gitignore`

```gitignore
# Python
__pycache__/
*.py[cod]
*.egg-info/
.env
venv/
*.db

# Node
node_modules/
dist/
.vite/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Data
backend/data/annales/*.pdf
*.png
*.jpg
```

### 2.7 README.md initial

```markdown
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
```

### 2.8 CHANGELOG.md initial

```markdown
# Changelog

## [0.1.0] - 2026-04-12

### Run 0 — Environnement
- Création du repo GitHub
- Structure du projet (backend + frontend + docs + tests)
- Backend FastAPI minimal (health check)
- Frontend React+Vite minimal (page d'accueil)
- Documentation initiale (SPEC_GENERALE, SPEC_RUN0)
```

### 2.9 DEVLOG.md initial

```markdown
# Journal de développement — PolytechRevision

## 2026-04-12 — Run 0

### Décisions
- Port backend : 8042
- Port frontend : 5173
- BDD : SQLite (fichier unique dans backend/data/)
- Pas de Docker pour le MVP (trop lourd pour 4Go RAM)

### Notes
- Python 3.10 via /usr/local/bin/python3.10
- pip via python3.10 -m pip (pip/pip3 cassé sur Ubuntu 20.04)
```

---

## 3. Tests de validation Run 0

Léo doit vérifier ces points avant de passer au Run 1 :

| # | Test | Commande | Résultat attendu |
|---|------|----------|-----------------|
| 1 | Backend démarre | `curl http://localhost:8042/health` | `{"status":"ok"}` |
| 2 | Frontend démarre | `curl -s http://localhost:5173 \| head -5` | HTML contenant "PolytechRevision" |
| 3 | Proxy fonctionne | `curl http://localhost:5173/api/health` | `{"status":"ok"}` |
| 4 | Repo GitHub | `git remote -v` | URL du repo JB |
| 5 | Commit initial | `git log --oneline -1` | Message "Run 0: environment setup" |
| 6 | Structure OK | `find . -name "*.py" -o -name "*.tsx" \| head -10` | Fichiers listés |

---

## 4. Rappels pour Léo

- **Backup avant toute modif** : `cp fichier fichier.bak-$(date +%Y%m%d-%H%M)`
- **Commandes séparées** : pas de `&&` — une commande à la fois avec vérification
- **Chemins absolus** pour Python : `/usr/local/bin/python3.10`
- **pip** : toujours `python3.10 -m pip`, jamais `pip` ou `pip3`
- **Git push** à la fin du run
- **Ne pas toucher** aux autres projets dans le workspace

---

## 5. Entrées/Sorties

**Entrées** : Ce fichier (`SPEC_RUN0.md`) + `SPEC_GENERALE_V1.md`

**Sorties attendues** :
- Repo GitHub `polytech-revision` créé et pushé
- Backend FastAPI qui répond sur le port 8042
- Frontend React qui s'affiche sur le port 5173
- Documentation à jour (README, CHANGELOG, DEVLOG)
- Message de confirmation avec les URLs de test
