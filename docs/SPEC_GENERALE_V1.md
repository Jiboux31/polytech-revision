# SPEC_GENERALE_V1.md — PolytechRevision

> **Projet** : Application web de révision pour le concours Geipi Polytech 2026
> **Utilisatrice MVP** : Garance (Terminale Générale, spécialités Maths + PC)
> **Épreuve** : mardi 28 avril 2026 — 3h d'écrit (Maths QCM 1h + Maths Spé 1h + PC 1h)
> **Deadline dev** : 3 jours (livraison J+3 = 15 avril 2026)
> **Période révision** : 5 jours de révision (16-20 avril), puis 1 semaine de marge
> **Architecte** : Claude | **Développeur** : Léo (agent OpenClaw) | **Validateur** : JB

---

## 1. Vision produit

### MVP (Garance)
Application web sur tablette permettant de réviser le concours Geipi Polytech avec :
- Exercices par chapitres du programme (annales + générés par IA)
- Écriture manuscrite sur canvas (tablette + stylet)
- Correction intelligente par LLM (encouragement / rappel de cours / explication)
- Système d'indices dosés
- Suivi de progression par matière et chapitre
- Plan de révision en 5 étapes couvrant tout le programme
- Simulation en conditions réelles (3h chronométrées)

### Évolutions futures (hors MVP)
- V2 : Toutes matières Polytech + multi-utilisateurs
- V3 : Extension à d'autres concours (Puissance Alpha, Avenir, etc.)
- V4 : Plateforme référence concours France → monde

---

## 2. Structure du concours

### Format épreuve 2026
| Épreuve | Durée | Points | Format |
|---------|-------|--------|--------|
| Maths QCM | 1h | 40 pts | V/F par affirmation, points négatifs si faux, min 0/exercice, 0 si pas de réponse |
| Maths Spécialité | 1h | 40 pts (14+14+12) | 3 exercices rédigés |
| Physique-Chimie | 1h | 40 pts (12+14+14) | 3 exercices rédigés |

**Total** : 120 points sur 3h. Pas de calculatrice, pas de document.

### Barème QCM (points négatifs)
- Bonne réponse : +points
- Mauvaise réponse : -points (pénalité)
- Pas de réponse : 0
- Plancher par exercice : 0 (jamais négatif sur un exercice)

---

## 3. Programme — Découpage en 5 jours de révision

### 3.1 Mathématiques QCM (programme commun spé Maths / Maths complémentaires)

Basé sur l'analyse des annales 2024-2025, le QCM couvre 4 grandes parties :

| Jour | Bloc | Chapitres couverts |
|------|------|-------------------|
| J1 | Calculs & Algèbre | Puissances, racines, logarithmes, exponentielles, fractions, calcul littéral, équations/inéquations du 2nd degré |
| J2 | Fonctions | Dérivation, primitives, limites, asymptotes, continuité, théorème des valeurs intermédiaires, exponentielle, logarithme népérien |
| J3 | Suites numériques | Suites arithmétiques/géométriques, convergence, raisonnement par récurrence, comportement asymptotique |
| J4 | Probabilités | Probabilités conditionnelles, indépendance, variables aléatoires, loi binomiale, espérance/variance |
| J5 | Géométrie dans le plan | Produit scalaire, vecteurs, droites, cercles, trigonométrie |

### 3.2 Mathématiques Spécialité

| Jour | Bloc | Chapitres couverts |
|------|------|-------------------|
| J1 | Analyse I | Limites de fonctions, continuité, TVI, dérivation (fonctions composées) |
| J2 | Analyse II | Fonction logarithme, fonction exponentielle, primitives, équations différentielles y' = ay+b |
| J3 | Géométrie dans l'espace | Vecteurs de l'espace, droites et plans, produit scalaire dans l'espace, équations cartésiennes |
| J4 | Probabilités avancées | Succession d'épreuves indépendantes, loi binomiale, schéma de Bernoulli, probabilités conditionnelles approfondies |
| J5 | Compléments & Synthèse | Intégration, calcul d'aires, suites et récurrence, combinatoire, révision croisée |

### 3.3 Physique-Chimie

