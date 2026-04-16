from fastapi import APIRouter
import aiosqlite
from config import settings

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/garance")
async def dashboard_complet():
    """Retourne toutes les données du tableau de bord."""
    async with aiosqlite.connect(settings.DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # 1. Progression par chapitre
        cursor = await db.execute(
            "SELECT * FROM progression WHERE utilisateur_id = 1 ORDER BY matiere, chapitre"
        )
        progression = [dict(r) for r in await cursor.fetchall()]

        # 2. Stats par matière
        cursor = await db.execute("""
            SELECT matiere,
                   COUNT(*) as nb_total,
                   SUM(CASE WHEN est_correct = 2 THEN 1 ELSE 0 END) as nb_correct,
                   SUM(CASE WHEN est_correct = 1 THEN 1 ELSE 0 END) as nb_partiel,
                   SUM(CASE WHEN est_correct = 0 THEN 1 ELSE 0 END) as nb_incorrect,
                   ROUND(AVG(score_obtenu), 2) as score_moyen,
                   SUM(score_obtenu) as score_total,
                   SUM(score_max) as score_max_total
            FROM resultats WHERE utilisateur_id = 1
            GROUP BY matiere
        """)
        stats_matiere = [dict(r) for r in await cursor.fetchall()]

        # 3. Historique récent (dernières 20 réponses)
        cursor = await db.execute("""
            SELECT question_id, matiere, chapitre, est_correct,
                   score_obtenu, score_max, date_reponse, indice_utilise
            FROM resultats WHERE utilisateur_id = 1
            ORDER BY date_reponse DESC LIMIT 20
        """)
        historique = [dict(r) for r in await cursor.fetchall()]

        # 4. Chapitres faibles (score < 50% avec au moins 2 questions faites)
        cursor = await db.execute("""
            SELECT matiere, chapitre, score_moyen, nb_questions_faites, niveau
            FROM progression
            WHERE utilisateur_id = 1 AND nb_questions_faites >= 2 AND score_moyen < 0.5
            ORDER BY score_moyen ASC
        """)
        points_faibles = [dict(r) for r in await cursor.fetchall()]

        # 5. Simulations passées
        cursor = await db.execute(
            "SELECT * FROM simulations WHERE utilisateur_id = 1 ORDER BY date_simulation DESC"
        )
        simulations = [dict(r) for r in await cursor.fetchall()]

        # 6. Stats globales
        cursor = await db.execute("""
            SELECT COUNT(DISTINCT chapitre) as chapitres_travailles,
                   COUNT(*) as total_questions,
                   SUM(CASE WHEN est_correct = 2 THEN 1 ELSE 0 END) as total_correct,
                   SUM(indice_utilise) as total_indices,
                   SUM(temps_reponse_sec) as temps_total_sec
            FROM resultats WHERE utilisateur_id = 1
        """)
        row = await cursor.fetchone()
        stats_globales = dict(row) if row else {}

    # 7. Note Polytech estimée
    note_estimee = None
    scores = {s["matiere"]: s for s in stats_matiere}
    if scores:
        qcm = scores.get("maths_qcm", {})
        mspe = scores.get("maths_specialite", {})
        pc = scores.get("physique_chimie", {})

        score_qcm = qcm.get("score_total", 0) or 0
        max_qcm = qcm.get("score_max_total", 1) or 1
        score_mspe = mspe.get("score_total", 0) or 0
        max_mspe = mspe.get("score_max_total", 1) or 1
        score_pc = pc.get("score_total", 0) or 0
        max_pc = pc.get("score_max_total", 1) or 1

        # Ramener chaque matière sur 40
        note_qcm_40 = round((score_qcm / max_qcm) * 40, 1) if max_qcm else 0
        note_mspe_40 = round((score_mspe / max_mspe) * 40, 1) if max_mspe else 0
        note_pc_40 = round((score_pc / max_pc) * 40, 1) if max_pc else 0
        total_120 = note_qcm_40 + note_mspe_40 + note_pc_40
        note_20 = round(total_120 * 20 / 120, 1)

        note_estimee = {
            "qcm_sur_40": note_qcm_40,
            "maths_spe_sur_40": note_mspe_40,
            "pc_sur_40": note_pc_40,
            "total_sur_120": total_120,
            "note_sur_20": note_20
        }

    return {
        "progression": progression,
        "stats_par_matiere": stats_matiere,
        "historique_recent": historique,
        "points_faibles": points_faibles,
        "simulations": simulations,
        "stats_globales": stats_globales,
        "note_estimee": note_estimee,
        "jours_restants": _jours_restants()
    }

def _jours_restants():
    from datetime import date
    concours = date(2026, 4, 28)
    today = date.today()
    delta = (concours - today).days
    return max(0, delta)


@router.get("/analyse")
async def analyse_ia():
    """Génère une analyse personnalisée via Gemini."""
    from services.llm_service import call_gemini_text
    
    # Récupérer les données
    async with aiosqlite.connect(settings.DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("""
            SELECT matiere, chapitre, niveau, score_moyen, nb_questions_faites
            FROM progression WHERE utilisateur_id = 1
        """)
        progression = [dict(r) for r in await cursor.fetchall()]

    if not progression:
        return {"analyse": "Tu n'as pas encore commencé les révisions ! Lance un premier QCM pour que je puisse t'analyser."}

    prompt = f"""Tu es un coach de révision bienveillant pour Garance, élève de Terminale qui prépare le concours Geipi Polytech (le 28 avril 2026).

Voici sa progression actuelle :
{progression}

Rédige une analyse courte (5-8 lignes) qui :
1. Valorise ce qui est acquis
2. Identifie les 2-3 points faibles prioritaires
3. Donne un conseil concret pour les prochains jours
4. Reste encourageant et motivant

Tutoie Garance. Sois précis sur les chapitres. Pas de liste à puces, écris en paragraphes."""

    try:
        result = await call_gemini_text(prompt)
        return {"analyse": result}
    except Exception as e:
        return {"analyse": f"Analyse indisponible pour le moment. Continue tes révisions !"}
