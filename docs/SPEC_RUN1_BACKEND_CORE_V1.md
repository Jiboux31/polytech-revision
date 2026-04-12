# SPEC_RUN1_BACKEND_CORE_V1.md — Backend + Banque de questions

> **Run** : 1 — Backend Core (API + Questions + BDD)
> **Objectif** : API fonctionnelle avec banque de questions annales, correction QCM, modèle SQLite, profil Garance
> **Pré-requis** : Run 0 terminé, repo GitHub pushé
> **Durée estimée** : 3-4h

---

## 0. Vérification pré-run

Avant de commencer, Léo vérifie :
1. Le repo GitHub distant existe et est pushé (si non → créer le remote et pusher)
2. `curl http://localhost:8042/health` → `{"status":"ok"}`
3. Les fichiers des annales PDF sont disponibles (JB doit les déposer dans `backend/data/annales/`)

**IMPORTANT** : Si le repo n'est pas encore sur GitHub (seulement local), c'est le premier point à régler.

---

## 1. Base de données SQLite

### 1.1 Créer le fichier `backend/models/database.py`

```python
import aiosqlite
import os
from config import settings

DB_PATH = settings.DB_PATH

async def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(SCHEMA)
        await db.commit()

SCHEMA = """
CREATE TABLE IF NOT EXISTS utilisateur (
    id INTEGER PRIMARY KEY,
    prenom TEXT NOT NULL,
    date_creation TEXT DEFAULT (datetime('now')),
    nb_etapes_revision INTEGER DEFAULT 5,
    etape_courante INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS resultats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER REFERENCES utilisateur(id),
    question_id TEXT NOT NULL,
    matiere TEXT NOT NULL,
    chapitre TEXT NOT NULL,
    date_reponse TEXT DEFAULT (datetime('now')),
    reponse_donnee TEXT,
    est_correct INTEGER DEFAULT 0,
    score_obtenu REAL DEFAULT 0,
    score_max REAL DEFAULT 0,
    indice_utilise INTEGER DEFAULT 0,
    temps_reponse_sec INTEGER DEFAULT 0,
    image_reponse_path TEXT
);

CREATE TABLE IF NOT EXISTS progression (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER REFERENCES utilisateur(id),
    matiere TEXT NOT NULL,
    chapitre TEXT NOT NULL,
    niveau TEXT DEFAULT 'non_vu'
        CHECK(niveau IN ('non_vu','en_cours','fragile','acquis','maitrise')),
    score_moyen REAL DEFAULT 0,
    nb_questions_faites INTEGER DEFAULT 0,
    nb_correct INTEGER DEFAULT 0,
    derniere_activite TEXT,
    UNIQUE(utilisateur_id, matiere, chapitre)
);

CREATE TABLE IF NOT EXISTS simulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER REFERENCES utilisateur(id),
    date_simulation TEXT DEFAULT (datetime('now')),
    duree_totale_sec INTEGER,
    score_qcm REAL,
    score_maths_spe REAL,
    score_pc REAL,
    score_total REAL,
    note_sur_20 REAL
);

-- Seed : créer Garance
INSERT OR IGNORE INTO utilisateur (id, prenom) VALUES (1, 'Garance');
"""
```

### 1.2 Brancher l'init dans `main.py`

Ajouter au startup de FastAPI :
```python
from contextlib import asynccontextmanager
from models.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan)
```

---

## 2. Banque de questions — Format JSON

### 2.1 Structure des fichiers

```
backend/data/questions/
├── qcm_2024.json          # QCM annales 2024 (7 exercices)
├── qcm_2025.json          # QCM annales 2025 (8 exercices)
├── maths_spe_2024.json    # Maths spé annales 2024 (2 exercices)
├── maths_spe_2025.json    # Maths spé annales 2025 (3 exercices)
├── pc_2024.json           # PC annales 2024 (3 exercices)
└── pc_2025.json           # PC annales 2025 (3 exercices)
```

### 2.2 QCM 2024 — Réponses extraites du corrigé

Créer `backend/data/questions/qcm_2024.json` avec ce contenu exact :