| Jour | Bloc | Chapitres couverts |
|------|------|-------------------|
| J1 | Mécanique | Cinématique (vecteur vitesse, accélération), lois de Newton, mouvement dans un champ uniforme (pesanteur), mouvement circulaire, énergie mécanique |
| J2 | Ondes & Optique | Interférences, diffraction, effet Doppler, lunette astronomique, lentilles |
| J3 | Électricité & Circuits | Condensateur (charge/décharge), circuits RC, énergie stockée, loi des mailles/nœuds |
| J4 | Chimie organique & Cinétique | Nomenclature, groupes fonctionnels, mécanismes réactionnels (SN1/SN2/E1/E2), cinétique chimique (vitesse, ordre, t½) |
| J5 | Chimie générale & Synthèse | Acide-base, pH, titrages, dosages, oxydoréduction, piles, révision croisée |

---

## 4. Architecture technique

### 4.1 Stack

```
┌─────────────────────────────────────────┐
│            TABLETTE (navigateur)         │
│  ┌─────────────────────────────────┐    │
│  │   React SPA (Vite + TypeScript) │    │
│  │   - Canvas manuscrit (fabric.js)│    │
│  │   - Rendu LaTeX (KaTeX)         │    │
│  │   - Timer / Chronomètre        │    │
│  │   - Interface QCM (V/F)        │    │
│  └──────────────┬──────────────────┘    │
└─────────────────┼───────────────────────┘
                  │ HTTPS (API REST)
┌─────────────────┼───────────────────────┐
│         VPS (Ubuntu 20.04, 4Go RAM)     │
│  ┌──────────────┴──────────────────┐    │
│  │   Backend Python (FastAPI)      │    │
│  │   - API exercices / correction  │    │
│  │   - Session & suivi Garance    │    │
│  │   - Banque de questions (JSON)  │    │
│  │   - Plan de révision           │    │
│  └──────────────┬──────────────────┘    │
│                 │                        │
│  ┌──────────────┴──────────────────┐    │
│  │   SQLite (données session)      │    │
│  │   + fichiers JSON (banque Q)    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                  │ HTTPS
┌─────────────────┼───────────────────────┐
│          APIs LLM externes              │
│  - Google Gemini 3 Flash (correction    │
│    manuscrit + génération exercices)    │
│  - Google Gemini 3 Pro (cas complexes)  │
│  - Fallback : Claude Sonnet via API    │
│  - NVIDIA (via OpenClaw, gratuit)       │
└─────────────────────────────────────────┘
```

### 4.2 Choix techniques justifiés

| Composant | Choix | Raison |
|-----------|-------|--------|
| Frontend | React + Vite + TS | Rapide à dev, bonne gestion du canvas, SPA fluide sur tablette |
| Canvas manuscrit | **fabric.js** ou **tldraw** | Gestion du stylet, pression, export PNG, undo/redo |
| Rendu maths | KaTeX | Plus rapide que MathJax, suffisant pour le programme terminal |
| Backend | FastAPI (Python 3.10) | Déjà sur le VPS, async, facile à interfacer avec les APIs LLM |
| BDD | SQLite | Mono-utilisateur MVP, zéro config, suffisant pour le suivi |
| OCR manuscrit maths | **Gemini 3 Flash (vision)** | Meilleur rapport coût/qualité pour OCR manuscrit maths+chimie, 15% meilleur que Gemini 2.5 sur handwriting |
| Génération exercices | Gemini 3 Flash | Rapide, context window large pour inclure les annales comme exemples |
| Correction intelligente | Gemini 3 Flash/Pro | Analyse de la réponse, rappel de cours contextualisé |
| Fallback OCR | Mathpix API | Leader OCR maths manuscrit, en backup si Gemini ne suffit pas |

### 4.3 Pipeline de correction d'une réponse manuscrite

```
1. Garance écrit sur le canvas (stylet/doigt)
2. Le canvas exporte un PNG (+ données de strokes si dispo)
3. Le PNG est envoyé au backend
4. Le backend envoie à Gemini 3 Flash (vision) avec le prompt :
   "Voici une réponse manuscrite à la question suivante : [QUESTION].
    La réponse attendue est : [CORRIGÉ].
    Transcris d'abord le texte manuscrit, puis évalue si la réponse
    est correcte, partiellement correcte, ou incorrecte.
    Retourne un JSON structuré."
5. Le backend reçoit le JSON et applique la logique pédagogique :
   - Correct → message d'encouragement
   - Partiellement correct → valorise le bon + rappel de cours + bonne réponse
   - Incorrect/vide → rappel de cours complet + réponse expliquée
6. Le résultat est stocké dans SQLite (progression)
7. Le frontend affiche le feedback formaté (LaTeX pour les maths)
```

