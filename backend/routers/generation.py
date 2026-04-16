from fastapi import APIRouter
from pydantic import BaseModel
from services.llm_service import call_gemini_text
import json

router = APIRouter(prefix="/generation", tags=["generation"])

class GenerationRequest(BaseModel):
    matiere: str       # "maths_qcm", "maths_specialite", "physique_chimie"
    chapitre: str      # "calculs_algebre", "fonctions", etc.
    nb_questions: int = 4

@router.post("/qcm")
async def generer_qcm(req: GenerationRequest):
    """Génère un exercice QCM dans le style Geipi Polytech."""
    prompt = f"""Tu es un concepteur de sujets pour le concours Geipi Polytech (post-bac, niveau Terminale).

Crée un exercice QCM de type VRAI/FAUX sur le chapitre "{req.chapitre}" en mathématiques.

RÈGLES :
- {req.nb_questions} affirmations à évaluer VRAI ou FAUX
- Niveau Terminale Spécialité Maths
- Style identique aux annales Geipi Polytech (formules, calculs, pas de contexte appliqué)
- Mélange de VRAI et de FAUX (pas tout vrai ni tout faux)
- Chaque affirmation doit tester une compétence différente
- Les pièges classiques du concours : signe, domaine de définition, sens d'inégalité, oubli de cas

Réponds UNIQUEMENT en JSON avec cette structure :
{{
  "enonce_commun": "texte introductif si nécessaire (ou vide)",
  "questions": [
    {{
      "enonce": "affirmation en LaTeX",
      "reponse": true ou false,
      "explication": "explication détaillée de la réponse"
    }}
  ],
  "indice": "un indice général pour l'exercice"
}}"""

    try:
        result_text = await call_gemini_text(prompt)
        # Nettoyer le JSON
        result_text = result_text.strip()
        if result_text.startswith("```"):
            result_text = result_text.split("\n", 1)[1].rsplit("```", 1)[0]
        result = json.loads(result_text)
        return {"status": "ok", "exercice": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}
