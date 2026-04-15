# Présentation des exercices LLM — État du système (15/04/2026)

Ce document explique l'architecture et l'implémentation du système de révision PolytechRevision, conçu pour permettre à un LLM de comprendre comment les données sont structurées et servies.

## 1. Architecture Générale

Le projet est divisé en deux parties :
- **Backend (FastAPI)** : Gère la logique des questions, le stockage SQLite de la progression et la conversion des PDFs.
- **Frontend (React)** : Fournit une interface interactive (Cahier numérique) permettant de dessiner des réponses manuscrites corrigées par IA.

## 2. Structure des Données (JSON)

Les exercices sont définis dans `backend/data/questions/*.json`. Chaque fichier représente une annale complète.

### Métadonnées de l'annale
- `annee` : Année du concours.
- `source_pdf` : Nom du fichier PDF principal (dans `backend/data/annales/`).
- `source_corrige` : PDF du corrigé officiel.

### Structure d'un Exercice
Un exercice possède des attributs critiques pour l'affichage visuel :
- `pages_enonce` : Tableau des numéros de pages à extraire du `source_pdf`.
- `pages_doc_reponse` : Objet contenant `pdf` (nom du fichier) et `pages` (tableau). Cela permet de pointer vers un fichier de "documents réponses" distinct du sujet.

## 3. Pipeline d'Affichage des Énoncés (PDF-to-Image)

Pour garantir la fidélité des schémas scientifiques (non reproductibles proprement en Markdown/Latex), le système utilise une extraction visuelle :

1.  **Requête Frontend** : L'interface demande l'image d'une page via `/api/exercices/pdf-page/{filename}/{page}`.
2.  **Conversion Backend** : Le service `pdf_service.py` utilise `pdftoppm` pour convertir la page en PNG (200 DPI).
3.  **Mise en Cache** : Les images sont stockées dans `backend/data/page_cache/` pour éviter les reconversions coûteuses.
4.  **Rendu Hybride** : Le frontend affiche d'abord les images de l'énoncé, puis les documents réponses, puis le texte de la question.

## 4. Exemple Concret : Catapulte spatiale (PC2025-I)

L'exercice `PC2025-I` illustre parfaitement cette structure hybride :

```json
{
  "id": "PC2025-I",
  "titre": "Catapulte spatiale (Mécanique)",
  "source_pdf": "Enonce-GP-2025-VF.pdf",
  "pages_enonce": [6],
  "pages_doc_reponse": {
    "pdf": "docs-reponses-vierges-2025.pdf",
    "pages": [4]
  }
}
```

### Comportement du système :
- **Énoncé** : Le système extrait la **page 6** du sujet 2025. C'est là que se trouvent le schéma du bras de la catapulte et le texte d'introduction.
- **Document Réponse** : Le système extrait la **page 4** du PDF `docs-reponses-vierges-2025.pdf`. C'est là que se trouve le cadre pour le bilan des forces et les axes tangentiels/normaux.
- **Fusion** : Dans l'interface, l'étudiant voit d'abord le schéma de principe (sujet), puis le document sur lequel il doit "dessiner" (réponse), puis la question spécifique.

## 5. Correction IA (Vision)

Lorsqu'un étudiant soumet une réponse manuscrite (Canvas exporté en Base64), le LLM reçoit :
1.  Le texte de la question et la réponse attendue.
2.  L'image de la réponse de l'étudiant.
3.  (Optionnel) L'image de l'énoncé source pour contexte visuel.

Le LLM doit alors valider non seulement le résultat numérique mais aussi la cohérence du schéma (ex: sens des vecteurs forces sur la catapulte).
