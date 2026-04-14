from fastapi import APIRouter, HTTPException
from services.questions_service import (
    load_all_questions, get_questions_by_chapter,
    get_exercise_by_id, get_revision_plan
)

router = APIRouter(prefix="/exercices", tags=["exercices"])

@router.get("/plan")
async def plan_revision():
    return get_revision_plan()

@router.get("/chapitres/{matiere}")
async def liste_chapitres(matiere: str):
    all_q = load_all_questions()
    chapitres = set()
    for annale in all_q.get(matiere, []):
        for ex in annale.get("exercices", []):
            chapitres.add(ex.get("chapitre", ""))
    return {"matiere": matiere, "chapitres": sorted(chapitres)}

@router.get("/chapitre/{matiere}/{chapitre}")
async def questions_par_chapitre(matiere: str, chapitre: str):
    exercises = get_questions_by_chapter(matiere, chapitre)
    if not exercises:
        raise HTTPException(404, f"Aucun exercice pour {matiere}/{chapitre}")
    return {"matiere": matiere, "chapitre": chapitre, "exercices": exercises}

@router.get("/redige/{matiere}/{chapitre}")
async def exercices_rediges(matiere: str, chapitre: str):
    """Retourne les exercices rédigés d'un chapitre avec leurs sous-questions."""
    exercises = get_questions_by_chapter(matiere, chapitre)
    result = [ex for ex in exercises if "sous_questions" in ex]
    
    if not result:
        raise HTTPException(404, f"Aucun exercice rédigé pour {matiere}/{chapitre}")
    return {"matiere": matiere, "chapitre": chapitre, "exercices": result}

@router.get("/{exercise_id}")
async def get_exercise(exercise_id: str):
    ex = get_exercise_by_id(exercise_id)
    if not ex:
        raise HTTPException(404, f"Exercice {exercise_id} introuvable")
    return ex