```json
{
  "annee": 2024,
  "matiere": "maths_qcm",
  "exercices": [
    {
      "id": "QCM2024-I",
      "titre": "Calculs",
      "chapitre": "calculs_algebre",
      "questions": [
        {"id": "QCM2024-I-A", "enonce": "(2\\sqrt{3})^2 \\times 12^3 \\times 3^2 / (3^{-4} \\times (\\sqrt{2})^4) = 3^{10} \\times 2^8", "reponse": false, "explication": "Le calcul donne 3^{10} \\times 2^6, pas 2^8."},
        {"id": "QCM2024-I-B", "enonce": "2\\sqrt{27} - (2\\sqrt{3}-1)^2 = 10\\sqrt{3} - 13", "reponse": true, "explication": "2\\sqrt{27} = 6\\sqrt{3} et (2\\sqrt{3}-1)^2 = 13 - 4\\sqrt{3}, donc 6\\sqrt{3} - 13 + 4\\sqrt{3} = 10\\sqrt{3} - 13."},
        {"id": "QCM2024-I-C", "enonce": "\\ln(e/4) + \\ln(1/(9e)) + \\ln(36e) = 1", "reponse": true, "explication": "En développant les logarithmes, on obtient 2 - 2\\ln 2 - 2\\ln 3 - 1 + 2\\ln 2 + 2\\ln 3 = 1."},
        {"id": "QCM2024-I-D", "enonce": "e^{2\\ln 3 + \\ln 5} + e^{-2\\ln 5} = 20", "reponse": false, "explication": "e^{2\\ln 3 + \\ln 5} = 9 \\times 5 = 45 et e^{-2\\ln 5} = 1/25, donc le total est 45 + 1/25 \\neq 20."},
        {"id": "QCM2024-I-E", "enonce": "\\frac{2}{x+2} - \\frac{1}{x-2} + \\frac{8}{x^2-4} = \\frac{1}{x-2}", "reponse": true, "explication": "En réduisant au même dénominateur x^2-4, on obtient (2x-4-x-2+8)/(x^2-4) = (x+2)/(x^2-4) = 1/(x-2)."},
        {"id": "QCM2024-I-F", "enonce": "\\frac{e^{2x}+2e^x+1}{e^x+1} = e^x + 1", "reponse": true, "explication": "Le numérateur se factorise en (e^x+1)^2, donc le quotient vaut e^x+1."}
      ],
      "indice": "Pour les calculs avec puissances et logarithmes, décomposez chaque terme en facteurs premiers."
    },
    {
      "id": "QCM2024-II",
      "titre": "Fonctions",
      "chapitre": "fonctions",
      "questions": [
        {"id": "QCM2024-II-A", "enonce": "La dérivée de f(x) = e^{1/x} est f'(x) = e^{1/x}", "reponse": false, "explication": "Par la règle de dérivation composée, f'(x) = (-1/x^2) \\cdot e^{1/x}."},
        {"id": "QCM2024-II-B", "enonce": "F(x) = x\\sqrt{x} est une primitive de f(x) = \\frac{3}{2}\\sqrt{x}", "reponse": true, "explication": "F'(x) = \\sqrt{x} + x/(2\\sqrt{x}) = 3\\sqrt{x}/2."},
        {"id": "QCM2024-II-C", "enonce": "La dérivée de f(x) = (\\ln(3x))^2 est f'(x) = \\frac{2}{3x}\\ln(3x)", "reponse": false, "explication": "f'(x) = 2 \\cdot (3/(3x)) \\cdot \\ln(3x) = (2/x)\\ln(3x), pas 2/(3x)."},
        {"id": "QCM2024-II-D", "enonce": "\\lim_{x \\to 0}(x\\ln(x) - x) = -\\infty", "reponse": false, "explication": "\\lim_{x\\to 0} x\\ln x = 0 (croissance comparée) donc la limite vaut 0, pas -\\infty."},
        {"id": "QCM2024-II-E", "enonce": "\\lim_{x \\to +\\infty}(xe^x - \\ln(x)) = 0", "reponse": false, "explication": "xe^x tend vers +\\infty bien plus vite que \\ln(x), donc la limite est +\\infty."}
      ],
      "indice": "Pour les dérivées composées, pensez à appliquer (u \\circ v)' = v' \\times u'(v)."
    },
    {
      "id": "QCM2024-III",
      "titre": "Fonctions (suite)",
      "chapitre": "fonctions",
      "questions": [
        {"id": "QCM2024-III-A", "enonce": "\\lim_{x \\to 1^-} \\frac{3}{1-x} = -\\infty", "reponse": false, "explication": "Quand x → 1⁻, 1-x → 0⁺ donc 3/(1-x) → +∞."},
        {"id": "QCM2024-III-B", "enonce": "Tangente à f(x)=3/(1-x) en x=-1 : y = \\frac{3}{4}x + \\frac{3}{2}", "reponse": false, "explication": "f(-1) = 3/2 et f'(-1) = 3/4, mais la tangente est y = (3/4)(x+1) + 3/2 = (3/4)x + 9/4."},
        {"id": "QCM2024-III-C", "enonce": "f(x) = 3/(1-x) est concave sur ]1;+\\infty[", "reponse": true, "explication": "f''(x) = 6/(1-x)^3, qui est négatif sur ]1;+∞[, donc f est concave."}
      ],
      "indice": "Pour la concavité, étudiez le signe de f''(x)."
    },
    {
      "id": "QCM2024-IV",
      "titre": "Suites numériques",
      "chapitre": "suites",
      "questions": [
        {"id": "QCM2024-IV-A", "enonce": "Si (u_n) minorée par 2, alors v_n = -2/u_n est minorée par -1", "reponse": true, "explication": "u_n ≥ 2 ⟹ 2/u_n ≤ 1 ⟹ -2/u_n ≥ -1."},
        {"id": "QCM2024-IV-B", "enonce": "Si (u_n) croissante, alors (v_n) = (-2/u_n) est décroissante", "reponse": false, "explication": "Contre-exemple : u_n = n+1 croissante, v_n = -2/(n+1) est aussi croissante (vers 0)."},
        {"id": "QCM2024-IV-C", "enonce": "Si (u_n) converge, alors (v_n) = (-2/u_n) converge", "reponse": false, "explication": "Si u_n converge vers 0 (ex: u_n = 1/(n+1)), alors v_n = -2(n+1) diverge."}
      ],
      "indice": "Pour les implications sur les suites, cherchez des contre-exemples."
    },
    {
      "id": "QCM2024-V",
      "titre": "Probabilités - Loi binomiale",
      "chapitre": "probabilites",
      "questions": [
        {"id": "QCM2024-V-A", "enonce": "Nombre de lancers avec numéro pair (5 lancers de dé) suit une loi binomiale", "reponse": true, "explication": "5 épreuves indépendantes, succès = pair avec p=1/2, c'est bien une loi binomiale B(5, 1/2)."},
        {"id": "QCM2024-V-B", "enonce": "La somme des résultats de 5 lancers de dé suit une loi binomiale", "reponse": false, "explication": "La somme peut prendre des valeurs de 5 à 30, ce n'est pas un comptage de succès binaires."}
      ],
      "indice": "Une loi binomiale compte le NOMBRE DE SUCCÈS dans n épreuves indépendantes."
    },
    {
      "id": "QCM2024-VI",
      "titre": "Probabilités - Événements",
      "chapitre": "probabilites",
      "questions": [
        {"id": "QCM2024-VI-A", "enonce": "P(A∩B) = 0.24 avec P(A)=0.6, P(B)=0.4, P(A∪B)=0.8", "reponse": false, "explication": "P(A∩B) = P(A)+P(B)-P(A∪B) = 0.6+0.4-0.8 = 0.2 ≠ 0.24."},
        {"id": "QCM2024-VI-B", "enonce": "A et B sont des événements contraires", "reponse": false, "explication": "Contraires ⟹ incompatibles et P(A∪B)=1. Or P(A∪B)=0.8 ≠ 1."},
        {"id": "QCM2024-VI-C", "enonce": "A et B sont des événements indépendants", "reponse": false, "explication": "Indépendants ⟹ P(A∩B) = P(A)×P(B) = 0.24. Or P(A∩B) = 0.2."},
        {"id": "QCM2024-VI-D", "enonce": "A et B sont des événements incompatibles", "reponse": false, "explication": "Incompatibles ⟹ P(A∩B) = 0. Or P(A∩B) = 0.2 ≠ 0."}
      ],
      "indice": "Commencez par calculer P(A∩B) avec la formule P(A∪B) = P(A)+P(B)-P(A∩B)."
    },
    {
      "id": "QCM2024-VII",
      "titre": "Géométrie dans le plan",
      "chapitre": "geometrie_plan",
      "questions": [
        {"id": "QCM2024-VII-A", "enonce": "Droite (AB) avec A(2;0) B(0;-4) : 2x - y - 4 = 0", "reponse": true, "explication": "Vérification : 2(2)-0-4=0 et 2(0)-(-4)-4=0. Les deux points vérifient l'équation."},
        {"id": "QCM2024-VII-B", "enonce": "Médiatrice de [AB] : x + 2y + 3 = 0", "reponse": true, "explication": "Milieu I(1;-2), vecteur normal AB(-2;-4), d'où -2(x-1)-4(y+2)=0 soit x+2y+3=0."},
        {"id": "QCM2024-VII-C", "enonce": "Cercle de diamètre [AB] : x² + y² - 2x - 4y = 0", "reponse": false, "explication": "Centre I(1;-2), rayon √5. L'équation est (x-1)²+(y+2)²=5, soit x²+y²-2x+4y=0 (pas -4y)."},
        {"id": "QCM2024-VII-D", "enonce": "(-1;-1) appartient au cercle de diamètre [AB]", "reponse": true, "explication": "(-1)²+(-1)²-2(-1)+4(-1) = 1+1+2-4 = 0. Vérifié."},
        {"id": "QCM2024-VII-E", "enonce": "2x - y + 1 = 0 est tangente au cercle de diamètre [AB]", "reponse": true, "explication": "Le point (-1;-1) est sur le cercle et sur la droite, et IP est perpendiculaire à la droite."}
      ],
      "indice": "Pour le cercle de diamètre [AB], le centre est le milieu de [AB] et le rayon vaut AB/2."
    }
  ]
}
```

