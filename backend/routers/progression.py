from fastapi import APIRouter
from pydantic import BaseModel
import aiosqlite
from config import settings

router = APIRouter(prefix="/progression", tags=["progression"])

@router.get("/garance")
async def get_progression():
    async with aiosqlite.connect(settings.DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        cursor = await db.execute("SELECT * FROM progression WHERE utilisateur_id = 1")
        rows = await cursor.fetchall()
        progression = [dict(r) for r in rows]
        
        cursor = await db.execute(
            \"\"\"SELECT matiere, 
                      COUNT(*) as nb_total,
                      SUM(CASE WHEN est_correct = 2 THEN 1 ELSE 0 END) as nb_correct,
                      AVG(score_obtenu) as score_moyen
               FROM resultats WHERE utilisateur_id = 1 GROUP BY matiere\"\"\"
        )
        stats = [dict(r) for r in await cursor.fetchall()]
        
    return {"progression": progression, "stats_par_matiere": stats}

class ResultatSubmission(BaseModel):
    question_id: str
    matiere: str
    chapitre: str
    reponse_donnee: str = ""
    est_correct: int = 0
    score_obtenu: float = 0
    score_max: float = 0
    indice_utilise: int = 0
    temps_reponse_sec: int = 0

@router.post("/resultat")
async def enregistrer_resultat(r: ResultatSubmission):
    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute(
            \"\"\"INSERT INTO resultats 
               (utilisateur_id, question_id, matiere, chapitre, 
                reponse_donnee, est_correct, score_obtenu, score_max,
                indice_utilise, temps_reponse_sec)
               VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)\"\"\",
            (r.question_id, r.matiere, r.chapitre,
             r.reponse_donnee, r.est_correct, r.score_obtenu, r.score_max,
             r.indice_utilise, r.temps_reponse_sec)
        )
        
        cursor = await db.execute(
            \"\"\"SELECT COUNT(*) as total, 
                      SUM(CASE WHEN est_correct >= 1 THEN 1 ELSE 0 END) as correct
               FROM resultats 
               WHERE utilisateur_id = 1 AND matiere = ? AND chapitre = ?\"\"\",
            (r.matiere, r.chapitre)
        )
        row = await cursor.fetchone()
        total, correct = row[0], row[1] or 0
        ratio = correct / max(1, total)
        
        if total == 0: niveau = "non_vu"
        elif total < 3: niveau = "en_cours"
        elif ratio < 0.5: niveau = "fragile"
        elif ratio < 0.8: niveau = "acquis"
        else: niveau = "maitrise"
        
        await db.execute(
            \"\"\"INSERT INTO progression (utilisateur_id, matiere, chapitre, niveau, 
                                        score_moyen, nb_questions_faites, nb_correct, derniere_activite)
               VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'))
               ON CONFLICT(utilisateur_id, matiere, chapitre) 
               DO UPDATE SET niveau=?, score_moyen=?, nb_questions_faites=?, 
                            nb_correct=?, derniere_activite=datetime('now')\"\"\",
            (r.matiere, r.chapitre, niveau, ratio, total, correct,
             niveau, ratio, total, correct)
        )
        await db.commit()
    
    return {"status": "ok", "niveau": niveau, "ratio": ratio}