### 4.4 Pipeline QCM (pas de LLM pour la correction)

```
1. Garance coche V ou F pour chaque affirmation
2. Le frontend envoie les réponses au backend
3. Le backend compare aux réponses correctes (stockées en JSON)
4. Calcul du score avec barème points négatifs
5. Pour chaque erreur : rappel de cours + explication
6. Stockage progression
```

**Les LLM interviennent uniquement pour GÉNÉRER de nouvelles questions QCM**, pas pour les corriger.

---

## 5. Banque de questions

### 5.1 Sources

| Source | Type | Volume |
|--------|------|--------|
| Annales 2025 | QCM (8 exos) + Maths spé (3 exos) + PC (3 exos) | ~50 questions |
| Annales 2024 | QCM (7 exos) + Maths spé (2 exos) + PC (3 exos) | ~40 questions |
| Générées par IA | Style annales, par chapitre | ~100-150 questions |

### 5.2 Format de stockage (JSON)

```json
{
  "id": "QCM-2025-I-A",
  "matiere": "maths_qcm",
  "chapitre": "calculs_algebre",
  "annee": 2025,
  "source": "annale",
  "type": "vrai_faux",
  "enonce_latex": "\\frac{(\\sqrt{8})^2 \\times (\\sqrt{3})^5}{6^3 \\times \\sqrt{6} \\times (\\sqrt{2})^{-5}} = \\frac{4}{3}",
  "reponse_correcte": true,
  "points": 1,
  "penalite": -0.5,
  "explication": "En simplifiant...",
  "cours_associe": "Propriétés des puissances et racines carrées...",
  "indice": "Commencez par simplifier séparément le numérateur et le dénominateur en utilisant les propriétés des puissances.",
  "difficulte": 2,
  "tags": ["puissances", "racines", "fractions"]
}
```

Pour les exercices rédigés (maths spé + PC) :
```json
{
  "id": "MATHS-SPE-2025-I",
  "matiere": "maths_specialite",
  "chapitre": "analyse_fonctions",
  "annee": 2025,
  "source": "annale",
  "type": "redige",
  "enonce_latex": "On considère la fonction g définie...",
  "sous_questions": [
    {
      "id": "I-1",
      "enonce": "Compléter le tableau des variations...",
      "reponse_attendue": "g est strictement croissante...",
      "reponse_image": null,
      "points": 3,
      "explication": "La dérivée g'(x) = 6x² + 1/x > 0...",
      "cours_associe": "Tableau de variations : on étudie le signe de la dérivée...",
      "indice": "Calculez g'(x) et étudiez son signe.",
      "type_reponse": "manuscrit"
    }
  ],
  "points_total": 14,
  "difficulte": 3,
  "tags": ["fonctions", "derivation", "TVI", "limites"]
}
```

---

## 6. Système de suivi (profil Garance)

### 6.1 Modèle de données SQLite

```sql
-- Session utilisateur
CREATE TABLE utilisateur (
  id INTEGER PRIMARY KEY,
  prenom TEXT NOT NULL,
  date_creation TEXT,
  nb_etapes_revision INTEGER DEFAULT 5,
  etape_courante INTEGER DEFAULT 1
);

-- Résultats par question
CREATE TABLE resultats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur_id INTEGER REFERENCES utilisateur(id),
  question_id TEXT NOT NULL,
  matiere TEXT NOT NULL,
  chapitre TEXT NOT NULL,
  date_reponse TEXT NOT NULL,
  reponse_donnee TEXT,
  est_correct INTEGER, -- 0=faux, 1=partiel, 2=correct
  score_obtenu REAL,
  score_max REAL,
  indice_utilise INTEGER DEFAULT 0,
  temps_reponse_sec INTEGER,
  image_reponse_path TEXT
);

-- Progression par chapitre
CREATE TABLE progression (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur_id INTEGER REFERENCES utilisateur(id),
  matiere TEXT NOT NULL,
  chapitre TEXT NOT NULL,
  niveau TEXT CHECK(niveau IN ('non_vu','en_cours','fragile','acquis','maitrise')),
  score_moyen REAL,
  nb_questions_faites INTEGER DEFAULT 0,
  nb_correct INTEGER DEFAULT 0,
  derniere_activite TEXT,
  UNIQUE(utilisateur_id, matiere, chapitre)
);

-- Simulations chronométrées
CREATE TABLE simulations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilisateur_id INTEGER REFERENCES utilisateur(id),
  date_simulation TEXT,
  duree_totale_sec INTEGER,
  score_qcm REAL,
  score_maths_spe REAL,
  score_pc REAL,
  score_total REAL,
  note_sur_20 REAL
);
```

