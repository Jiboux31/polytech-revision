# HOTFIX_RUN2_DONNEES.md — Corrections de la banque de questions

> **Contexte** : Le Run 2 fonctionne techniquement mais 3 bugs de données sont identifiés.
> **À appliquer** : immédiatement, avant de passer au Run 3.

---

## Bug 1 : Pas d'énoncé commun pour les exercices à plusieurs affirmations

### Problème
Les exercices QCM Polytech ont souvent un **contexte partagé** (définition d'une fonction, d'une suite, d'un événement) suivi de N affirmations V/F. Le format JSON actuel met tout dans le champ `enonce` de chaque question, ce qui duplique le contexte ou le perd.

### Solution
Ajouter un champ `enonce_commun` au niveau de l'exercice. Le frontend affiche ce texte UNE FOIS en haut, puis les affirmations en dessous.

### Modification du format JSON

**Avant :**
```json
{
  "id": "QCM2025-IV",
  "questions": [
    {"id": "QCM2025-IV-A", "enonce": "f(x) = ... admet une asymptote y = 1"},
    {"id": "QCM2025-IV-B", "enonce": "f(x) = ... admet une asymptote y = -1"}
  ]
}
```

**Après :**
```json
{
  "id": "QCM2025-IV",
  "enonce_commun": "Soient f la fonction définie sur \\mathbb{R} par f(x) = \\frac{e^x - 1}{e^x + 1} et C_f sa courbe représentative dans un repère orthonormé.",
  "questions": [
    {"id": "QCM2025-IV-A", "enonce": "C_f admet une asymptote d'équation y = 1."},
    {"id": "QCM2025-IV-B", "enonce": "C_f admet une asymptote d'équation y = -1."}
  ]
}
```

### Exercices impactés (QCM 2025)

Tous les exercices qui ont un contexte partagé. Voici les corrections :

---

## Bug 2 + 3 : Exercices IV, V, VI, VII, VIII de QCM 2025 corrigés

Remplacer les exercices IV à VIII dans `qcm_2025.json` par le contenu ci-dessous :

```json
    {
      "id": "QCM2025-IV",
      "titre": "Fonctions exp et ln",
      "chapitre": "fonctions",
      "enonce_commun": "Soient f la fonction définie sur \\mathbb{R} par f(x) = \\frac{e^x - 1}{e^x + 1} et C_f sa courbe représentative dans un repère orthonormé.",
      "questions": [
        {"id": "QCM2025-IV-A", "enonce": "C_f admet une asymptote d'équation y = 1.", "reponse": true, "explication": "\\lim_{x \\to +\\infty} f(x) = \\lim \\frac{e^x}{e^x} = 1 (en divisant numérateur et dénominateur par e^x)."},
        {"id": "QCM2025-IV-B", "enonce": "C_f admet une asymptote d'équation y = -1.", "reponse": true, "explication": "\\lim_{x \\to -\\infty} f(x) = \\frac{0-1}{0+1} = -1."},
        {"id": "QCM2025-IV-C", "enonce": "C_f admet une asymptote d'équation x = 1.", "reponse": false, "explication": "f est définie sur \\mathbb{R} entier car e^x + 1 > 0 pour tout x. Pas d'asymptote verticale."},
        {"id": "QCM2025-IV-D", "enonce": "f est décroissante sur \\mathbb{R}.", "reponse": false, "explication": "f'(x) = \\frac{2e^x}{(e^x+1)^2} > 0 pour tout x, donc f est strictement croissante."},
        {"id": "QCM2025-IV-E", "enonce": "Pour tout réel x, f(-x) = \\frac{1 - e^x}{1 + e^x}.", "reponse": true, "explication": "f(-x) = \\frac{e^{-x}-1}{e^{-x}+1}. En multipliant haut et bas par e^x : \\frac{1-e^x}{1+e^x}."}
      ],
      "indice": "Pour les asymptotes, calculez les limites en +∞ et -∞. Pour la monotonie, calculez f'(x)."
    },
    {
      "id": "QCM2025-V",
      "titre": "Suites - Encadrement et convergence",
      "chapitre": "suites",
      "enonce_commun": "Soit (u_n)_{n \\in \\mathbb{N}^*} une suite telle que |u_n - 1| \\leq \\frac{1}{n} pour tout entier naturel n non nul.",
      "questions": [
        {"id": "QCM2025-V-A", "enonce": "Pour tout n \\geq 1, \\quad -1 - \\frac{1}{n} \\leq u_n \\leq -1 + \\frac{1}{n}.", "reponse": false, "explication": "|u_n - 1| \\leq 1/n signifie 1 - 1/n \\leq u_n \\leq 1 + 1/n. L'encadrement est centré en 1, pas en -1."},
        {"id": "QCM2025-V-B", "enonce": "(u_n) est majorée par 2.", "reponse": true, "explication": "u_n \\leq 1 + 1/n \\leq 1 + 1 = 2 pour tout n \\geq 1."},
        {"id": "QCM2025-V-C", "enonce": "(u_n) est minorée par 0.", "reponse": true, "explication": "u_n \\geq 1 - 1/n \\geq 0 pour tout n \\geq 1."},
        {"id": "QCM2025-V-D", "enonce": "(u_n) converge vers 0.", "reponse": false, "explication": "Par le théorème des gendarmes : 1 - 1/n \\leq u_n \\leq 1 + 1/n et les deux bornes tendent vers 1, donc u_n \\to 1."}
      ],
      "indice": "|u_n - 1| \\leq 1/n se réécrit comme 1 - 1/n \\leq u_n \\leq 1 + 1/n. La suite est piégée autour de 1, pas de 0."
    },
    {
      "id": "QCM2025-VI",
      "titre": "Suites géométriques - Échiquier",
      "chapitre": "suites",
      "enonce_commun": "On dispose des grains de riz sur les 64 cases d'un échiquier : un grain sur la première case et on double la quantité d'une case à l'autre.",
      "questions": [
        {"id": "QCM2025-VI-A", "enonce": "Le nombre de grains de riz placés sur la dernière case est 2^{63}.", "reponse": true, "explication": "Case 1 : 2^0 = 1, case 2 : 2^1, ..., case n : 2^{n-1}. Case 64 : 2^{63}."},
        {"id": "QCM2025-VI-B", "enonce": "Le nombre total de grains de riz placés sur l'échiquier est 2^{64} - 1.", "reponse": true, "explication": "Somme géométrique : \\sum_{k=0}^{63} 2^k = \\frac{2^{64}-1}{2-1} = 2^{64}-1."}
      ],
      "indice": "Suite géométrique de raison 2, premier terme 1. Formule de la somme : S = \\frac{q^{n}-1}{q-1}."
    },
    {
      "id": "QCM2025-VII",
      "titre": "Produit scalaire - Vecteurs",
      "chapitre": "geometrie_plan",
      "enonce_commun": "Dans le plan rapporté à un repère orthonormé, on considère les vecteurs \\vec{u} et \\vec{v} de coordonnées respectives : \\vec{u}\\begin{pmatrix} -3+\\sqrt{6} \\\\ \\sqrt{3}+3\\sqrt{2} \\end{pmatrix} et \\vec{v}\\begin{pmatrix} -3 \\\\ 3\\sqrt{2} \\end{pmatrix}.",
      "questions": [
        {"id": "QCM2025-VII-A", "enonce": "\\vec{u} \\cdot \\vec{v} = 27.", "reponse": true, "explication": "\\vec{u}\\cdot\\vec{v} = (-3+\\sqrt{6})(-3) + (\\sqrt{3}+3\\sqrt{2})(3\\sqrt{2}) = 9-3\\sqrt{6}+3\\sqrt{6}+18 = 27."},
        {"id": "QCM2025-VII-B", "enonce": "\\|\\vec{u}\\| = 2\\sqrt{6}.", "reponse": false, "explication": "\\|\\vec{u}\\|^2 = (-3+\\sqrt{6})^2 + (\\sqrt{3}+3\\sqrt{2})^2 = 9-6\\sqrt{6}+6+3+6\\sqrt{6}+18 = 36. Donc \\|\\vec{u}\\| = 6."},
        {"id": "QCM2025-VII-C", "enonce": "\\|\\vec{v}\\| = 27.", "reponse": false, "explication": "\\|\\vec{v}\\|^2 = 9+18 = 27, donc \\|\\vec{v}\\| = 3\\sqrt{3} \\neq 27."}
      ],
      "indice": "\\vec{u}\\cdot\\vec{v} = x_u x_v + y_u y_v. Attention : \\|\\vec{v}\\|^2 = 27 ne signifie pas \\|\\vec{v}\\| = 27 !"
    },
    {
      "id": "QCM2025-VIII",
      "titre": "Produit scalaire - Angles",
      "chapitre": "geometrie_plan",
      "enonce_commun": "Dans le plan rapporté à un repère orthonormé, on considère les points A, B et C tels que : AB = \\sqrt{3}-1, \\quad \\vec{AB}\\cdot\\vec{AC} = 2 \\quad \\text{et} \\quad \\cos(\\widehat{BAC}) = \\frac{\\sqrt{2}}{2}.",
      "questions": [
        {"id": "QCM2025-VIII-A", "enonce": "AC = \\sqrt{6} + \\sqrt{2}.", "reponse": true, "explication": "\\vec{AB}\\cdot\\vec{AC} = AB \\times AC \\times \\cos(\\widehat{BAC}), soit 2 = (\\sqrt{3}-1) \\times AC \\times \\frac{\\sqrt{2}}{2}. Donc AC = \\frac{4}{(\\sqrt{3}-1)\\sqrt{2}} = \\frac{4(\\sqrt{3}+1)}{2\\sqrt{2}} = \\sqrt{6}+\\sqrt{2}."},
        {"id": "QCM2025-VIII-B", "enonce": "Une mesure de l'angle \\widehat{BAC} est 30°.", "reponse": false, "explication": "\\cos(\\widehat{BAC}) = \\frac{\\sqrt{2}}{2} correspond à un angle de 45° (et non 30° qui donne \\cos = \\frac{\\sqrt{3}}{2})."}
      ],
      "indice": "\\cos(\\pi/4) = \\sqrt{2}/2 et \\cos(\\pi/6) = \\sqrt{3}/2. Ne les confondez pas !"
    }
```

---

## Même correction pour QCM 2024

Les exercices 2024 impactés :

**Exercice III** (Fonctions f(x)=3/(1-x)) : ajouter `enonce_commun`
```json
"enonce_commun": "Soient f la fonction définie pour tout réel x \\neq 1 par f(x) = \\frac{3}{1-x} et C_f sa courbe représentative."
```

**Exercice IV** (Suites u_n, v_n=-2/u_n) : ajouter `enonce_commun`
```json
"enonce_commun": "Soit (u_n)_{n \\in \\mathbb{N}} une suite telle que u_n \\neq 0 pour tout n. On définit v_n = -\\frac{2}{u_n}."
```

**Exercice V** (Loi binomiale) : ajouter `enonce_commun`
```json
"enonce_commun": "On lance cinq fois un dé à six faces. Pour chaque variable aléatoire proposée, dire si elle suit une loi binomiale."
```

**Exercice VI** (Événements A, B) : ajouter `enonce_commun`
```json
"enonce_commun": "A et B sont deux événements de probabilités respectives 0{,}6 et 0{,}4. On suppose que P(A \\cup B) = 0{,}8."
```

**Exercice VII** (Géométrie A(2;0), B(0;-4)) : ajouter `enonce_commun`
```json
"enonce_commun": "Dans un repère orthonormé, on considère les points A(2\\,;\\,0) et B(0\\,;\\,-4)."
```

---

## Bug 3 : Exercices de probabilités supplémentaires

### Ajouter un fichier `qcm_genere_probas.json`

Ce fichier contient des exercices QCM **générés** (pas des annales) pour renforcer le chapitre probabilités.

```json
{
  "annee": 0,
  "matiere": "maths_qcm",
  "source": "genere",
  "exercices": [
    {
      "id": "GEN-PROBA-01",
      "titre": "Probabilités conditionnelles",
      "chapitre": "probabilites",
      "enonce_commun": "Une usine produit des pièces. 5% sont défectueuses. Un test de contrôle détecte 90% des pièces défectueuses (vrai positif) mais déclare défectueuses 3% des pièces conformes (faux positif). On note D l'événement « la pièce est défectueuse » et T l'événement « le test est positif ».",
      "questions": [
        {"id": "GEN-PROBA-01-A", "enonce": "P(D) = 0{,}05.", "reponse": true, "explication": "5% de pièces défectueuses, directement donné dans l'énoncé."},
        {"id": "GEN-PROBA-01-B", "enonce": "P_D(T) = 0{,}90.", "reponse": true, "explication": "Le test détecte 90% des pièces défectueuses : P_D(T) = 0,90."},
        {"id": "GEN-PROBA-01-C", "enonce": "P(T) = 0{,}045 + 0{,}0285 = 0{,}0735.", "reponse": true, "explication": "P(T) = P(D)P_D(T) + P(\\bar{D})P_{\\bar{D}}(T) = 0,05 \\times 0,90 + 0,95 \\times 0,03 = 0,045 + 0,0285 = 0,0735."},
        {"id": "GEN-PROBA-01-D", "enonce": "P_T(D) > 0{,}5, c'est-à-dire qu'une pièce testée positive est plus probablement défectueuse que conforme.", "reponse": true, "explication": "P_T(D) = P(D \\cap T)/P(T) = 0,045/0,0735 \\approx 0,612 > 0,5."}
      ],
      "indice": "Utilisez la formule des probabilités totales pour P(T) puis la formule de Bayes pour P_T(D)."
    },
    {
      "id": "GEN-PROBA-02",
      "titre": "Loi binomiale - Calculs",
      "chapitre": "probabilites",
      "enonce_commun": "On considère une variable aléatoire X suivant une loi binomiale B(10\\,;\\,0{,}3).",
      "questions": [
        {"id": "GEN-PROBA-02-A", "enonce": "E(X) = 3.", "reponse": true, "explication": "E(X) = np = 10 \\times 0,3 = 3."},
        {"id": "GEN-PROBA-02-B", "enonce": "V(X) = 2{,}1.", "reponse": true, "explication": "V(X) = np(1-p) = 10 \\times 0,3 \\times 0,7 = 2,1."},
        {"id": "GEN-PROBA-02-C", "enonce": "P(X = 0) = 0{,}7^{10}.", "reponse": true, "explication": "P(X=0) = \\binom{10}{0} \\times 0,3^0 \\times 0,7^{10} = 0,7^{10} \\approx 0,028."},
        {"id": "GEN-PROBA-02-D", "enonce": "P(X \\geq 1) = 1 - 0{,}3^{10}.", "reponse": false, "explication": "P(X \\geq 1) = 1 - P(X=0) = 1 - 0,7^{10} \\approx 0,972. L'erreur est de confondre avec 1 - 0,3^{10}."}
      ],
      "indice": "X \\sim B(n,p) : E(X)=np, V(X)=np(1-p), P(X=k) = \\binom{n}{k}p^k(1-p)^{n-k}."
    },
    {
      "id": "GEN-PROBA-03",
      "titre": "Indépendance et probabilités",
      "chapitre": "probabilites",
      "enonce_commun": "On lance deux dés équilibrés. On note A l'événement « le premier dé donne un 6 » et B l'événement « la somme des deux dés vaut 7 ».",
      "questions": [
        {"id": "GEN-PROBA-03-A", "enonce": "P(A) = \\frac{1}{6}.", "reponse": true, "explication": "Le premier dé a 6 faces équiprobables."},
        {"id": "GEN-PROBA-03-B", "enonce": "P(B) = \\frac{1}{6}.", "reponse": true, "explication": "Les couples donnant une somme de 7 sont (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) : 6 sur 36 = 1/6."},
        {"id": "GEN-PROBA-03-C", "enonce": "P(A \\cap B) = \\frac{1}{36}.", "reponse": true, "explication": "A \\cap B = « premier dé = 6 ET somme = 7 » = (6,1). Un seul couple sur 36."},
        {"id": "GEN-PROBA-03-D", "enonce": "A et B sont indépendants.", "reponse": true, "explication": "P(A) \\times P(B) = 1/6 \\times 1/6 = 1/36 = P(A \\cap B). Les événements sont indépendants."}
      ],
      "indice": "Deux événements sont indépendants si P(A \\cap B) = P(A) \\times P(B). Comptez les cas favorables sur 36."
    },
    {
      "id": "GEN-PROBA-04",
      "titre": "Variable aléatoire et espérance",
      "chapitre": "probabilites",
      "enonce_commun": "Un jeu de hasard consiste à tirer une boule dans une urne contenant 3 boules rouges et 7 boules blanches. Si la boule est rouge, le joueur gagne 5€. Si elle est blanche, il perd 2€. On note X le gain algébrique du joueur.",
      "questions": [
        {"id": "GEN-PROBA-04-A", "enonce": "P(X = 5) = 0{,}3.", "reponse": true, "explication": "3 boules rouges sur 10 : P(rouge) = 3/10 = 0,3."},
        {"id": "GEN-PROBA-04-B", "enonce": "E(X) = 0{,}1.", "reponse": true, "explication": "E(X) = 5 \\times 0,3 + (-2) \\times 0,7 = 1,5 - 1,4 = 0,1€."},
        {"id": "GEN-PROBA-04-C", "enonce": "Le jeu est favorable au joueur.", "reponse": true, "explication": "E(X) = 0,1 > 0 donc en moyenne le joueur gagne à long terme."},
        {"id": "GEN-PROBA-04-D", "enonce": "Si on joue 100 fois, on peut espérer gagner environ 10€.", "reponse": true, "explication": "Gain espéré sur 100 parties = 100 \\times E(X) = 100 \\times 0,1 = 10€."}
      ],
      "indice": "E(X) = \\sum x_i \\times P(X = x_i). Le jeu est favorable si E(X) > 0."
    },
    {
      "id": "GEN-PROBA-05",
      "titre": "Arbre de probabilités",
      "chapitre": "probabilites",
      "enonce_commun": "Un étudiant passe deux épreuves indépendantes. Sa probabilité de réussir la première est 0{,}8 et celle de réussir la seconde est 0{,}6. On note R_1 et R_2 les événements « réussir l'épreuve 1 » et « réussir l'épreuve 2 ».",
      "questions": [
        {"id": "GEN-PROBA-05-A", "enonce": "P(R_1 \\cap R_2) = 0{,}48.", "reponse": true, "explication": "Épreuves indépendantes : P(R_1 \\cap R_2) = P(R_1) \\times P(R_2) = 0,8 \\times 0,6 = 0,48."},
        {"id": "GEN-PROBA-05-B", "enonce": "La probabilité de rater les deux épreuves est 0{,}08.", "reponse": true, "explication": "P(\\bar{R_1} \\cap \\bar{R_2}) = 0,2 \\times 0,4 = 0,08."},
        {"id": "GEN-PROBA-05-C", "enonce": "La probabilité de réussir exactement une épreuve est 0{,}52.", "reponse": false, "explication": "P(exactement 1) = P(R_1 \\cap \\bar{R_2}) + P(\\bar{R_1} \\cap R_2) = 0,8 \\times 0,4 + 0,2 \\times 0,6 = 0,32 + 0,12 = 0,44."},
        {"id": "GEN-PROBA-05-D", "enonce": "La probabilité de réussir au moins une épreuve est 0{,}92.", "reponse": true, "explication": "P(au moins 1) = 1 - P(aucune) = 1 - 0,08 = 0,92."}
      ],
      "indice": "Indépendance ⟹ P(A ∩ B) = P(A) × P(B). Pour « au moins une », utilisez le complémentaire."
    }
  ]
}
```

---

## Modification du frontend

### `QCM.tsx` — Afficher l'énoncé commun

Dans la page QCM, avant la liste des questions, ajouter :

```tsx
{exercise.enonce_commun && (
  <div style={{
    background: '#F0F4FF',
    padding: '16px 20px',
    borderRadius: 'var(--radius)',
    borderLeft: '4px solid var(--accent-blue)',
    marginBottom: '24px',
    fontSize: '1.05rem',
    lineHeight: '1.7'
  }}>
    <MathRender latex={exercise.enonce_commun} display={true} />
  </div>
)}
```

Puis chaque question n'affiche que son `enonce` (l'affirmation V/F), plus court.

### `RevisionPlan.tsx` — Lien vers les exercices générés

Le plan de révision pour le bloc "Probabilités" doit aussi charger les exercices générés. Le backend gère ça automatiquement car `get_questions_by_chapter("maths_qcm", "probabilites")` retourne tous les exercices du chapitre, quelle que soit la source.

---

## Modification du backend

### `questions_service.py` — Gérer `enonce_commun`

Pas de modification nécessaire au backend : le champ `enonce_commun` est simplement un champ JSON qui est retourné tel quel par l'API. Le frontend s'en charge.

---

## Git

```bash
git add .
git commit -m "Hotfix: enonce_commun field + 5 generated probability exercises"
git push origin main
```

Pas de nouveau tag — on est toujours dans le Run 2, c'est un fix.