### 2.3 QCM 2025 — Réponses extraites du corrigé

Créer `backend/data/questions/qcm_2025.json`. Contenu identique en structure mais avec les 8 exercices 2025. Voici les réponses :

**Exercice I** (Calculs) : I-A=Vrai, I-B=Faux, I-C=Vrai, I-D=Faux, I-E=Vrai, I-F=Vrai
**Exercice II** (Équations/Inéquations) : II-A=Vrai, II-B=Faux
**Exercice III** (Implications) : III-A=Faux, III-B=Vrai, III-C=Faux
**Exercice IV** (Fonctions exp/ln) : IV-A=Vrai, IV-B=Vrai, IV-C=Faux, IV-D=Faux, IV-E=Vrai
**Exercice V** (Suites) : V-A=Faux, V-B=Vrai, V-C=Vrai, V-D=Faux
**Exercice VI** (Suites grains de riz) : VI-A=Vrai, VI-B=Vrai
**Exercice VII** (Produit scalaire/vecteurs) : VII-A=Vrai, VII-B=Faux, VII-C=Faux
**Exercice VIII** (Produit scalaire/angles) : VIII-A=Vrai, VIII-B=Faux

Léo doit créer le JSON complet avec les énoncés LaTeX en reprenant le même format que le fichier 2024 ci-dessus. Les énoncés sont dans le fichier `EnonceGP2025VF.pdf` (pages 2-3) et les corrigés dans `corrigeQCM2025.pdf`.

