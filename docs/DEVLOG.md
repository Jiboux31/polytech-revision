# Journal de développement — PolytechRevision

## 2026-04-16 — Run 4 : Dashboard, Simulation et Génération IA

Aujourd'hui, j'ai implémenté le Run 4, transformant l'outil de révision en une plateforme adaptative et complète.

### Décisions techniques :
1. **Scoring Polytech** : Implémentation de la logique de calcul de note sur 20 en ramenant chaque bloc (QCM, Maths Spé, PC) sur 40 points, simulant les coefficients réels du concours.
2. **Analyse IA par bloc** : Utilisation d'un prompt structuré pour Gemini (`call_gemini_text`) afin d'obtenir une analyse textuelle synthétique plutôt qu'une simple liste de stats.
3. **Simulation multi-phase** : Création d'un automate d'état simple (`phase`) dans `Simulation.tsx` pour gérer l'intro, les épreuves et les résultats sans multiplier les composants.
4. **Génération QCM style Geipi** : Le prompt IA force l'utilisation de LaTeX et le format VRAI/FAUX typique du concours pour garantir la cohérence pédagogique.
5. **QCMGenere** : Création d'une page dédiée pour éviter de polluer le système de fichiers avec des exercices temporaires ; tout passe par le state React.

### Problèmes rencontrés et résolus :
- **Parsing JSON IA** : Gemini entoure parfois ses réponses de markdown. Ajout d'une regex de nettoyage dans `generation.py` pour garantir la compatibilité avec `json.loads`.
- **Note Polytech OOM** : Prévention des divisions par zéro si aucune question n'a été répondue dans une matière donnée.

### État de la plateforme :
- **Dashboard** : Opérationnel avec J-Restants et Note /20.
- **Simulation** : MVP fonctionnel (chronomètre et enregistrement des scores). L'intégration profonde des composants de dessin dans la simulation est prévue pour le Run 5.
- **IA** : Génération d'exercices fonctionnelle sur tous les chapitres mathématiques.

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


## 2026-04-15 — Session de Run 3.1
un 3.1 terminé. Le protocole de test E2E est opérationnel et intégré au workflow.

**Décisions techniques :

1. Playwright Firefox Headless : Choisi pour sa légèreté (4 Go RAM VPS).
2. Framework Standalone : Script Python direct produisant du Markdown (pas de pytest).
3. Injection Canvas via Evaluation JS : Pour tester le pipeline OCR+LLM sans simuler de gestes complexes.
4. data-testid : Généralisation des identifiants pour découpler les tests de la structure CSS.

**Résumé du Baseline CR (16/04/2026) :

• Framework : Playwright Firefox Headless sur Python 3.10.
• Domaines 100% PASS : Accueil (chargement, bienvenue), QCM (navigation, V/F, chrono, scoring), Dashboard, Plan de révision.
• Pipeline OCR+LLM : PASS (le scénario SC-30 a validé l'injection d'une fixture PNG dans le canvas et la réception d'une correction "Correct" par Gemini Vision).
• FAIL identifiés : Outils de toolbar (tool-undo, tool-clear) et hint-button (sélecteurs à ajuster ou visibilité selon le scroll). SC-33 a révélé un bug réel dans la fonction clear de Fabric.js v7.

**Actions réalisées :

1. Mise à jour des composants : Ajout des data-testid et exposition des fonctions d'injection (window.__injectTestImage) dans MiniCanvas.tsx.
2. Correction MathRender : Passage en import dynamique pour KaTeX contrib (auto-render) afin de corriger les erreurs de build TypeScript.
3. Script E2E : Création de polytech_e2e.py et scenarios.py (29 scénarios).
4. Documentation : Mise à jour de SPEC_GENERALE_V1.md, CHANGELOG.md et DEVLOG.md.
5. Livraison : Tout est commité et pushé sur le repo.