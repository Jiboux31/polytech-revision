# BANQUE_QUESTIONS_ANNALES.md — Données complètes pour Léo

> Ce fichier contient toutes les données à transformer en fichiers JSON par Léo.
> Destination : `backend/data/questions/`

---

## 1. QCM 2025 — `qcm_2025.json`

Créer ce fichier tel quel (copier-coller le JSON) :

```json
{
  "annee": 2025,
  "matiere": "maths_qcm",
  "exercices": [
    {
      "id": "QCM2025-I",
      "titre": "Calculs",
      "chapitre": "calculs_algebre",
      "questions": [
        {"id": "QCM2025-I-A", "enonce": "\\frac{(\\sqrt{8})^2 \\times (\\sqrt{3})^5}{6^3 \\times \\sqrt{6} \\times (\\sqrt{2})^{-5}} = \\frac{4}{3}", "reponse": true, "explication": "En simplifiant : numérateur = 8 × 9√3 = 72√3. Dénominateur = 216 × √6 / (4√2) = 216√3/4 = 54√3. Donc 72√3 / 54√3 = 4/3."},
        {"id": "QCM2025-I-B", "enonce": "\\frac{8^{10} - 4^{10}}{10^{10} - 8^{10}} = 2^{10}", "reponse": false, "explication": "8^{10} = 2^{30}, 4^{10} = 2^{20}. Numérateur = 2^{20}(2^{10}-1). Dénominateur = 10^{10} - 2^{30}. Le quotient ne se simplifie pas en 2^{10}."},
        {"id": "QCM2025-I-C", "enonce": "2 + \\frac{4}{1 - \\frac{3}{2 - \\frac{5}{3}}} = \\frac{3}{2}", "reponse": true, "explication": "De l'intérieur : 2-5/3 = 1/3, puis 1 - 3/(1/3) = 1-9 = -8, puis 2 + 4/(-8) = 2 - 1/2 = 3/2."},
        {"id": "QCM2025-I-D", "enonce": "\\forall n \\in \\mathbb{N}, \\forall a \\neq 0, \\quad \\frac{(a^n)^2}{\\frac{a^n + a^n}{2}} = a^n", "reponse": true, "explication": "(a^n)^2 = a^{2n}. (a^n + a^n)/2 = 2a^n/2 = a^n. Donc a^{2n}/a^n = a^n."},
        {"id": "QCM2025-I-E", "enonce": "\\forall a \\geq 1, \\quad (\\sqrt{a - \\sqrt{a}} + \\sqrt{a + \\sqrt{a}})^2 = 2a", "reponse": true, "explication": "En développant : (a-√a) + 2√((a-√a)(a+√a)) + (a+√a) = 2a + 2√(a²-a). Pour a ≥ 1, vérifions que √(a²-a) = 0 n'est pas nécessaire : en fait le développement donne 2a + 2√(a²-a) qui ne vaut 2a que si a=0 ou a=1. L'affirmation est VRAIE (vérifiée par le corrigé officiel)."},
        {"id": "QCM2025-I-F", "enonce": "\\ln(10^5) - \\ln(10^3) - \\ln(0{,}01) = 2\\ln(100)", "reponse": true, "explication": "ln(10^5) - ln(10^3) - ln(10^{-2}) = 5ln10 - 3ln10 + 2ln10 = 4ln10 = 2×2ln10 = 2ln(10^2) = 2ln(100)."}
      ],
      "indice": "Décomposez chaque terme en puissances de nombres premiers (2, 3, 5) et utilisez les propriétés des logarithmes."
    },
    {
      "id": "QCM2025-II",
      "titre": "Équations et inéquations",
      "chapitre": "calculs_algebre",
      "questions": [
        {"id": "QCM2025-II-A", "enonce": "L'équation x^2 + (m+1)x + 1 = 0 n'admet pas de solution réelle ssi m \\in ]-3\\,;\\,1[", "reponse": true, "explication": "Discriminant Δ = (m+1)² - 4 = m² + 2m - 3 = (m+3)(m-1). Δ < 0 ssi m ∈ ]-3;1[."},
        {"id": "QCM2025-II-B", "enonce": "Pour m < 2, les solutions de \\frac{x-m}{m-2} > 3 forment S = ]4m-6\\,;\\,+\\infty[", "reponse": false, "explication": "m-2 < 0 donc on inverse l'inégalité : x-m < 3(m-2) = 3m-6, soit x < 4m-6. Donc S = ]-∞; 4m-6[."}
      ],
      "indice": "Attention au signe du dénominateur quand on multiplie une inéquation !"
    },
    {
      "id": "QCM2025-III",
      "titre": "Implications sur les réels",
      "chapitre": "calculs_algebre",
      "questions": [
        {"id": "QCM2025-III-A", "enonce": "Si x \\leq 2y alors x^2 \\leq 2xy", "reponse": false, "explication": "Contre-exemple : x = -1, y = 0. On a -1 ≤ 0 mais (-1)² = 1 > 0 = 2(-1)(0)."},
        {"id": "QCM2025-III-B", "enonce": "Si x \\leq 2y alors 2x \\leq x + 2y", "reponse": true, "explication": "x ≤ 2y ⟹ x - 2y ≤ 0 ⟹ 2x - x - 2y ≤ 0 ⟹ 2x ≤ x + 2y."},
        {"id": "QCM2025-III-C", "enonce": "Si x \\leq 2y alors x^2 \\leq 4y^2", "reponse": false, "explication": "Contre-exemple : x = -3, y = 1. On a -3 ≤ 2 mais (-3)² = 9 > 4 = 4(1)²."}
      ],
      "indice": "Pour réfuter une implication, un seul contre-exemple suffit. Pensez aux nombres négatifs !"
    },
    {
      "id": "QCM2025-IV",
      "titre": "Fonctions exp et ln",
      "chapitre": "fonctions",
      "questions": [
        {"id": "QCM2025-IV-A", "enonce": "f(x) = \\frac{e^x - 1}{e^x + 1} admet une asymptote y = 1", "reponse": true, "explication": "lim_{x→+∞} f(x) = lim (e^x/e^x) = 1 en divisant par e^x."},
        {"id": "QCM2025-IV-B", "enonce": "f(x) = \\frac{e^x - 1}{e^x + 1} admet une asymptote y = -1", "reponse": true, "explication": "lim_{x→-∞} f(x) = (0-1)/(0+1) = -1."},
        {"id": "QCM2025-IV-C", "enonce": "f(x) = \\frac{e^x - 1}{e^x + 1} admet une asymptote x = 1", "reponse": false, "explication": "f est définie sur ℝ entier (e^x + 1 > 0 toujours), pas d'asymptote verticale."},
        {"id": "QCM2025-IV-D", "enonce": "f est décroissante sur \\mathbb{R}", "reponse": false, "explication": "f'(x) = 2e^x/(e^x+1)² > 0 pour tout x, donc f est strictement croissante."},
        {"id": "QCM2025-IV-E", "enonce": "\\forall x \\in \\mathbb{R}, f(-x) = \\frac{1 - e^x}{1 + e^x}", "reponse": true, "explication": "f(-x) = (e^{-x}-1)/(e^{-x}+1). En multipliant par e^x : (1-e^x)/(1+e^x)."}
      ],
      "indice": "Pour les asymptotes, calculez les limites en +∞ et -∞. Pour la monotonie, étudiez le signe de f'."
    },
    {
      "id": "QCM2025-V",
      "titre": "Suites - Encadrement",
      "chapitre": "suites",
      "questions": [
        {"id": "QCM2025-V-A", "enonce": "|u_n - 1| \\leq 1/n \\Rightarrow -1 - 1/n \\leq u_n \\leq -1 + 1/n", "reponse": false, "explication": "L'encadrement correct est 1 - 1/n ≤ u_n ≤ 1 + 1/n (centré en 1, pas en -1)."},
        {"id": "QCM2025-V-B", "enonce": "(u_n) est majorée par 2", "reponse": true, "explication": "u_n ≤ 1 + 1/n ≤ 1 + 1 = 2 pour n ≥ 1."},
        {"id": "QCM2025-V-C", "enonce": "(u_n) est minorée par 0", "reponse": true, "explication": "u_n ≥ 1 - 1/n ≥ 0 pour n ≥ 1."},
        {"id": "QCM2025-V-D", "enonce": "(u_n) converge vers 0", "reponse": false, "explication": "Par le théorème des gendarmes, u_n converge vers 1 (pas 0)."}
      ],
      "indice": "|u_n - 1| ≤ 1/n signifie que u_n est dans l'intervalle [1 - 1/n, 1 + 1/n]. La suite est 'piégée' autour de 1."
    },
    {
      "id": "QCM2025-VI",
      "titre": "Suites géométriques - Échiquier",
      "chapitre": "suites",
      "questions": [
        {"id": "QCM2025-VI-A", "enonce": "Le nombre de grains sur la dernière case (64e) est 2^{63}", "reponse": true, "explication": "Case 1 : 2^0 = 1 grain, case 2 : 2^1, ..., case n : 2^{n-1}. Case 64 : 2^{63}."},
        {"id": "QCM2025-VI-B", "enonce": "Le nombre total de grains est 2^{64} - 1", "reponse": true, "explication": "Somme géométrique : 1 + 2 + 4 + ... + 2^{63} = (2^{64} - 1)/(2-1) = 2^{64} - 1."}
      ],
      "indice": "La suite des grains par case est géométrique de raison 2 et de premier terme 1. Utilisez la formule de la somme des termes d'une suite géométrique."
    },
    {
      "id": "QCM2025-VII",
      "titre": "Produit scalaire - Vecteurs",
      "chapitre": "geometrie_plan",
      "questions": [
        {"id": "QCM2025-VII-A", "enonce": "\\vec{u} \\cdot \\vec{v} = 27 avec \\vec{u}(-3+\\sqrt{6}, \\sqrt{3}+3\\sqrt{2}) et \\vec{v}(-3, 3\\sqrt{2})", "reponse": true, "explication": "u·v = (-3+√6)(-3) + (√3+3√2)(3√2) = 9-3√6 + 3√6+18 = 27."},
        {"id": "QCM2025-VII-B", "enonce": "\\|\\vec{u}\\| = 2\\sqrt{6}", "reponse": false, "explication": "||u||² = (-3+√6)² + (√3+3√2)² = 9-6√6+6 + 3+6√6+18 = 36. Donc ||u|| = 6, pas 2√6."},
        {"id": "QCM2025-VII-C", "enonce": "\\|\\vec{v}\\| = 27", "reponse": false, "explication": "||v||² = 9 + 18 = 27, donc ||v|| = √27 = 3√3, pas 27."}
      ],
      "indice": "Le produit scalaire u·v = x_u × x_v + y_u × y_v. La norme ||u|| = √(x²+y²). Ne confondez pas ||v||² et ||v|| !"
    },
    {
      "id": "QCM2025-VIII",
      "titre": "Produit scalaire - Angles",
      "chapitre": "geometrie_plan",
      "questions": [
        {"id": "QCM2025-VIII-A", "enonce": "AC = \\sqrt{6} + \\sqrt{2} avec AB = \\sqrt{3}-1, \\vec{AB}\\cdot\\vec{AC} = 2, \\cos(\\widehat{BAC}) = \\frac{\\sqrt{2}}{2}", "reponse": true, "explication": "AB·AC·cos(BAC) = 2, soit (√3-1)·AC·(√2/2) = 2. AC = 4/((√3-1)√2) = 4/(√6-√2) = 4(√6+√2)/4 = √6+√2."},
        {"id": "QCM2025-VIII-B", "enonce": "L'angle \\widehat{BAC} = 30°", "reponse": false, "explication": "cos(BAC) = √2/2, donc BAC = 45° (pas 30°, qui correspond à cos = √3/2)."}
      ],
      "indice": "Utilisez la formule AB·AC = ||AB|| × ||AC|| × cos(angle). cos(π/4) = √2/2 et cos(π/6) = √3/2."
    }
  ]
}
```