### 2.4 Exercices rédigés (Maths Spé + PC)

Pour les exercices rédigés, le format est différent car la correction se fait par LLM. Créer les fichiers JSON avec la structure suivante pour chaque exercice :

```json
{
  "id": "MSPE2025-I",
  "matiere": "maths_specialite",
  "chapitre": "analyse_fonctions",
  "annee": 2025,
  "titre": "Étude de fonctions g et f",
  "points_total": 14,
  "enonce_global": "Partie A : On considère g(x) = 2x³ + ln(x) - 2 pour x > 0...",
  "sous_questions": [
    {
      "id": "MSPE2025-I-1",
      "enonce": "Compléter le tableau des variations de g en faisant apparaître les limites en 0 et +∞.",
      "points": 2,
      "reponse_attendue": "g est strictement croissante sur ]0;+∞[, lim en 0⁺ = -∞, lim en +∞ = +∞",
      "cours_associe": "Pour dresser un tableau de variations : 1) Calculer la dérivée. 2) Étudier son signe. 3) En déduire les variations. Les limites aux bornes se calculent par les règles de limite.",
      "indice": "Calculez g'(x) = 6x² + 1/x. Quel est le signe de cette expression pour x > 0 ?",
      "type_reponse": "manuscrit"
    }
  ]
}
```

