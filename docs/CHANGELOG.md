# Changelog

## [Run 4] - 2026-04-16
### Ajouté
- **Dashboard Avancé** : Vue d'ensemble des statistiques, progression par chapitre, et historique.
- **Note Polytech Estimée** : Calcul dynamique d'une note sur 20 basée sur les coefficients du concours.
- **Analyse IA Personnalisée** : Génération de conseils par Gemini basés sur les points faibles détectés.
- **Mode Simulation 3h** : Épreuve chronométrée complète avec tirage aléatoire d'exercices.
- **Génération d'Exercices IA** : Création d'exercices QCM inédits à la demande via Gemini.
- **Page QCMGenere** : Support pour jouer les exercices générés par l'IA.

### Corrigé
- **LLM Service** : Ajout de `call_gemini_text` pour les prompts textuels purs.
- **Robustesse JSON** : Correction des erreurs "Invalid \escape" en LaTeX par l'abandon du mode JSON natif de l'API Gemini et l'ajout d'une sanitization manuelle des backslashes.
- **Troncature Flux** : Passage de `maxOutputTokens` à 8192 pour supporter la génération d'exercices longs.

## [Run 3.1] - 2026-04-16
### Ajouté
- **Protocole de test E2E** : Script Playwright standalone (`polytech_e2e.py`) avec 29 scénarios.
- **Fixtures manuscrites** : Génération d'images PNG pour tester le pipeline OCR+LLM.
- **Rapports de test** : Génération automatique de comptes-rendus Markdown et captures d'écran.
- **data-testid** : Marquage des composants React pour la testabilité.
- **Exposition Canvas** : Fonctions `window.__injectTestImage`, `__getCanvasExport`, `__clearCanvas` pour l'injection automatisée.

### Corrigé
- **MathRender** : Correction des problèmes d'import KaTeX contrib en utilisant des imports dynamiques et suppression des erreurs de types TypeScript.
- **Navigation Plan** : Ajout des tags `data-testid` manquants sur les matières dans le plan de révision.

## [Unreleased] - Run 2 en cours

### Hotfix : Affichage des Énoncés PDF (2026-04-15)
- **Infrastructure** : Mise en place de `pdftoppm` et d'un service de cache d'images pour les pages PDF.
- **Backend** : Nouvel endpoint `/api/exercices/pdf-page` pour servir les schémas et graphiques originaux.
- **Frontend** : Refonte de `ExerciceRedige.tsx` pour intégrer dynamiquement les pages de l'énoncé et des documents réponses.
- **Données** : Audit complet et synchronisation des pages PDF pour l'ensemble des exercices 2024 et 2025 (PC et Maths Spé).

### Début Run 2 — Frontend QCM (2026-04-13)
- Intégration React Router pour la navigation entre pages (Home, Plan, QCM, Résultats, Dashboard).
- Mise en place des variables CSS avec palette "cahier moderne" et typographie Source Sans 3.
- Création du client API (`fetch`) pour communiquer avec le backend FastAPI.
- Composants réutilisables : Header, MathRender (KaTeX), Timer, VFButton.
- Pages Home, Dashboard, RevisionPlan, QCM, QCMResult avec rendu LaTeX et gestion d'état.

## [0.2.0] - 2026-04-13

### Run 1 — Backend Core V2
- Création de la base de données SQLite (`database.py`) avec seed "Garance" (ID: 1).
- Import et service de la banque de questions (QCM et Spécialité) depuis `BANQUE_QUESTIONS_ANNALES.md` via des fichiers JSON.
- Création des endpoints API `/api/exercices/*`, `/api/correction/*`, et `/api/progression/*`.
- Algorithme de scoring des QCM avec points négatifs.
- Calcul dynamique du plan de révision sur 5 jours selon la spécification.
- 100% des tests API validés (`/health`, `/plan`, `/chapitres`, `/chapitre`, `/correction/qcm`, `/progression`).

## [0.1.0] - 2026-04-12

### Run 0 — Environnement
- Création du repo GitHub
- Structure du projet (backend + frontend + docs + tests)
- Backend FastAPI minimal (health check)
- Frontend React+Vite minimal (page d'accueil)
- Documentation initiale (SPEC_GENERALE, SPEC_RUN0)
