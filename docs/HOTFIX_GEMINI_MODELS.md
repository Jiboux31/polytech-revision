# HOTFIX_GEMINI_MODELS.md — Correction des modèles Gemini

> Appliquer AVANT le Run 3.

---

## Résultat des tests

| Modèle | String API | Status |
|--------|-----------|--------|
| ~~gemini-2.5-flash~~ | ~~gemini-2.5-flash~~ | 503 — NE PAS UTILISER |
| **Gemini 3 Flash** | `gemini-3-flash-preview` | **200 ✅ — MODÈLE PRINCIPAL** |
| **Gemini 3.1 Pro** | `gemini-3.1-pro-preview` | **200 ✅ — FALLBACK** |

## 1. Corriger `backend/config.py`

Remplacer tout le fichier par :

```python
import os
from dotenv import load_dotenv

# Charger le .env du projet SI il existe
load_dotenv()

# Puis charger le .env OpenClaw (qui contient la clé Gemini)
load_dotenv("/root/.openclaw/.env", override=False)

class Settings:
    PROJECT_NAME = "PolytechRevision"
    VERSION = "0.3.0"
    
    # API Keys
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    
    # Paths
    DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
    DB_PATH = os.path.join(DATA_DIR, "polytech.db")
    
    # LLM — modèles testés et fonctionnels (avril 2026)
    GEMINI_MODEL_FAST = "gemini-3-flash-preview"      # OCR + correction rapide
    GEMINI_MODEL_PRO = "gemini-3.1-pro-preview"        # cas complexes, fallback
    
    # API Gemini
    GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

settings = Settings()
```

## 2. Corriger `backend/services/llm_service.py` (Run 3)

Dans la spec Run 3, l'URL d'API et le modèle doivent utiliser `settings` :

```python
from config import settings

GEMINI_API_URL = settings.GEMINI_API_URL

async def call_gemini_vision(image_base64: str, prompt: str, model: str = None) -> dict:
    model = model or settings.GEMINI_MODEL_FAST
    url = f"{GEMINI_API_URL}/{model}:generateContent?key={settings.GEMINI_API_KEY}"
    # ... reste identique
```

## 3. Vérification au démarrage

Ajouter dans `backend/main.py`, dans le lifespan :

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Vérifier la clé Gemini
    if not settings.GEMINI_API_KEY:
        print("⚠️  GEMINI_API_KEY non trouvée ! La correction manuscrite ne fonctionnera pas.")
    else:
        print(f"✅ GEMINI_API_KEY chargée ({len(settings.GEMINI_API_KEY)} chars)")
        print(f"✅ Modèle principal : {settings.GEMINI_MODEL_FAST}")
    yield
```

## Git

```bash
git add .
git commit -m "Hotfix: correct Gemini model names + load API key from /root/.openclaw/.env"
git push origin main
```