Les exercices rédigés complets seront extraits par un script (voir section 3).

---

## 3. Service de chargement des questions

### Créer `backend/services/questions_service.py`

```python
import json
import os
from typing import List, Optional
from config import settings

QUESTIONS_DIR = os.path.join(settings.DATA_DIR, "questions")

def load_all_questions() -> dict:
    """Charge toutes les questions depuis les fichiers JSON."""
    questions = {
        "maths_qcm": [],
        "maths_specialite": [],
        "physique_chimie": []
    }
    
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
    """Retourne les questions d'une matière et d'un chapitre donné."""
    all_q = load_all_questions()
    result = []
    for annale in all_q.get(matiere, []):
        for exercice in annale.get("exercices", []):
            if exercice.get("chapitre") == chapitre:
                result.append(exercice)
    return result

def get_exercise_by_id(exercise_id: str) -> Optional[dict]:
    """Retourne un exercice par son ID."""
    all_q = load_all_questions()
    for matiere_questions in all_q.values():
        for annale in matiere_questions:
            for exercice in annale.get("exercices", []):
                if exercice.get("id") == exercise_id:
                    return exercice
                for sq in exercice.get("sous_questions", []):
                    if sq.get("id") == exercise_id:
                        return sq
    return None

def get_revision_plan() -> dict:
    """Retourne le plan de révision en 5 jours."""
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
```

---

## 4. Service de scoring QCM

### Créer `backend/services/scoring.py`

```python
from typing import List, Dict

def score_qcm_exercise(reponses_eleve: Dict[str, bool | None],
                       reponses_correctes: Dict[str, bool],
                       points_par_bonne: float = 1.0,
                       penalite_mauvaise: float = -0.5) -> dict:
    """
    Calcule le score d'un exercice QCM avec points négatifs.
    
    Règles Geipi Polytech :
    - Bonne réponse : +points
    - Mauvaise réponse : pénalité (points négatifs)
    - Pas de réponse : 0
    - Le total par exercice ne peut pas être strictement négatif (plancher à 0)
    """
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
    
    # Plancher à 0 par exercice
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
    """Convertit les scores en note Polytech /20."""
    total = score_qcm + score_maths + score_pc
    note_20 = round(total * 20 / 120, 2)
    return {
        "score_qcm": score_qcm,
        "score_maths_spe": score_maths,
        "score_pc": score_pc,
        "total_120": total,
        "note_sur_20": note_20
    }
```

---

## 5. API Routes

### 5.1 Créer `backend/routers/exercices.py`

