# Journal de développement — PolytechRevision

## 2026-04-16 — Run 4 : Dashboard, Simulation et Génération IA

Aujourd'hui, j'ai implémenté le Run 4, transformant l'outil de révision en une plateforme adaptative et complète.

### Décisions techniques :
1. **Scoring Polytech** : Implémentation de la logique de calcul de note sur 20 en ramenant chaque bloc (QCM, Maths Spé, PC) sur 40 points, simulant les coefficients réels du concours.
2. **Analyse IA par bloc** : Utilisation d'un prompt structuré pour Gemini (`call_gemini_text`) afin d'obtenir une analyse textuelle synthétique plutôt qu'une simple liste de stats.
3. **Simulation multi-phase** : Création d'un automate d'état simple (`phase`) dans `Simulation.tsx` pour gérer l'intro, les épreuves et les résultats sans multiplier les composants.
4. **Génération QCM style Geipi** : Le prompt IA force l'utilisation de LaTeX et le format VRAI/FAUX typique du concours pour garantir la cohérence pédagogique.
5. **Robustesse JSON (Hotfix)** : 
   - Désactivation du mode `responseMimeType: "application/json"` pour la génération d'exercices car Gemini ne double pas correctement les backslashes LaTeX (`\frac`), ce qui cassait le parsing.
   - Implémentation d'une fonction de "sauvetage" (sanitization) via regex pour doubler les backslashes isolés avant le `json.loads`.
   - Augmentation de `maxOutputTokens` à 8192 pour éviter les troncatures sur les exercices complexes.

### Problèmes rencontrés et résolus :
- **Parsing JSON IA** : Erreur "Invalid \escape" due aux commandes LaTeX. Résolu par l'abandon du mode JSON natif de l'API au profit d'un parsing manuel avec sanitization.
- **Note Polytech OOM** : Prévention des divisions par zéro si aucune question n'a été répondue dans une matière donnée.
- **Vite Args** : Correction d'une erreur de commande dans le script de démarrage (`npm run dev`) qui empêchait le rechargement à chaud.

### État de la plateforme :
- **Dashboard** : Opérationnel avec J-Restants et Note /20.
- **Simulation** : MVP fonctionnel (chronomètre et enregistrement des scores). L'intégration profonde des composants de dessin dans la simulation est prévue pour le Run 5.
- **IA** : Génération d'exercices fonctionnelle et stable sur tous les chapitres mathématiques.

---

## 2026-04-16 — Run 3.1 : Test Enhancement

Implémentation du protocole de test End-to-End (E2E) pour garantir la stabilité de l'application.

### Décisions techniques :
1. **Playwright Firefox Headless** : Choisi pour sa légèreté par rapport à Chromium (4 Go RAM VPS).
2. **Framework Standalone** : Pas de pytest/unittest pour rester sur un script Python simple et direct produisant du Markdown.
3. **Injection Canvas via Evaluation JS** : Permet de tester le pipeline OCR+LLM sans simuler des mouvements de souris complexes.
4. **data-testid** : Généralisation des identifiants de test pour découpler les tests de la structure CSS/DOM.

### Problèmes rencontrés et résolus :
- **Imports KaTeX** : Les types de KaTeX contrib posaient problème lors du build. Résolu par un import dynamique (`import()`) et un `@ts-ignore`.
- **Chemins Fixtures** : Correction des chemins relatifs pour que le script E2E trouve les images quel que soit le répertoire d'exécution.
- **Exposure des fonctions** : J'ai dû m'assurer que les fonctions `__injectTestImage` soient exposées sur l'objet `window` de manière stable lors du montage des composants `MiniCanvas`.

### État du Baseline :
- 100% PASS sur Accueil, QCM, Dashboard et Plan.
- PASS sur l'injection et la correction LLM (SC-30).
- FAIL sur les outils secondaires (undo/clear) et le bouton indice (nécessite ajustement des sélecteurs ou visibilité).

---

## 2026-04-15 — Session de Test Run 3

### État d'avancement
**✅ Complété :**
- Intégration frontend Run 3 (DrawingCanvas, ExerciceRedige, routing)
- Mapping chapitres corrigé (Analyse I/II, mécanique/optique)
- Fix bugs affichage (MathRender KaTeX avec auto-render, Fabric.js v7)
- Réécriture complète JSON questions avec énoncés explicites
- Tests API backend : 6/6 passed

**🔄 À finaliser :**
- Tests E2E avec nouvelles données JSON (requiert redémarrage backend)
