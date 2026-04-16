from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from models.database import init_db
from routers import exercices, correction, correction_redige, progression, dashboard, simulation, generation

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    
    # Vérifier la clé Gemini
    if not settings.GEMINI_API_KEY:
        print("⚠️ GEMINI_API_KEY non trouvée ! La correction manuscrite ne fonctionnera pas.")
    else:
        print(f"✅ GEMINI_API_KEY chargée ({len(settings.GEMINI_API_KEY)} chars)")
        print(f"✅ Modèle principal : {settings.GEMINI_MODEL_FAST}")
    
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(exercices.router, prefix="/api")
app.include_router(correction.router, prefix="/api")
app.include_router(correction_redige.router, prefix="/api")
app.include_router(progression.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(simulation.router, prefix="/api")
app.include_router(generation.router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "PolytechRevision API", "version": settings.VERSION}


@app.get("/health")
async def health():
    return {"status": "ok"}