```python
from fastapi import APIRouter, HTTPException
from services.questions_service import (
    load_all_questions, get_questions_by_chapter,
    get_exercise_by_id, get_revision_plan
)

router = APIRouter(prefix="/exercices", tags=["exercices"])

@router.get("/plan")
async def plan_revision():
    """Retourne le plan de révision 5 jours."""
    return get_revision_plan()

@router.get("/chapitres/{matiere}")
async def liste_chapitres(matiere: str):
    """Liste les chapitres disponibles pour une matière."""
    all_q = load_all_questions()
    chapitres = set()
    for annale in all_q.get(matiere, []):
        for ex in annale.get("exercices", []):
            chapitres.add(ex.get("chapitre", ""))
    return {"matiere": matiere, "chapitres": sorted(chapitres)}

@router.get("/chapitre/{matiere}/{chapitre}")
async def questions_par_chapitre(matiere: str, chapitre: str):
    """Retourne les exercices d'un chapitre."""
    exercises = get_questions_by_chapter(matiere, chapitre)
    if not exercises:
        raise HTTPException(404, f"Aucun exercice pour {matiere}/{chapitre}")
    return {"matiere": matiere, "chapitre": chapitre, "exercices": exercises}

@router.get("/{exercise_id}")
async def get_exercise(exercise_id: str):
    """Retourne un exercice par ID."""
    ex = get_exercise_by_id(exercise_id)
    if not ex:
        raise HTTPException(404, f"Exercice {exercise_id} introuvable")
    return ex
```

### 5.2 Créer `backend/routers/correction.py`

```python
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Optional
from services.scoring import score_qcm_exercise
from services.questions_service import get_exercise_by_id

router = APIRouter(prefix="/correction", tags=["correction"])

class QCMSubmission(BaseModel):
    exercise_id: str
    reponses: Dict[str, Optional[bool]]  # {question_id: true/false/null}

@router.post("/qcm")
async def corriger_qcm(submission: QCMSubmission):
    """Corrige un exercice QCM et retourne le score + feedback."""
    exercise = get_exercise_by_id(submission.exercise_id)
    if not exercise:
        return {"error": "Exercice introuvable"}
    
    # Construire le dict des bonnes réponses
    bonnes_reponses = {}
    explications = {}
    for q in exercise.get("questions", []):
        bonnes_reponses[q["id"]] = q["reponse"]
        explications[q["id"]] = q.get("explication", "")
    
    # Scorer
    result = score_qcm_exercise(submission.reponses, bonnes_reponses)
    
    # Enrichir avec les explications
    for detail in result["details"]:
        detail["explication"] = explications.get(detail["id"], "")
        detail["bonne_reponse"] = bonnes_reponses.get(detail["id"])
    
    # Feedback global
    ratio = result["nb_correct"] / max(1, len(bonnes_reponses))
    if ratio >= 0.8:
        result["feedback"] = f"Excellent Garance ! {result['nb_correct']}/{len(bonnes_reponses)} bonnes réponses."
    elif ratio >= 0.5:
        result["feedback"] = f"Pas mal ! {result['nb_correct']}/{len(bonnes_reponses)}. Revois les points manqués."
    else:
        result["feedback"] = f"Courage Garance ! {result['nb_correct']}/{len(bonnes_reponses)}. Reprends le cours associé."
    
    result["indice_exercice"] = exercise.get("indice", "")
    
    return result
```

### 5.3 Créer `backend/routers/progression.py`