### 6.2 Niveaux d'acquisition

| Niveau | Critère | Couleur |
|--------|---------|---------|
| Non vu | Aucune question tentée | Gris |
| En cours | < 3 questions faites | Bleu |
| Fragile | Score moyen < 50% | Orange |
| Acquis | Score moyen 50-80% | Vert clair |
| Maîtrisé | Score moyen > 80% | Vert foncé |

### 6.3 Calcul de note Polytech

La note est ramenée sur 20 selon le barème officiel :
- Note QCM /40 + Note Maths Spé /40 + Note PC /40 = Total /120
- Conversion /20 = Total × 20 / 120

---

## 7. Interface utilisateur (tablette-first)

### 7.1 Écrans principaux

1. **Accueil** — "Bonjour Garance" + progression globale + suggestion du jour
2. **Plan de révision** — Vue des 5 jours, chapitres, avancement par matière
3. **Mode exercice** — Énoncé + canvas d'écriture + boutons (Indice / Valider / Passer)
4. **Mode QCM** — Grille V/F cliquable (reproduit la feuille réelle) + chronomètre
5. **Correction** — Feedback LLM + rappel de cours + score
6. **Tableau de bord** — Progression par chapitre, notes simulées, analyse IA
7. **Mode simulation** — 3h chronométrées, conditions réelles, pas d'indice

### 7.2 Canvas manuscrit