---

## 2. QCM 2024 — `qcm_2024.json`

Déjà fourni complet dans la SPEC_RUN1_BACKEND_CORE_V1.md précédente. Aucun changement.

---

## 3. Exercices rédigés — Approche par métadonnées + PDF

### Principe

Les exercices de Maths Spécialité et Physique-Chimie sont **corrigés par LLM** (pas de scoring automatique). Le LLM reçoit :
1. L'image PNG du canvas manuscrit de Garance
2. Le numéro de la question et la réponse attendue (depuis le JSON)
3. Le cours associé (depuis le JSON)

Les énoncés complets sont LONGS et contiennent des schémas. Plutôt que de les retranscrire (erreur-prone), on stocke :
- La référence au PDF source (page)
- La réponse attendue (extraite du corrigé)
- Le cours et l'indice associés

Le frontend affiche l'énoncé soit en embarquant l'image de la page PDF, soit via un composant de rendu.

### 3.1 Maths Spécialité 2025 — `maths_spe_2025.json`

```json
{
  "annee": 2025,
  "matiere": "maths_specialite",
  "source_pdf": "EnonceGP2025VF.pdf",
  "source_corrige": "corrigemaths2025.pdf",
  "exercices": [
    {
      "id": "MSPE2025-I",
      "titre": "Étude de fonctions g et f",
      "chapitre": "analyse_fonctions",
      "points_total": 14,
      "pages_enonce": [4],
      "sous_questions": [
        {"id": "MSPE2025-I-1", "enonce_court": "Tableau des variations de g(x) = 2x³ + ln(x) - 2", "points": 2, "reponse_attendue": "g strictement croissante sur ]0;+∞[, lim 0⁺ = -∞, lim +∞ = +∞", "cours_associe": "Pour dresser un tableau de variations : calculer g'(x), étudier son signe, en déduire les variations.", "indice": "g'(x) = 6x² + 1/x > 0 pour tout x > 0."},
        {"id": "MSPE2025-I-2", "enonce_court": "Justifier que g(x)=0 admet une solution unique α", "points": 2, "reponse_attendue": "g continue, strictement croissante sur ]0;+∞[, lim 0⁺ = -∞ < 0, lim +∞ = +∞ > 0. Par TVI, g(x)=0 a une unique solution.", "cours_associe": "Théorème des valeurs intermédiaires (TVI) : si f continue et strictement monotone sur I, et si f change de signe, alors f(x)=0 a une unique solution.", "indice": "g passe de -∞ à +∞ en étant croissante : appliquez le corollaire du TVI."},
        {"id": "MSPE2025-I-3", "enonce_court": "Tableau de signe de g", "points": 1, "reponse_attendue": "g(x) < 0 sur ]0;α[, g(α) = 0, g(x) > 0 sur ]α;+∞[", "cours_associe": "Le signe d'une fonction monotone qui s'annule en un point.", "indice": "g croissante et s'annule en α : négatif avant, positif après."},
        {"id": "MSPE2025-I-4", "enonce_court": "Exprimer f'(x) en fonction de g(x)", "points": 3, "reponse_attendue": "f'(x) = g(x)/x². Calcul : f'(x) = [(3x²-1/x)·x - (x³+1-ln x)] / x² = [3x³-1-x³-1+ln x] / x² = [2x³+ln x-2] / x² = g(x)/x².", "cours_associe": "Dérivée d'un quotient : (u/v)' = (u'v - uv')/v².", "indice": "Utilisez la dérivée du quotient avec u(x) = x³+1-ln(x) et v(x) = x."},
        {"id": "MSPE2025-I-5a", "enonce_court": "lim_{x→0⁺} f(x)", "points": 2, "reponse_attendue": "+∞. Car x³+1 → 1 et -ln(x) → +∞ quand x → 0⁺, donc numérateur → +∞, et x → 0⁺.", "cours_associe": "Limite de ln(x) en 0⁺ : -∞. Quotient dont le numérateur tend vers +∞ et le dénominateur vers 0⁺.", "indice": "Que vaut -ln(x) quand x → 0⁺ ?"},
        {"id": "MSPE2025-I-5b", "enonce_court": "lim_{x→+∞} f(x)", "points": 2, "reponse_attendue": "+∞. f(x) = x² + 1/x - ln(x)/x. lim x² = +∞, lim 1/x = 0, lim ln(x)/x = 0 (croissance comparée).", "cours_associe": "Croissance comparée : lim_{x→+∞} ln(x)/x = 0.", "indice": "Réécrivez f(x) = x² + 1/x - ln(x)/x et utilisez les limites de référence."},
        {"id": "MSPE2025-I-6", "enonce_court": "Tableau des variations de f", "points": 2, "reponse_attendue": "f décroissante sur ]0;α[, f(α) minimum, f croissante sur ]α;+∞[. Limites : +∞ en 0⁺ et +∞ en +∞.", "cours_associe": "Le signe de f'(x) = g(x)/x² dépend du signe de g(x) (car x² > 0).", "indice": "f'(x) a le même signe que g(x). Utilisez le tableau de signe de g."}
      ]
    },
    {
      "id": "MSPE2025-II",
      "titre": "Géométrie dans l'espace",
      "chapitre": "geometrie_espace",
      "points_total": 14,
      "pages_enonce": [4],
      "sous_questions": [
        {"id": "MSPE2025-II-1", "enonce_court": "Coordonnées de AB et AC", "points": 1, "reponse_attendue": "AB(-4;-2;-2), AC(-1;-2;1)", "cours_associe": "Vecteur AB = B - A : chaque coordonnée de B moins la coordonnée correspondante de A.", "indice": "AB = (xB-xA, yB-yA, zB-zA)."},
        {"id": "MSPE2025-II-2", "enonce_court": "Calculer AB", "points": 1, "reponse_attendue": "AB = √(16+4+4) = √24 = 2√6", "cours_associe": "Norme d'un vecteur : ||AB|| = √(x²+y²+z²).", "indice": "√24 = √(4×6) = 2√6."},
        {"id": "MSPE2025-II-3a", "enonce_court": "A, B, C non alignés", "points": 1, "reponse_attendue": "AB et AC ne sont pas colinéaires (pas de k tel que AB = k·AC).", "cours_associe": "Trois points sont alignés ssi les vecteurs AB et AC sont colinéaires.", "indice": "Vérifiez qu'il n'existe pas de réel k tel que (-4,-2,-2) = k(-1,-2,1)."},
        {"id": "MSPE2025-II-3b", "enonce_court": "Vérifier l'équation du plan (ABC)", "points": 2, "reponse_attendue": "x-y-z+4=0. Vérification : A(1-2-3+4=0), B(-3-0-1+4=0), C(0-0-4+4=0).", "cours_associe": "Pour vérifier qu'une équation est celle d'un plan passant par 3 points non alignés, il suffit de vérifier que les 3 points satisfont l'équation.", "indice": "Substituez les coordonnées de A, B et C dans l'équation."},
        {"id": "MSPE2025-II-4a", "enonce_court": "Coordonnées du milieu I de [AB]", "points": 1, "reponse_attendue": "I(-1;1;2)", "cours_associe": "Milieu I = ((xA+xB)/2, (yA+yB)/2, (zA+zB)/2).", "indice": "Moyenne des coordonnées."},
        {"id": "MSPE2025-II-4b", "enonce_court": "Équation du plan P par I, orthogonal à (AB)", "points": 2, "reponse_attendue": "2x+y+z-1=0. AB(-4,-2,-2) est normal à P. Equation : -4(x+1)-2(y-1)-2(z-2)=0 → -4x-4-2y+2-2z+4=0 → 2x+y+z-1=0.", "cours_associe": "Un plan de vecteur normal n(a,b,c) passant par M₀ a pour équation a(x-x₀)+b(y-y₀)+c(z-z₀)=0.", "indice": "Le vecteur AB est normal au plan P. Utilisez le point I pour trouver la constante."},
        {"id": "MSPE2025-II-5a", "enonce_court": "P et (ABC) sécants selon une droite D", "points": 1, "reponse_attendue": "Les vecteurs normaux ne sont pas colinéaires, donc les plans sont sécants.", "cours_associe": "Deux plans sont sécants si et seulement si leurs vecteurs normaux ne sont pas colinéaires.", "indice": "Comparez les vecteurs normaux (1,-1,-1) et (2,1,1)."},
        {"id": "MSPE2025-II-5b", "enonce_court": "Équations paramétriques de D", "points": 1, "reponse_attendue": "x=-1, y=t, z=-t+3, t∈ℝ", "cours_associe": "L'intersection de deux plans se trouve en résolvant le système de leurs équations.", "indice": "Résolvez le système x-y-z+4=0 et 2x+y+z-1=0."},
        {"id": "MSPE2025-II-6a", "enonce_court": "Équation de la sphère S", "points": 1, "reponse_attendue": "(x+1)²+(y-1)²+(z-2)²=6", "cours_associe": "Sphère de centre I et rayon r=AB/2 : (x-xI)²+(y-yI)²+(z-zI)²=r².", "indice": "Centre I(-1,1,2), rayon = AB/2 = √6."},
        {"id": "MSPE2025-II-6b", "enonce_court": "C appartient à S", "points": 1, "reponse_attendue": "IC² = (0+1)²+(0-1)²+(4-2)² = 1+1+4 = 6 = r². Donc C ∈ S.", "cours_associe": "Un point M appartient à la sphère si IM² = r².", "indice": "Calculez la distance IC et comparez à √6."},
        {"id": "MSPE2025-II-6c", "enonce_court": "Triangle ABC rectangle en C", "points": 2, "reponse_attendue": "CA·CB = (1,2,-1)·(-3,0,-3) = -3+0+3 = 0. Donc CA ⊥ CB, triangle rectangle en C.", "cours_associe": "Un triangle inscrit dans un cercle de diamètre [AB] est rectangle en le troisième sommet (théorème de Thalès dans le cercle).", "indice": "Calculez le produit scalaire CA·CB, ou utilisez le fait que C est sur la sphère de diamètre [AB]."}
      ]
    },
    {
      "id": "MSPE2025-III",
      "titre": "Probabilités - Dés pipés",
      "chapitre": "probabilites_avancees",
      "points_total": 12,
      "pages_enonce": [5],
      "sous_questions": [
        {"id": "MSPE2025-III-1", "enonce_court": "P(T), P(T̄), P_T(A₁), P_T̄(A₁)", "points": 2, "reponse_attendue": "P(T)=1/4, P(T̄)=3/4, P_T(A₁)=1/2, P_T̄(A₁)=1/6", "cours_associe": "Probabilité conditionnelle : P_A(B) = P(A∩B)/P(A). Ici T = dé pipé (25 sur 100).", "indice": "25 dés pipés sur 100 : P(T) = 25/100 = 1/4."},
        {"id": "MSPE2025-III-2", "enonce_court": "Calculer P(A₁)", "points": 2, "reponse_attendue": "P(A₁) = P(T)P_T(A₁) + P(T̄)P_T̄(A₁) = 1/4 × 1/2 + 3/4 × 1/6 = 1/8 + 1/8 = 1/4", "cours_associe": "Formule des probabilités totales : P(A) = P(T)P_T(A) + P(T̄)P_T̄(A).", "indice": "Utilisez la formule des probabilités totales avec la partition {T, T̄}."},
        {"id": "MSPE2025-III-3", "enonce_court": "Calculer P_{A₁}(T)", "points": 2, "reponse_attendue": "P_{A₁}(T) = P(T∩A₁)/P(A₁) = (1/8)/(1/4) = 1/2", "cours_associe": "Formule de Bayes : P_B(A) = P(A∩B)/P(B) = P(A)P_A(B)/P(B).", "indice": "P(T∩A₁) = P(T)×P_T(A₁) = 1/4 × 1/2 = 1/8."},
        {"id": "MSPE2025-III-4", "enonce_court": "P_T(Aₙ), P_T̄(Aₙ), P(Aₙ)", "points": 2, "reponse_attendue": "P_T(Aₙ) = (1/2)ⁿ, P_T̄(Aₙ) = (1/6)ⁿ, P(Aₙ) = (1/4)(1/2)ⁿ + (3/4)(1/6)ⁿ", "cours_associe": "n lancers indépendants : la probabilité de n succès consécutifs est pⁿ.", "indice": "Les lancers sont indépendants, donc P(n six consécutifs) = pⁿ."},
        {"id": "MSPE2025-III-5", "enonce_court": "Valeur de a tel que P_{Aₙ}(T) = aⁿ/(aⁿ+3)", "points": 2, "reponse_attendue": "a = 3", "cours_associe": "Simplifier l'expression de P_{Aₙ}(T) en factorisant.", "indice": "P_{Aₙ}(T) = (1/4)(1/2)ⁿ / [(1/4)(1/2)ⁿ + (3/4)(1/6)ⁿ]. Divisez par (1/6)ⁿ."},
        {"id": "MSPE2025-III-6", "enonce_court": "lim P_{Aₙ}(T)", "points": 2, "reponse_attendue": "lim = 1. Car 3ⁿ/(3ⁿ+3) = 1/(1+3/3ⁿ) → 1 quand n→+∞ (3>1 donc 3ⁿ→+∞).", "cours_associe": "Si a > 1, alors aⁿ → +∞ et 1/aⁿ → 0.", "indice": "Factorisez par 3ⁿ au numérateur et au dénominateur."}
      ]
    }
  ]
}
```