```python
from fastapi import APIRouter
from pydantic import BaseModel
import aiosqlite
from config import settings

router = APIRouter(prefix="/progression", tags=["progression"])

@router.get("/garance")
async def get_progression():
    """Retourne la progression complète de Garance."""
    async with aiosqlite.connect(settings.DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        
        # Progression par chapitre
        cursor = await db.execute(
            "SELECT * FROM progression WHERE utilisateur_id = 1"
        )
        rows = await cursor.fetchall()
        progression = [dict(r) for r in rows]
        
        # Stats globales
        cursor = await db.execute(
            """SELECT matiere, 
                      COUNT(*) as nb_total,
                      SUM(CASE WHEN est_correct = 2 THEN 1 ELSE 0 END) as nb_correct,
                      AVG(score_obtenu) as score_moyen
               FROM resultats WHERE utilisateur_id = 1 GROUP BY matiere"""
        )
        stats = [dict(r) for r in await cursor.fetchall()]
        
    return {"progression": progression, "stats_par_matiere": stats}

class ResultatSubmission(BaseModel):
    question_id: str
    matiere: str
    chapitre: str
    reponse_donnee: str = ""
    est_correct: int = 0  # 0=faux, 1=partiel, 2=correct
    score_obtenu: float = 0
    score_max: float = 0
    indice_utilise: int = 0
    temps_reponse_sec: int = 0

@router.post("/resultat")
async def enregistrer_resultat(r: ResultatSubmission):
    """Enregistre le résultat d'une question et met à jour la progression."""
    async with aiosqlite.connect(settings.DB_PATH) as db:
        # Enregistrer le résultat
        await db.execute(
            """INSERT INTO resultats 
               (utilisateur_id, question_id, matiere, chapitre, 
                reponse_donnee, est_correct, score_obtenu, score_max,
                indice_utilise, temps_reponse_sec)
               VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (r.question_id, r.matiere, r.chapitre,
             r.reponse_donnee, r.est_correct, r.score_obtenu, r.score_max,
             r.indice_utilise, r.temps_reponse_sec)
        )
        
        # Mettre à jour la progression du chapitre
        cursor = await db.execute(
            """SELECT COUNT(*) as total, 
                      SUM(CASE WHEN est_correct >= 1 THEN 1 ELSE 0 END) as correct
               FROM resultats 
               WHERE utilisateur_id = 1 AND matiere = ? AND chapitre = ?""",
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
            """INSERT INTO progression (utilisateur_id, matiere, chapitre, niveau, 
                                        score_moyen, nb_questions_faites, nb_correct, derniere_activite)
               VALUES (1, ?, ?, ?, ?, ?, ?, datetime('now'))
               ON CONFLICT(utilisateur_id, matiere, chapitre) 
               DO UPDATE SET niveau=?, score_moyen=?, nb_questions_faites=?, 
                            nb_correct=?, derniere_activite=datetime('now')""",
            (r.matiere, r.chapitre, niveau, ratio, total, correct,
             niveau, ratio, total, correct)
        )
        
        await db.commit()
    
    return {"status": "ok", "niveau": niveau, "ratio": ratio}
```

### 5.4 Mettre à jour `backend/main.py`

Ajouter les routers :
```python
from routers import exercices, correction, progression

app.include_router(exercices.router, prefix="/api")
app.include_router(correction.router, prefix="/api")
app.include_router(progression.router, prefix="/api")
```

---

## 6. Tests de validation Run 1

| # | Test | Commande | Attendu |
|---|------|----------|---------|
| 1 | DB créée | `ls backend/data/polytech.db` | Fichier existe |
| 2 | Garance existe | `curl localhost:8042/api/progression/garance` | JSON avec progression vide |
| 3 | Plan révision | `curl localhost:8042/api/exercices/plan` | JSON 5 jours |
| 4 | Chapitres QCM | `curl localhost:8042/api/exercices/chapitres/maths_qcm` | Liste chapitres |
| 5 | Questions chapitre | `curl localhost:8042/api/exercices/chapitre/maths_qcm/calculs_algebre` | Exercices I 2024+2025 |
| 6 | Correction QCM | `curl -X POST localhost:8042/api/correction/qcm -H "Content-Type: application/json" -d '{"exercise_id":"QCM2024-I","reponses":{"QCM2024-I-A":false,"QCM2024-I-B":true}}'` | Score avec détails |
| 7 | Enregistrer résultat | `curl -X POST localhost:8042/api/progression/resultat -H "Content-Type: application/json" -d '{"question_id":"QCM2024-I-A","matiere":"maths_qcm","chapitre":"calculs_algebre","est_correct":2,"score_obtenu":1,"score_max":1}'` | `{"status":"ok"}` |

---

## 7. Git

```
git add .
git commit -m "Run 1: backend core - question bank, QCM correction, progression tracking, SQLite"
git push origin main
```

Mettre à jour CHANGELOG.md et DEVLOG.md.

---

## 8. Rappels Léo

- Lire `SPEC_GENERALE_V1.md` pour le contexte complet si pas encore fait
- Créer les `__init__.py` dans chaque sous-dossier Python
- Les fichiers JSON doivent être en UTF-8 (accents français)
- Tester chaque endpoint avant de passer au suivant
- **Git push obligatoire** — vérifier que le remote existe !
- Python : `/usr/local/bin/python3.10`
- pip : `python3.10 -m pip`
