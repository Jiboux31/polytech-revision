# Rapport d'Audit & Correction : Affichage des Énoncés Complets (15 avril 2026)

## 📌 Problématique
Plusieurs exercices du concours Geipi Polytech font référence à des schémas, graphiques ou tableaux situés soit dans l'énoncé original, soit dans des documents réponses séparés. L'extraction de texte brute via JSON ne permettait pas de fournir ces éléments visuels cruciaux à Garance.

## ✅ Actions Réalisées

### 1. Backend & Infrastructure
- **pdftoppm** : Installation et validation de l'outil de conversion PDF vers PNG.
- **pdf_service.py** : Création d'un service de conversion à la volée avec cache automatique dans `backend/data/page_cache/`.
- **API Endpoint** : Création de `/api/exercices/pdf-page/{filename}/{page}` pour servir les images de pages spécifiques.

### 2. Frontend
- **Composant ExerciceRedige.tsx** : Refonte pour supporter l'affichage hybride (Enoncé principal + Documents réponses).
- **Logique de rendu** : Support des champs `pages_enonce` et du nouvel objet `pages_doc_reponse`.
- **Performance** : Mise en place d'un lazy loading et d'un indicateur de chargement pendant la conversion PDF.

### 3. Données (JSON)
Audit et mise à jour des 4 fichiers d'annales (`pc_2024`, `pc_2025`, `maths_spe_2024`, `maths_spe_2025`) :
- Recalibrage des numéros de pages sur les fichiers PDF réels du VPS.
- Ajout des liens vers les PDF de réponses (`docs-reponses-vierges-2025.pdf` et `Docs-reponses-vierges-combines-2024.pdf`).

## 📊 État Final de l'Audit (Pixel-Perfect)

| Matière | Année | Statut | Éléments visuels récupérés |
| :--- | :--- | :--- | :--- |
| Physique-Chimie | 2025 | ✅ OK | Catapulte (p.6), Courbes Hydrolyse (DR p.4), Décharge RC (p.8) |
| Physique-Chimie | 2024 | ✅ OK | Diffraction (p.6), Estérification, Saut à ski (p.8) |
| Maths Spécialité | 2025 | ✅ OK | Tableaux de variations et grilles de géométrie (DR p.2-3) |
| Maths Spécialité | 2024 | ✅ OK | Équations différentielles et suites |

## 🚀 Prochaines Étapes
- Déploiement du module de correction par vision (Gemini 3) pour comparer les dessins de Garance aux schémas PDF.
- Finalisation de la page de statistiques.
