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
    from config import settings
    
    matiere_label = {
        "maths_qcm": "mathématiques",
        "maths_specialite": "mathématiques",
        "physique_chimie": "physique-chimie"
    }.get(req.matiere, "mathématiques")

    prompt = f"""Tu es un concepteur de sujets pour le concours Geipi Polytech (post-bac, niveau Terminale).

Crée un exercice QCM de type VRAI/FAUX sur le chapitre "{req.chapitre}" en {matiere_label}.

RÈGLES :
- {req.nb_questions} affirmations à évaluer VRAI ou FAUX
- Niveau Terminale Spécialité
- Style identique aux annales Geipi Polytech (formules, calculs, rigueur scientifique)
- Mélange de VRAI et de FAUX (pas tout vrai ni tout faux)
- Chaque affirmation doit tester une compétence différente
- Les pièges classiques du concours : signe, domaine de définition, sens d'inégalité, oubli de cas

IMPORTANT POUR LE FORMAT :
- Utilise du LaTeX pour TOUTES les formules mathématiques.
- Utilise les délimiteurs $ ... $ pour le LaTeX en ligne.
- Ne double pas les backslashes manuellement, l'API JSON s'en chargera.

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

    async def try_generate(model_name):
        result_text = await call_gemini_text(prompt, model=model_name, is_json=True)
        try:
            return json.loads(result_text)
        except json.JSONDecodeError as e:
            print(f"DEBUG: JSONDecodeError with {model_name}. Raw text: {result_text[:200]}...")
            raise e

    try:
        # Essayer d'abord avec Flash pour la rapidité
        try:
            result = await try_generate(settings.GEMINI_MODEL_FAST)
            return {"status": "ok", "exercice": result}
        except Exception as e:
            print(f"WARNING: Generation with Flash failed ({str(e)}), retrying with Pro...")
            # Repli sur Pro en cas d'échec (plus robuste sur le JSON)
            result = await try_generate(settings.GEMINI_MODEL_PRO)
            return {"status": "ok", "exercice": result}
            
    except Exception as e:
        # Log de l'erreur pour diagnostic
        print(f"ERROR: Generation failed: {str(e)}")
        return {"status": "error", "message": f"Échec de la génération IA après tentatives : {str(e)}"}
