# SPEC_RUN1_BACKEND_CORE_V2.md — Backend + Banque de questions (MISE À JOUR)

> **Run** : 1 — Backend Core (API + Questions + BDD)
> **Version** : V2 — Banque de questions complète fournie
> **Changement vs V1** : Toutes les données QCM et exercices rédigés sont dans `BANQUE_QUESTIONS_ANNALES.md`. Léo n'a plus à transcrire de PDF.

---

## 0. Vérification pré-run

1. Le repo GitHub distant existe et est pushé (si non → créer le remote et pusher)
2. `curl http://localhost:8042/health` → `{"status":"ok"}`
3. Copier les PDFs des annales dans `backend/data/annales/` (JB fournit les fichiers)

---

## 1. Base de données SQLite

Identique à la V1. Voir `SPEC_RUN1_BACKEND_CORE_V1.md` section 1.
(Créer `backend/models/database.py` avec le schéma complet + seed Garance, brancher dans main.py)

---

## 2. Banque de questions

### CHANGEMENT MAJEUR vs V1

Toutes les données sont dans le fichier `docs/BANQUE_QUESTIONS_ANNALES.md`. Ce fichier contient :

| Fichier JSON à créer | Source | Statut |
|---------------------|--------|--------|
| `qcm_2024.json` | Fourni complet dans SPEC_RUN1_V1 | ✅ Copier tel quel |
| `qcm_2025.json` | Fourni complet dans BANQUE_QUESTIONS_ANNALES.md | ✅ Copier tel quel |
| `maths_spe_2025.json` | Fourni complet dans BANQUE_QUESTIONS_ANNALES.md | ✅ Copier tel quel |
| `pc_2025.json` | Fourni complet dans BANQUE_QUESTIONS_ANNALES.md | ✅ Copier tel quel |
| `maths_spe_2024.json` | Structure fournie, Léo extrait les réponses des corrigés PDF | ⚠️ Léo complète |
| `pc_2024.json` | Structure fournie, Léo extrait les réponses des corrigés PDF | ⚠️ Léo complète |

**Instruction Léo** : pour les fichiers marqués ✅, copie le JSON exactement comme fourni. Pour les fichiers marqués ⚠️, suis le format identique aux fichiers 2025 et remplis les réponses depuis les corrigés PDF qui sont dans `backend/data/annales/`.

### Structure des fichiers

```
backend/data/questions/
├── qcm_2024.json          # ✅ fourni complet (7 exercices, ~30 questions)
├── qcm_2025.json          # ✅ fourni complet (8 exercices, ~30 questions)
├── maths_spe_2024.json    # ⚠️ à compléter par Léo (2 exercices)
├── maths_spe_2025.json    # ✅ fourni complet (3 exercices, ~20 sous-questions)
├── pc_2024.json           # ⚠️ à compléter par Léo (3 exercices)
└── pc_2025.json           # ✅ fourni complet (3 exercices, ~25 sous-questions)
```

---

## 3. Services

Identiques à la V1. Voir `SPEC_RUN1_BACKEND_CORE_V1.md` sections 3, 4, 5.

Un ajout : le `questions_service.py` doit gérer le format "exercices rédigés" (avec `sous_questions`) en plus du format QCM (avec `questions`).

---

## 4. API Routes

Identiques à la V1. Voir `SPEC_RUN1_BACKEND_CORE_V1.md` section 5.

---

## 5. Tests de validation

Identiques à la V1. Voir `SPEC_RUN1_BACKEND_CORE_V1.md` section 6.
Les 7 tests curl sont tous obligatoires.

---

## 6. Git

```
git add .
git commit -m "Run 1: backend core - question bank (2024+2025), QCM correction, progression tracking"
git push origin main
```

Mettre à jour CHANGELOG.md et DEVLOG.md.

---

## 7. Référence aux fichiers de spec

Léo doit lire dans cet ordre :
1. `docs/SPEC_GENERALE_V1.md` (contexte global)
2. `docs/SPEC_RUN1_BACKEND_CORE_V1.md` (code des services/routes/modèles)
3. `docs/BANQUE_QUESTIONS_ANNALES.md` (données JSON complètes)
4. Ce fichier (`docs/SPEC_RUN1_BACKEND_CORE_V2.md`) pour les changements
