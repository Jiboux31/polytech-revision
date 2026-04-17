from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
import aiosqlite
import time
import random
from config import settings
from services.questions_service import load_all_questions

router = APIRouter(prefix="/simulation", tags=["simulation"])

@router.get("/generer")
async def generer_simulation():
    """Génère une simulation complète de 3h : QCM + Maths Spé + PC."""
    all_q = load_all_questions()

    # QCM : piocher des exercices pour couvrir ~40 points
    qcm_pool = []
    for annale in all_q.get("maths_qcm", []):
        qcm_pool.extend(annale.get("exercices", []))
    random.shuffle(qcm_pool)
    # Prendre 8 exercices max (comme le vrai concours)
    qcm_selection = qcm_pool[:8]
    
    # Calculer le nombre total de questions QCM pour information
    nb_qcm = sum(len(ex.get("questions", [])) for ex in qcm_selection)

    # Maths Spé : piocher 2-3 exercices
    mspe_pool = []
    for annale in all_q.get("maths_specialite", []):
        mspe_pool.extend(annale.get("exercices", []))
    random.shuffle(mspe_pool)
    mspe_selection = mspe_pool[:3]

    # PC : piocher 3 exercices
    pc_pool = []
    for annale in all_q.get("physique_chimie", []):
        pc_pool.extend(annale.get("exercices", []))
    random.shuffle(pc_pool)
    pc_selection = pc_pool[:3]

    return {
        "id": f"SIM-{int(time.time())}",
        "duree_totale_sec": 10800,
        "epreuves": [
            {
                "ordre": 1,
                "matiere": "maths_qcm",
                "label": "Mathématiques — QCM",
                "duree_sec": 3600,
                "points_total": 40,
                "nb_questions": nb_qcm,
                "exercices": qcm_selection,
                "type_correction": "auto"
            },
            {
                "ordre": 2,
                "matiere": "maths_specialite",
                "label": "Mathématiques — Spécialité",
                "duree_sec": 3600,
                "points_total": 40,
                "exercices": mspe_selection,
                "type_correction": "mixte"
            },
            {
                "ordre": 3,
                "matiere": "physique_chimie",
                "label": "Physique-Chimie",
                "duree_sec": 3600,
                "points_total": 40,
                "exercices": pc_selection,
                "type_correction": "mixte"
            }
        ],
        "regles": {
            "calculatrice": False,
            "documents": False,
            "indices": False,
            "retour_arriere": False
        }
    }


class EpreuveResult(BaseModel):
    matiere: str
    score: float
    max_score: float
    details: List[dict]  # liste des résultats par question

class SimulationCompleteResult(BaseModel):
    simulation_id: str
    duree_totale_sec: int
    epreuves: List[EpreuveResult]

@router.post("/terminer")
async def terminer_simulation(result: SimulationCompleteResult):
    """Enregistre les résultats complets d'une simulation."""
    scores = {}
    for ep in result.epreuves:
        scores[ep.matiere] = ep.score
    
    score_qcm = scores.get("maths_qcm", 0)
    score_mspe = scores.get("maths_specialite", 0)
    score_pc = scores.get("physique_chimie", 0)
    total = score_qcm + score_mspe + score_pc
    note_20 = round(total * 20 / 120, 2)

    async with aiosqlite.connect(settings.DB_PATH) as db:
        # Enregistrer la simulation globale
        await db.execute(
            """INSERT INTO simulations 
               (utilisateur_id, duree_totale_sec, score_qcm, score_maths_spe, 
                score_pc, score_total, note_sur_20)
               VALUES (1, ?, ?, ?, ?, ?, ?)""",
            (result.duree_totale_sec, score_qcm, score_mspe, score_pc, total, note_20)
        )
        
        # Enregistrer chaque résultat individuel (pour les stats/dashboard)
        for ep in result.epreuves:
            for detail in ep.details:
                await db.execute(
                    """INSERT INTO resultats 
                       (utilisateur_id, question_id, matiere, chapitre,
                        reponse_donnee, est_correct, score_obtenu, score_max,
                        indice_utilise, temps_reponse_sec)
                       VALUES (1, ?, ?, ?, ?, ?, ?, ?, 0, ?)""",
                    (detail.get("question_id", ""),
                     ep.matiere,
                     detail.get("chapitre", ""),
                     str(detail.get("reponse", "")),
                     detail.get("est_correct", 0),
                     detail.get("score", 0),
                     detail.get("max_score", 0),
                     detail.get("temps_sec", 0))
                )
        
        await db.commit()

    return {
        "status": "ok",
        "score_qcm": score_qcm,
        "score_mspe": score_mspe,
        "score_pc": score_pc,
        "total_120": total,
        "note_sur_20": note_20
    }