- Zone d'écriture plein écran optimisée tablette
- Support stylet + pression
- Outils : couleur (noir/bleu/rouge), épaisseur, gomme, undo/redo, effacer tout
- Export PNG pour envoi au backend
- Pas de reconnaissance temps réel (on envoie l'image à la soumission)

### 7.3 Feedback pédagogique (3 niveaux)

**Niveau 1 — Correct :**
> "Bravo Garance ! Ta réponse est parfaite. [Explication courte de pourquoi c'est juste]"

**Niveau 2 — Partiellement correct :**
> "Bon début ! Tu as bien [partie correcte]. Cependant, [erreur identifiée].
> 📚 **Rappel de cours** : [point de cours pertinent]
> ✅ **Réponse complète** : [correction détaillée]"

**Niveau 3 — Incorrect ou vide :**
> "Pas de souci, c'est justement pour apprendre !
> 📚 **Rappel de cours** : [cours complet sur la notion]
> ✅ **Réponse expliquée** : [correction pas à pas]"

### 7.4 Système d'indices

Un seul bouton "Indice" par question. L'indice :
- Donne une PISTE, pas la réponse
- Oriente vers la bonne méthode
- Rappelle une formule clé si pertinent
- Est pré-rédigé dans la banque de questions (pas de LLM à ce stade)
- L'utilisation d'un indice est tracée (impact possible sur le score en mode simulation)

---

## 8. APIs LLM — Stratégie multi-modèles

### 8.1 Répartition par tâche

| Tâche | Modèle principal | Fallback | Coût estimé |
|-------|-----------------|----------|-------------|
| OCR manuscrit (canvas PNG → LaTeX) | Gemini 3 Flash (vision) | Mathpix API | ~$0.001/image |
| Correction réponse rédigée | Gemini 3 Flash | Gemini 3 Pro | ~$0.002/correction |
| Génération exercices QCM | Gemini 3 Flash | Claude Sonnet | ~$0.005/exercice |
| Génération exercices rédigés | Gemini 3 Pro | Claude Sonnet | ~$0.01/exercice |
| Analyse progression / conseils | Gemini 3 Flash | Claude Haiku | ~$0.003/analyse |
| Indices dynamiques (V2) | NVIDIA (gratuit via OpenClaw) | Gemini Flash | $0 |

### 8.2 Prompts système

Les prompts sont stockés dans `/prompts/` et versionnés. Exemples clés :

- `correction_manuscrit.md` — Transcription + évaluation
- `generation_qcm.md` — Génération de questions QCM type Polytech
- `generation_redige.md` — Génération d'exercices rédigés
- `feedback_pedagogique.md` — Template de feedback selon le niveau
- `analyse_progression.md` — Analyse des forces/faiblesses

---

## 9. Organisation du code

```
polytech-revision/
├── README.md
├── docker-compose.yml          # Optionnel mais recommandé
├── docs/
│   ├── SPEC_GENERALE_V1.md     # Ce document
│   ├── SPEC_RUN0.md
│   ├── SPEC_RUN1.md
│   ├── CHANGELOG.md
│   └── DEVLOG.md               # Journal de Léo
├── backend/
│   ├── requirements.txt
│   ├── main.py                 # FastAPI app
│   ├── config.py               # Clés API, chemins
│   ├── models/                 # SQLAlchemy models
│   ├── routers/
│   │   ├── exercices.py        # CRUD exercices
│   │   ├── correction.py       # Pipeline correction LLM
│   │   ├── progression.py      # Suivi Garance
│   │   └── simulation.py       # Mode simulation
│   ├── services/
│   │   ├── llm_service.py      # Abstraction multi-LLM
│   │   ├── ocr_service.py      # OCR manuscrit
│   │   ├── scoring.py          # Calcul scores Polytech
│   │   └── revision_plan.py    # Planification 5 jours
│   ├── data/
│   │   ├── questions/          # JSON banque de questions
│   │   ├── cours/              # Fiches de cours par chapitre
│   │   └── annales/            # PDFs originaux (lecture seule)
│   └── prompts/                # Prompts LLM versionnés
│       ├── correction_manuscrit.md
│       ├── generation_qcm.md
│       └── feedback_pedagogique.md
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── RevisionPlan.tsx
│   │   │   ├── Exercise.tsx
│   │   │   ├── QCM.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Simulation.tsx
│   │   ├── components/
│   │   │   ├── Canvas.tsx       # Zone d'écriture manuscrite
│   │   │   ├── QCMGrid.tsx      # Grille V/F
│   │   │   ├── Feedback.tsx     # Affichage correction
│   │   │   ├── Timer.tsx        # Chronomètre
│   │   │   ├── ProgressBar.tsx
│   │   │   └── MathRender.tsx   # Rendu KaTeX
│   │   ├── services/
│   │   │   └── api.ts           # Client API backend
│   │   └── types/
│   │       └── index.ts
│   └── public/
└── tests/
    ├── test_correction.py
    ├── test_scoring.py
    ├── test_ocr.py
    └── e2e/
        ├── polytech_e2e.py
        ├── scenarios.py
        ├── fixtures/
        │   ├── fixture_correct.png
        │   ├── fixture_partielle.png
        │   ├── fixture_fausse.png
        │   ├── fixture_vide.png
        │   └── generate_fixtures.py
        ├── reports/
        ├── screenshots/
        └── README.md
```

---

## 10. Plan de développement par runs

| Run | Contenu | Livrable |
|-----|---------|----------|
| **Run 0** | Environnement : VPS, repo GitHub, structure projet, dépendances, CI minimal | Projet bootable, `npm run dev` + `uvicorn` fonctionnels |
| **Run 1** | Backend core : API exercices, banque questions annales 2024+2025 extraites, correction QCM, modèle SQLite | API testable via curl/Postman |
| **Run 2** | Frontend QCM : interface QCM V/F, chronomètre, feedback, scoring | QCM jouable sur tablette |
| **Run 3** | Canvas + OCR : zone d'écriture, intégration Gemini vision, correction manuscrit | Exercice rédigé jouable |
| **Run 3.1** | **Test E2E : protocole Playwright Firefox headless, 29 scénarios par domaine, fixtures manuscrites, CR structuré pour correction, filtrage --tag/--sc/--rerun-fails** | **Script E2E opérationnel, premier CR baseline généré** |
| **Run 4** | Progression + Dashboard : suivi, plan de révision 5J, notes simulées, analyse | Tableau de bord fonctionnel |
| **Run 5** | Génération IA + Polish : exercices générés, fiches de cours, mode simulation 3h, peaufinage UX | MVP complet pour Garance |

### Contrainte temps
- Runs 0-5 en 3 jours
- Runs parallélisables : Run 1 (backend) + Run 2 (frontend) peuvent avancer ensemble
- Priorisation : QCM d'abord (plus simple, plus de questions), puis rédigé

---

## 11. Sécurité & Contraintes

- **Pas d'auth complexe** : login simple prénom (MVP mono-utilisatrice)
- **HTTPS** : via Let's Encrypt ou Caddy (reverse proxy)
- **Clés API** : dans `.env`, jamais dans le repo
- **Données** : locales au VPS, pas de cloud tiers pour les données élève
- **RGPD** : non applicable (usage familial privé)

---

## 12. Documentation obligatoire

À chaque run, Léo doit :
1. Mettre à jour le `CHANGELOG.md` avec les changements
2. Mettre à jour le `README.md` avec les instructions d'installation/lancement
3. Committer et pusher sur GitHub avec un message clair
4. Mettre à jour son `DEVLOG.md` avec les décisions prises et problèmes rencontrés

---

## 13. Critères de succès MVP

- [ ] Garance peut faire un QCM complet (8 exercices) avec correction immédiate
- [ ] Garance peut écrire une réponse manuscrite et recevoir une correction LLM
- [ ] Le plan de révision 5 jours est affiché avec les chapitres
- [ ] La progression est visible par matière et chapitre
- [ ] Un mode simulation 3h existe
- [ ] L'app est fluide sur iPad/tablette Android en mode paysage
- [ ] Toutes les annales 2024+2025 sont intégrées
- [ ] Au moins 20 exercices générés par IA sont disponibles par matière

---

## 14. Tests E2E — Protocole

### Outil
Script Playwright (Firefox headless) dans `tests/e2e/polytech_e2e.py`.
Pas de framework de test — script standalone Python + CR Markdown.

### Invocations principales
- `python3 tests/e2e/polytech_e2e.py --all` — test complet (29 scénarios, ~3 min)
- `python3 tests/e2e/polytech_e2e.py --tag {domaine}` — test ciblé (accueil, qcm, manuscrit, correction-llm, dashboard, simulation, responsive)
- `python3 tests/e2e/polytech_e2e.py --sc SC-XX` — scénario unique
- `python3 tests/e2e/polytech_e2e.py --rerun-fails` — relance uniquement les échecs du dernier CR

### Domaines couverts
| Domaine | Scénarios | Couvre |
|---------|-----------|-------|
| accueil | SC-01 à SC-03 | Chargement, bienvenue, suggestion |
| qcm | SC-10 à SC-14 | Navigation, V/F, chrono, scoring, barème |
| manuscrit | SC-20 à SC-23 | Canvas, injection PNG, undo/redo, export |
| correction-llm | SC-30 à SC-35 | Correction correcte/partielle/fausse, vide, timeout, indice |
| dashboard | SC-40 à SC-43 | Matières, chapitres, couleurs, plan révision |
| simulation | SC-50 à SC-53 | Chrono 3h, enchaînement, pas d'indice, score final |
| responsive | SC-60 à SC-62 | iPad paysage/portrait, mobile |

### Cycle de correction basé sur le CR
1. Lire le CR (section "Actions prioritaires")
2. Pour chaque FAIL : diagnostic → correction → test unitaire → documentation
3. `--rerun-fails` pour vérifier les corrections
4. `--all` pour la non-régression
5. Commit avec le CR propre

### Fixtures manuscrites
4 images PNG dans `tests/e2e/fixtures/` — réponses correcte, partielle, fausse, et vide.
Utilisées par les scénarios SC-30 à SC-33 pour tester le pipeline OCR + correction LLM.

### Spec détaillée
Voir `SPEC_RUN3.1_TEST_E2E_V1.md`
