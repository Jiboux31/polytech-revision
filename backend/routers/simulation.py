from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import aiosqlite
from config import settings
from services.questions_service import load_all_questions
import random

router = APIRouter(prefix="/simulation", tags=["simulation"])

@router.get("/generer")
async def generer_simulation():
    """Génère une simulation complète de 3h : QCM + 2 spécialités."""
    all_q = load_all_questions()

    # QCM : piocher 8 exercices parmi toutes les annales
    qcm_exercices = []
    for annale in all_q.get("maths_qcm", []):
        qcm_exercices.extend(annale.get("exercices", []))
    random.shuffle(qcm_exercices)
    qcm_selection = qcm_exercices[:8]

    # Maths Spé : piocher 3 exercices
    mspe_exercices = []
    for annale in all_q.get("maths_specialite", []):
        mspe_exercices.extend(annale.get("exercices", []))
    random.shuffle(mspe_exercices)
    mspe_selection = mspe_exercices[:3]

    # PC : piocher 3 exercices
    pc_exercices = []
    for annale in all_q.get("physique_chimie", []):
        pc_exercices.extend(annale.get("exercices", []))
    random.shuffle(pc_exercices)
    pc_selection = pc_exercices[:3]

    return {
        "duree_totale_sec": 10800,  # 3h
        "epreuves": [
            {
                "matiere": "maths_qcm",
                "label": "Mathématiques QCM",
                "duree_sec": 3600,
                "exercices": qcm_selection
            },
            {
                "matiere": "maths_specialite",
                "label": "Mathématiques Spécialité",
                "duree_sec": 3600,
                "exercices": mspe_selection
            },
            {
                "matiere": "physique_chimie",
                "label": "Physique-Chimie",
                "duree_sec": 3600,
                "exercices": pc_selection
            }
        ],
        "regles": {
            "calculatrice": False,
            "documents": False,
            "indices": False
        }
    }


class SimulationResult(BaseModel):
    duree_totale_sec: int
    score_qcm: float
    score_maths_spe: float
    score_pc: float

@router.post("/enregistrer")
async def enregistrer_simulation(result: SimulationResult):
    """Enregistre les résultats d'une simulation."""
    total = result.score_qcm + result.score_maths_spe + result.score_pc
    note_20 = round(total * 20 / 120, 2)

    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute(
            """INSERT INTO simulations 
               (utilisateur_id, duree_totale_sec, score_qcm, score_maths_spe, score_pc, score_total, note_sur_20)
               VALUES (1, ?, ?, ?, ?, ?, ?)""",
            (result.duree_totale_sec, result.score_qcm, result.score_maths_spe, result.score_pc, total, note_20)
        )
        await db.commit()

    return {"status": "ok", "total_120": total, "note_sur_20": note_20}
