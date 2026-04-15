import json
import os
import time
from typing import List, Optional
from config import settings

QUESTIONS_DIR = os.path.join(settings.DATA_DIR, "questions")

def load_all_questions() -> dict:
# ... (no change in load_all_questions)
    questions = {
        "maths_qcm": [],
        "maths_specialite": [],
        "physique_chimie": []
    }
    
    if not os.path.exists(QUESTIONS_DIR):
        return questions

    for filename in os.listdir(QUESTIONS_DIR):
        if not filename.endswith(".json"):
            continue
        filepath = os.path.join(QUESTIONS_DIR, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        matiere = data.get("matiere", "")
        if matiere in questions:
            questions[matiere].append(data)
    
    return questions

def get_questions_by_chapter(matiere: str, chapitre: str) -> list:
    all_q = load_all_questions()
    result = []
    
    # Mapping pour gérer les chapitres du plan qui n'ont pas d'ID exact dans le JSON
    mapping = {
        "analyse_I": ["analyse_fonctions", "analyse_I"],
        "analyse_II": ["suites", "analyse_II"], # On dévie sur les suites pour varier le Jour 2
        "synthese": ["analyse_fonctions", "suites", "probabilites_avancees", "synthese"],
        "chimie_generale": ["chimie_organique", "chimie_generale"]
    }
    
    targets = mapping.get(chapitre, [chapitre])
    
    for annale in all_q.get(matiere, []):
        metadata = {
            "annee": annale.get("annee"),
            "matiere": annale.get("matiere"),
            "source_pdf": annale.get("source_pdf"),
            "source_corrige": annale.get("source_corrige")
        }
        for exercice in annale.get("exercices", []):
            if exercice.get("chapitre") in targets:
                # Merge metadata into exercise
                ex_with_meta = {**metadata, **exercice}
                result.append(ex_with_meta)
    return result

def get_exercise_by_id(exercise_id: str) -> Optional[dict]:
    all_q = load_all_questions()
    for matiere_questions in all_q.values():
        for annale in matiere_questions:
            metadata = {
                "annee": annale.get("annee"),
                "matiere": annale.get("matiere"),
                "source_pdf": annale.get("source_pdf"),
                "source_corrige": annale.get("source_corrige")
            }
            for exercice in annale.get("exercices", []):
                if exercice.get("id") == exercise_id:
                    return {**metadata, **exercice, "_ts": time.time()}
                for sq in exercice.get("sous_questions", []):
                    if sq.get("id") == exercise_id:
                        return {**metadata, **exercice, "_ts": time.time()}
    return None

def get_revision_plan() -> dict:
    return {
        "nb_jours": 5,
        "jours": [
            {
                "jour": 1,
                "theme": "Calculs, Algèbre & Mécanique",
                "blocs": [
                    {"matiere": "maths_qcm", "chapitre": "calculs_algebre", "label": "Calculs & Algèbre"},
                    {"matiere": "maths_specialite", "chapitre": "analyse_I", "label": "Analyse I - Limites, continuité"},
                    {"matiere": "physique_chimie", "chapitre": "mecanique", "label": "Mécanique (Newton, énergie)"}
                ]
            },
            {
                "jour": 2,
                "theme": "Fonctions & Ondes",
                "blocs": [
                    {"matiere": "maths_qcm", "chapitre": "fonctions", "label": "Fonctions (dérivées, limites)"},
                    {"matiere": "maths_specialite", "chapitre": "analyse_II", "label": "Analyse II - Exp, Ln, primitives"},
                    {"matiere": "physique_chimie", "chapitre": "ondes_optique", "label": "Ondes & Optique"}
                ]
            },
            {
                "jour": 3,
                "theme": "Suites & Électricité",
                "blocs": [
                    {"matiere": "maths_qcm", "chapitre": "suites", "label": "Suites numériques"},
                    {"matiere": "maths_specialite", "chapitre": "geometrie_espace", "label": "Géométrie dans l'espace"},
                    {"matiere": "physique_chimie", "chapitre": "electricite", "label": "Circuits RC, condensateurs"}
                ]
            },
            {
                "jour": 4,
                "theme": "Probabilités & Chimie organique",
                "blocs": [
                    {"matiere": "maths_qcm", "chapitre": "probabilites", "label": "Probabilités"},
                    {"matiere": "maths_specialite", "chapitre": "probabilites_avancees", "label": "Probabilités avancées"},
                    {"matiere": "physique_chimie", "chapitre": "chimie_organique", "label": "Chimie organique & cinétique"}
                ]
            },
            {
                "jour": 5,
                "theme": "Géométrie & Chimie générale + Révision",
                "blocs": [
                    {"matiere": "maths_qcm", "chapitre": "geometrie_plan", "label": "Géométrie dans le plan"},
                    {"matiere": "maths_specialite", "chapitre": "synthese", "label": "Synthèse (intégration, compléments)"},
                    {"matiere": "physique_chimie", "chapitre": "chimie_generale", "label": "Acide-base, oxydo-réduction"}
                ]
            }
        ]
    }
