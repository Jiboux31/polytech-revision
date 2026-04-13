# Changelog

## [0.1.0] - 2026-04-12

### Run 0 — Environnement
- Création du repo GitHub
- Structure du projet (backend + frontend + docs + tests)
- Backend FastAPI minimal (health check)
- Frontend React+Vite minimal (page d'accueil)
- Documentation initiale (SPEC_GENERALE, SPEC_RUN0)

## [0.2.0] - 2026-04-13

### Run 1 — Backend Core V2
- Création de la base de données SQLite (`database.py`) avec seed "Garance" (ID: 1).
- Import et service de la banque de questions (QCM et Spécialité) depuis `BANQUE_QUESTIONS_ANNALES.md` via des fichiers JSON.
- Création des endpoints API `/api/exercices/*`, `/api/correction/*`, et `/api/progression/*`.
- Algorithme de scoring des QCM avec points négatifs.
- Calcul dynamique du plan de révision sur 5 jours selon la spécification.
- 100% des tests API validés (`/health`, `/plan`, `/chapitres`, `/chapitre`, `/correction/qcm`, `/progression`).
