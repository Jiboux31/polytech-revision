from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Optional
from services.scoring import score_qcm_exercise
from services.questions_service import get_exercise_by_id

router = APIRouter(prefix="/correction", tags=["correction"])

class QCMSubmission(BaseModel):
    exercise_id: str
    reponses: Dict[str, Optional[bool]]

@router.post("/qcm")
async def corriger_qcm(submission: QCMSubmission):
    exercise = get_exercise_by_id(submission.exercise_id)
    if not exercise:
        return {"error": "Exercice introuvable"}
    
    bonnes_reponses = {}
    explications = {}
    for q in exercise.get("questions", []):
        bonnes_reponses[q["id"]] = q["reponse"]
        explications[q["id"]] = q.get("explication", "")
    
    result = score_qcm_exercise(submission.reponses, bonnes_reponses)
    
    for detail in result["details"]:
        detail["explication"] = explications.get(detail["id"], "")
        detail["bonne_reponse"] = bonnes_reponses.get(detail["id"])
    
    ratio = result["nb_correct"] / max(1, len(bonnes_reponses))
    if ratio >= 0.8:
        result["feedback"] = f"Excellent Garance ! {result['nb_correct']}/{len(bonnes_reponses)} bonnes réponses."
    elif ratio >= 0.5:
        result["feedback"] = f"Pas mal ! {result['nb_correct']}/{len(bonnes_reponses)}. Revois les points manqués."
    else:
        result["feedback"] = f"Courage Garance ! {result['nb_correct']}/{len(bonnes_reponses)}. Reprends le cours associé."
    
    result["indice_exercice"] = exercise.get("indice", "")
    
    return result
