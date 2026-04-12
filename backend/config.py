import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME = "PolytechRevision"
    VERSION = "0.1.0"
    
    # API Keys
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    
    # Paths
    DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
    DB_PATH = os.path.join(DATA_DIR, "polytech.db")
    
    # LLM
    GEMINI_MODEL_FAST = "gemini-3-flash"
    GEMINI_MODEL_PRO = "gemini-3-pro"

settings = Settings()
