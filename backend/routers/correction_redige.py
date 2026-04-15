from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import aiosqlite
import base64
import os
import time

from config import settings
from services.llm_service import correct_handwritten_answer
from services.questions_service import get_exercise_by_id

router = APIRouter(prefix="/correction", tags=["correction"])

class RedigeSubmission(BaseModel):
    exercise_id: str          # ex: "MSPE2025-I"
    sub_question_id: str      # ex: "MSPE2025-I-1"
    image_base64: str         # PNG en base64 (sans le préfixe data:image/png;base64,)
    indice_utilise: int = 0
    temps_reponse_sec: int = 0

class ExerciceSubmission(BaseModel):
    exercise_id: str
    question_id: str
    type: str = "manuscrit"
    selected: Optional[list] = None
    options: Optional[list] = None
    images: Optional[dict] = None
    indice_utilise: int = 0
    temps_reponse_sec: int = 0

@router.post("/exercice")
async def corriger_exercice(submission: ExerciceSubmission):
    """Corrige une question d'exercice (QCM ou manuscrit)."""
    # 1. Trouver la question
    exercise = get_exercise_by_id(submission.exercise_id)
    if not exercise:
        raise HTTPException(404, f"Exercice {submission.exercise_id} introuvable")
    
    sub_q = None
    questions = exercise.get("questions", exercise.get("sous_questions", []))
    for sq in questions:
        if sq["id"] == submission.question_id:
            sub_q = sq
            break
            
    if not sub_q:
        raise HTTPException(404, f"Question {submission.question_id} introuvable")

    result = {}
    points_max = sub_q.get("points", 1)
    
    if submission.type in ("qcm_single", "qcm_multi"):
        # Correction locale
        correct_indices = {i for i, opt in enumerate(sub_q.get("options", [])) if opt.get("correct")}
        selected_set = set(submission.selected or [])
        
        is_correct = (selected_set == correct_indices)
        est_correct = 2 if is_correct else 0
        
        result = {
            "est_correct": est_correct,
            "points_obtenus": points_max if is_correct else 0,
            "points_max": points_max,
            "feedback": "Bonne réponse !" if is_correct else "Mauvaise réponse.",
            "explication": sub_q.get("explication", ""),
            "reponse_attendue": "Options correctes : " + ", ".join([str(i) for i in correct_indices])
        }
    else:
        # Correction manuscrite - mock simple pour l'instant
        result = {
            "est_correct": 2, # On suppose ok en dev
            "points_obtenus": points_max,
            "points_max": points_max,
            "feedback": sub_q.get("explication", "Réponse enregistrée (mock)"),
            "reponse_attendue": sub_q.get("reponse_attendue", "")
        }
        
    return result

@router.post("/redige")
async def corriger_redige(submission: RedigeSubmission):
    """Corrige une réponse manuscrite via Gemini Vision."""
    
    # 1. Trouver la question
    exercise = get_exercise_by_id(submission.exercise_id)
    if not exercise:
        raise HTTPException(404, f"Exercice {submission.exercise_id} introuvable")
    
    # Trouver la sous-question
    sub_q = None
    for sq in exercise.get("sous_questions", []):
        if sq["id"] == submission.sub_question_id:
            sub_q = sq
            break
    
    if not sub_q:
        raise HTTPException(404, f"Sous-question {submission.sub_question_id} introuvable")
    
    # 2. Sauvegarder l'image (pour référence)
    img_dir = os.path.join(settings.DATA_DIR, "reponses_images")
    os.makedirs(img_dir, exist_ok=True)
    img_filename = f"{submission.sub_question_id}_{int(time.time())}.png"
    img_path = os.path.join(img_dir, img_filename)
    
    try:
        img_bytes = base64.b64decode(submission.image_base64)
        with open(img_path, "wb") as f:
            f.write(img_bytes)
    except Exception:
        img_path = ""
    
    # 3. Appeler Gemini pour la correction
    matiere_label = {
        "maths_specialite": "Mathématiques Spécialité",
        "physique_chimie": "Physique-Chimie"
    }.get(exercise.get("matiere", ""), exercise.get("matiere", ""))
    
    try:
        result = await correct_handwritten_answer(
            image_base64=submission.image_base64,
            enonce_court=sub_q.get("enonce_court", ""),
            reponse_attendue=sub_q.get("reponse_attendue", ""),
            cours_associe=sub_q.get("cours_associe", ""),
            matiere=matiere_label
        )
    except Exception as e:
        # Fallback en cas d'erreur API
        result = {
            "transcription": "",
            "est_correct": 0,
            "parties_correctes": "",
            "erreurs": f"Erreur lors de l'appel au service de correction : {str(e)}",
            "feedback": "Désolé, la correction automatique a rencontré un problème. Voici la réponse attendue.",
            "cours_rappel": sub_q.get("cours_associe", "")
        }
    
    # 4. Enrichir le résultat
    result["reponse_attendue"] = sub_q.get("reponse_attendue", "")
    result["points_max"] = sub_q.get("points", 0)
    result["points_obtenus"] = {0: 0, 1: sub_q.get("points", 0) * 0.5, 2: sub_q.get("points", 0)}.get(result.get("est_correct", 0), 0)
    
    # 5. Enregistrer dans la BDD
    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute(
            """INSERT INTO resultats 
               (utilisateur_id, question_id, matiere, chapitre,
                reponse_donnee, est_correct, score_obtenu, score_max,
                indice_utilise, temps_reponse_sec, image_reponse_path)
               VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (submission.sub_question_id,
             exercise.get("matiere", ""),
             exercise.get("chapitre", ""),
             result.get("transcription", ""),
             result.get("est_correct", 0),
             result["points_obtenus"],
             result["points_max"],
             submission.indice_utilise,
             submission.temps_reponse_sec,
             img_path)
        )
        await db.commit()
    
    return result