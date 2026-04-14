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