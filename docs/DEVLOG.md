# Journal de développement — PolytechRevision

## 2026-04-16 — Run 3.1 : Test Enhancement

Aujourd'hui, j'ai implémenté le protocole de test End-to-End (E2E) pour garantir la stabilité de l'application au fur et à mesure des développements.

### Décisions techniques :
1. **Playwright Firefox Headless** : Choisi pour sa légèreté par rapport à Chromium (4 Go RAM VPS).
2. **Framework Standalone** : Pas de pytest/unittest pour rester sur un script Python simple et direct produisant du Markdown.
3. **Injection Canvas via Evaluation JS** : Permet de tester le pipeline OCR+LLM sans avoir à simuler des mouvements de souris complexes.
4. **data-testid** : Généralisation des identifiants de test pour découpler les tests de la structure CSS/DOM.

### Problèmes rencontrés et résolus :
- **Imports KaTeX** : Les types de KaTeX contrib posaient problème lors du build. Résolu par un import dynamique (`import()`) et un `@ts-ignore`.
- **Chemins Fixtures** : Correction des chemins relatifs pour que le script E2E trouve les images quel que soit le répertoire d'exécution.
- **Exposure des fonctions** : J'ai dû m'assurer que les fonctions `__injectTestImage` soient exposées sur l'objet `window` de manière stable lors du montage des composants `MiniCanvas`.

### État du Baseline :
- 100% PASS sur Accueil, QCM, Dashboard et Plan.
- PASS sur l'injection et la correction LLM (SC-30).
- FAIL sur les outils secondaires (undo/clear) et le bouton indice (nécessite ajustement des sélecteurs ou visibilité).

## 2026-04-14 — Session de Test Run 3

### État d'avancement
**✅ Complété :**
- Intégration frontend Run 3 (DrawingCanvas, ExerciceRedige, routing)
- Mapping chapitres corrigé (Analyse I/II, mécanique/optique)
- Fix bugs affichage (MathRender KaTeX avec auto-render, Fabric.js v7)
- Réécriture complète JSON questions avec énoncés explicites
- Tests API backend : 6/6 passed

**🔄 À finaliser :**
- Tests E2E avec nouvelles données JSON (requiert redémarrage backend)