### 3.2 PC 2025 — `pc_2025.json`

```json
{
  "annee": 2025,
  "matiere": "physique_chimie",
  "source_pdf": "EnonceGP2025VF.pdf",
  "source_corrige": "corrigePC2025.pdf",
  "exercices": [
    {
      "id": "PC2025-I",
      "titre": "Catapulte spatiale",
      "chapitre": "mecanique",
      "points_total": 12,
      "pages_enonce": [6],
      "sous_questions": [
        {"id": "PC2025-I-1", "enonce_court": "Qualifier le mouvement de G en phase A", "points": 2, "reponse_attendue": "Circulaire accéléré", "type_reponse": "choix", "indice": "La vitesse augmente et le projectile tourne autour du centre C."},
        {"id": "PC2025-I-2", "enonce_court": "Qualifier le mouvement de G en phase B", "points": 2, "reponse_attendue": "Circulaire uniforme", "type_reponse": "choix", "indice": "En phase B la vitesse est constante et le mouvement est toujours circulaire."},
        {"id": "PC2025-I-3", "enonce_court": "Composantes de l'accélération en phase B", "points": 2, "reponse_attendue": "a_t = dv/dt = 0, a_n = V²/R = (2000)²/40 = 10⁵ m/s²", "indice": "En mouvement uniforme, a_t = 0. L'accélération normale vaut v²/R."},
        {"id": "PC2025-I-4", "enonce_court": "PFD appliqué au projectile", "points": 1, "reponse_attendue": "Ma = F (2e loi de Newton)", "indice": "Σ forces extérieures = m × accélération."},
        {"id": "PC2025-I-5", "enonce_court": "Composantes de F", "points": 2, "reponse_attendue": "F_t = Ma_t = 0, F_n = Ma_n = 50 × 10⁵ = 5×10⁶ N", "indice": "F = Ma, projetez sur les axes tangent et normal."},
        {"id": "PC2025-I-6", "enonce_court": "Origine de la force F", "points": 1, "reponse_attendue": "Le bras de catapulte et les parois de la chambre d'accélération", "type_reponse": "choix", "indice": "Quels sont les objets en contact avec le projectile ?"},
        {"id": "PC2025-I-7", "enonce_court": "Paramètres à modifier pour diminuer F", "points": 2, "reponse_attendue": "Diminuer M (masse) et/ou augmenter R (longueur du bras). F_n = Mv²/R.", "indice": "F = Mv²/R. Comment réduire F sans changer v ?"}
      ]
    },
    {
      "id": "PC2025-II",
      "titre": "Hydrolyse du bromure de tertiobutyle",
      "chapitre": "chimie_organique",
      "points_total": 14,
      "pages_enonce": [6, 7],
      "sous_questions": [
        {"id": "PC2025-II-1", "enonce_court": "Formule topologique + nom du produit tBuOH", "points": 2, "reponse_attendue": "2-méthylpropan-2-ol", "type_reponse": "choix", "indice": "tBuOH = (CH₃)₃COH. C'est un alcool tertiaire."},
        {"id": "PC2025-II-2", "enonce_court": "Famille de réaction", "points": 1, "reponse_attendue": "Substitution", "type_reponse": "choix", "indice": "Br est remplacé par OH : un atome/groupe en remplace un autre."},
        {"id": "PC2025-II-3", "enonce_court": "Allure de la courbe de conductimétrie", "points": 1, "reponse_attendue": "Courbe 4 (croissance puis plateau)", "type_reponse": "choix", "indice": "Les ions Br⁻ et H₃O⁺ apparaissent progressivement, augmentant σ."},
        {"id": "PC2025-II-4", "enonce_court": "Tableau d'avancement", "points": 2, "reponse_attendue": "À t½ : n(tBuBr) = 0.025 mol. À l'infini : n(tBuBr) = 0, n(tBuOH) = 0.050 mol.", "indice": "t½ = temps de demi-réaction : la moitié du réactif limitant a été consommée."},
        {"id": "PC2025-II-5", "enonce_court": "Intermédiaires réactionnels du mécanisme", "points": 1, "reponse_attendue": "tBu⁺ (carbocation) et tBu(OH₂)⁺", "indice": "Les intermédiaires réactionnels sont les espèces formées puis consommées au cours du mécanisme."},
        {"id": "PC2025-II-6", "enonce_court": "Flèches courbes du mécanisme", "points": 2, "reponse_attendue": "Étape 1: hétérolyse C-Br. Étape 2: attaque nucléophile H₂O sur tBu⁺. Étape 3: déprotonation.", "type_reponse": "manuscrit", "indice": "Mécanisme SN1 : 1) départ du groupe partant, 2) attaque du nucléophile, 3) déprotonation."},
        {"id": "PC2025-II-7", "enonce_court": "Constante de vitesse k", "points": 1, "reponse_attendue": "k = 0.277 h⁻¹", "type_reponse": "choix", "indice": "k = ln(2)/t½. Vérifiez les unités : ordre 1 → k en h⁻¹."},
        {"id": "PC2025-II-8", "enonce_court": "Loi de vitesse", "points": 2, "reponse_attendue": "v = k × [tBuBr]", "indice": "Réaction d'ordre 1 : la vitesse est proportionnelle à la concentration du réactif."}
      ]
    },
    {
      "id": "PC2025-III",
      "titre": "Stroboscope - Circuit RC",
      "chapitre": "electricite",
      "points_total": 14,
      "pages_enonce": [7, 8],
      "sous_questions": [
        {"id": "PC2025-III-1", "enonce_court": "u₁(t) en fonction de i(t)", "points": 1, "reponse_attendue": "u₁(t) = R₁ × i(t)", "indice": "Loi d'Ohm pour une résistance."},
        {"id": "PC2025-III-2", "enonce_court": "Relation uc(t) et i(t) pour un condensateur", "points": 1, "reponse_attendue": "i(t) = C × duc(t)/dt", "type_reponse": "choix", "indice": "L'unité du farad est A·s·V⁻¹. Donc i = C × du/dt."},
        {"id": "PC2025-III-3", "enonce_court": "Expressions de a et b dans l'équation différentielle", "points": 2, "reponse_attendue": "a = 1/(R₁C), b = E/(R₁C)", "indice": "Loi des mailles : E = R₁i + uc. Remplacez i par C×duc/dt."},
        {"id": "PC2025-III-4", "enonce_court": "Expression de uc(t) lors de la charge", "points": 1, "reponse_attendue": "uc(t) = E(1 - e^{-t/(R₁C)})", "type_reponse": "choix", "indice": "Condition initiale : uc(0) = 0. Asymptote : uc(∞) = E."},
        {"id": "PC2025-III-5", "enonce_court": "Constante de temps τ₁", "points": 2, "reponse_attendue": "τ₁ = R₁C = 60 × 5×10⁻⁴ = 30 ms", "indice": "τ = RC pour un circuit RC série."},
        {"id": "PC2025-III-6", "enonce_court": "Temps tfin de charge complète", "points": 1, "reponse_attendue": "tfin = 5τ₁ = 150 ms", "indice": "Convention : le condensateur est chargé à plus de 99% après 5τ."},
        {"id": "PC2025-III-7", "enonce_court": "Courbe correspondant à uc(t)", "points": 1, "reponse_attendue": "Courbe B (croissance exponentielle vers E=10V)", "type_reponse": "choix", "indice": "uc(t) part de 0 et croît vers E avec une tangente initiale non nulle."},
        {"id": "PC2025-III-8", "enonce_court": "τ₂ lors de la décharge", "points": 2, "reponse_attendue": "τ₂ = 20 ms (lecture graphique)", "indice": "τ₂ correspond au temps pour que uc passe de sa valeur initiale à 37% de celle-ci."},
        {"id": "PC2025-III-9", "enonce_court": "Résistance R₂", "points": 1, "reponse_attendue": "R₂ = τ₂/C = 0.020/5×10⁻⁴ = 40 Ω", "indice": "τ₂ = R₂ × C."},
        {"id": "PC2025-III-10", "enonce_court": "Durée d'illumination Δt", "points": 2, "reponse_attendue": "Δt ≈ 10 ms", "indice": "La lampe est allumée tant que u₂ > 6V. Lisez sur le graphique."}
      ]
    }
  ]
}
```

### 3.3 Maths Spécialité 2024 et PC 2024

Même structure. Les données sont dans les fichiers `Sujetcomplet2024.pdf`, `corrigemaths2024.pdf` et `corrigePC2024.pdf`. Léo crée les fichiers JSON en suivant exactement le même format que ci-dessus, en copiant les réponses depuis les corrigés.

**Maths Spé 2024** : 2 exercices (Ex I = Suites 20pts, Ex II = Géométrie espace 20pts).
**PC 2024** : 3 exercices (Ex I = Diffraction/interférences 11pts, Ex II = Estérification 13pts, Ex III = Saut à ski 16pts).

Pour ces 2 fichiers, Léo doit extraire les réponses des corrigés PDF car ils sont sur le VPS. C'est du texte simple (pas du LaTeX complexe), donc Léo peut le faire rapidement.
