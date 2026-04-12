from typing import List, Dict

def score_qcm_exercise(reponses_eleve: Dict[str, bool | None],
                       reponses_correctes: Dict[str, bool],
                       points_par_bonne: float = 1.0,
                       penalite_mauvaise: float = -0.5) -> dict:
    details = []
    score_brut = 0.0
    
    for q_id, bonne_reponse in reponses_correctes.items():
        reponse_eleve = reponses_eleve.get(q_id)
        
        if reponse_eleve is None:
            details.append({"id": q_id, "score": 0, "status": "non_repondu"})
        elif reponse_eleve == bonne_reponse:
            score_brut += points_par_bonne
            details.append({"id": q_id, "score": points_par_bonne, "status": "correct"})
        else:
            score_brut += penalite_mauvaise
            details.append({"id": q_id, "score": penalite_mauvaise, "status": "incorrect"})
    
    score_final = max(0, score_brut)
    
    return {
        "score_brut": score_brut,
        "score_final": score_final,
        "details": details,
        "nb_correct": sum(1 for d in details if d["status"] == "correct"),
        "nb_incorrect": sum(1 for d in details if d["status"] == "incorrect"),
        "nb_non_repondu": sum(1 for d in details if d["status"] == "non_repondu")
    }

def score_to_note_polytech(score_qcm: float, score_maths: float, score_pc: float) -> dict:
    total = score_qcm + score_maths + score_pc
    note_20 = round(total * 20 / 120, 2)
    return {
        "score_qcm": score_qcm,
        "score_maths_spe": score_maths,
        "score_pc": score_pc,
        "total_120": total,
        "note_sur_20": note_20
    }
