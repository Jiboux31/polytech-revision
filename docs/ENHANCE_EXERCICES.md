# ENHANCE_EXERCICES.md — Refonte de la présentation des exercices rédigés

> **Objectif** : Reproduire fidèlement la structure des exercices du concours Geipi Polytech.
> **Problèmes actuels** :
> 1. L'énoncé s'affiche en bloc (page PDF entière) avec les exercices suivants visibles
> 2. La feuille réponse s'affiche en bloc (toutes les questions d'un coup)
> 3. Les questions dans l'app ne correspondent pas à celles de l'exercice original
> 4. Pas de distinction QCM / manuscrit au sein d'un même exercice
> **Exemple de référence** : Exercice I PC 2025 — Catapulte spatiale

---

## 1. Nouveau modèle de données

Chaque exercice est découpé en 3 zones :

### Zone A — Contexte permanent (affiché en haut, ne change pas entre les questions)

C'est tout ce qui est AVANT les questions dans le sujet original :
- Le texte d'introduction (description de la situation physique, données, hypothèses)
- Les schémas (circuit, dispositif mécanique, montage optique, etc.)
- Les données numériques (masses, distances, constantes, etc.)
- Les notations définies

Cette zone reste visible pendant TOUTE la durée de l'exercice.

### Zone B — Question courante (change à chaque sous-question)

C'est la question elle-même, en **texte formaté** (pas une image). Reproduit exactement l'énoncé original.

### Zone C — Zone de réponse (change selon le type)

Deux cas :
- **Type QCM** : des boutons/checkboxes cliquables (comme la feuille réponse)
- **Type manuscrit** : un template montrant ce qu'on attend (issu de la feuille réponse) + un canvas libre

---

## 2. Nouveau format JSON — Exemple Catapulte spatiale PC2025-I

```json
{
  "id": "PC2025-I",
  "titre": "Catapulte spatiale",
  "matiere": "physique_chimie",
  "chapitre": "mecanique",
  "annee": 2025,
  "points_total": 12,

  "contexte": {
    "texte": "Dans le cas de l'envoi de petits satellites dans l'espace, l'utilisation d'une catapulte est à l'étude. Le projectile (satellite dans une coque aérodynamique) est mis en mouvement dans une chambre d'accélération, fixé à l'extrémité d'un bras rigide de longueur $R = 40$ m. Le bras tourne autour du point C grâce à un moteur électrique. Au point L, le projectile est éjecté verticalement.",
    "donnees": [
      "Masse du projectile : $M = 50$ kg",
      "Longueur du bras : $R = 40$ m",
      "Vitesse de lancement : $V_L = 2000$ m/s",
      "Accélération de la pesanteur : $g = 10$ m/s²",
      "Poids et frottements négligés en phase B"
    ],
    "schemas": [
      {
        "source": "pdf_crop",
        "pdf": "EnonceGP2025VF.pdf",
        "page": 6,
        "crop": {"top": 0.05, "bottom": 0.45, "left": 0.0, "right": 1.0},
        "description": "Schéma de la catapulte + graphique v(t) + repère de Frenet"
      }
    ]
  },

  "questions": [
    {
      "id": "PC2025-I-1",
      "enonce": "Comment qualifier le mouvement du point G au cours de la phase A ?",
      "type": "qcm_multi",
      "options": [
        {"label": "Rectiligne", "correct": false},
        {"label": "Uniforme", "correct": false},
        {"label": "Parabolique", "correct": false},
        {"label": "Accéléré", "correct": true},
        {"label": "Ralenti", "correct": false},
        {"label": "Circulaire", "correct": true}
      ],
      "points": 1,
      "explication": "Le projectile tourne (circulaire) et sa vitesse augmente d'après le graphique v(t) (accéléré).",
      "cours_associe": "Un mouvement circulaire accéléré combine une trajectoire courbe et une augmentation de la norme de la vitesse.",
      "indice": "Regardez le graphique v(t) : la vitesse augmente-t-elle ou est-elle constante en phase A ?"
    },
    {
      "id": "PC2025-I-2",
      "enonce": "Même question pour le mouvement de G au cours de la phase B.",
      "type": "qcm_multi",
      "options": [
        {"label": "Rectiligne", "correct": false},
        {"label": "Uniforme", "correct": true},
        {"label": "Parabolique", "correct": false},
        {"label": "Accéléré", "correct": false},
        {"label": "Ralenti", "correct": false},
        {"label": "Circulaire", "correct": true}
      ],
      "points": 1,
      "explication": "En phase B, la vitesse est constante (palier sur le graphique) et le mouvement est toujours circulaire.",
      "cours_associe": "Mouvement circulaire uniforme : trajectoire circulaire + vitesse constante.",
      "indice": "En phase B, que fait la courbe v(t) ? Est-elle plate ou inclinée ?"
    },
    {
      "id": "PC2025-I-3",
      "enonce": "Exprimer puis calculer les coordonnées $a_t$ et $a_n$ du vecteur accélération $\\vec{a} = a_t \\vec{t} + a_n \\vec{n}$ du point G.",
      "type": "manuscrit",
      "champs_reponse": [
        {"label": "Exp. Litt. : $a_t$ =", "id": "at_litt", "width": "medium"},
        {"label": "$a_n$ =", "id": "an_litt", "width": "medium"},
        {"label": "Appl. Num. : $a_t$ =", "id": "at_num", "width": "medium"},
        {"label": "$a_n$ =", "id": "an_num", "width": "medium"}
      ],
      "reponse_attendue": "$a_t = \\frac{dv}{dt} = 0$ m/s² ; $a_n = \\frac{V_L^2}{R} = \\frac{2000^2}{40} = 10^5$ m/s²",
      "points": 2,
      "explication": "En MCU, la vitesse est constante donc $a_t = dv/dt = 0$. L'accélération normale vaut $a_n = v^2/R$.",
      "cours_associe": "En mouvement circulaire : $a_t = dv/dt$ (composante tangentielle) et $a_n = v^2/R$ (composante normale, centripète). Si le mouvement est uniforme, $a_t = 0$.",
      "indice": "Le mouvement est uniforme en phase B : que vaut $dv/dt$ quand $v$ est constante ?"
    },
    {
      "id": "PC2025-I-4",
      "enonce": "Écrire le principe fondamental de la dynamique appliqué au projectile. On notera $\\vec{F}$ la résultante des forces.",
      "type": "manuscrit",
      "champs_reponse": [
        {"label": "Relation :", "id": "pfd", "width": "large"}
      ],
      "reponse_attendue": "$M\\vec{a} = \\vec{F}$",
      "points": 1,
      "explication": "C'est la 2e loi de Newton : la somme des forces extérieures est égale à la masse fois l'accélération.",
      "cours_associe": "PFD (2e loi de Newton) : $\\sum \\vec{F}_{ext} = m \\vec{a}$ dans un référentiel galiléen.",
      "indice": "Deuxième loi de Newton : quelle relation lie les forces, la masse et l'accélération ?"
    },
    {
      "id": "PC2025-I-5",
      "enonce": "En déduire les expressions des coordonnées $F_t$ et $F_n$ de la résultante $\\vec{F} = F_t \\vec{t} + F_n \\vec{n}$, puis calculer leurs valeurs.",
      "type": "manuscrit",
      "champs_reponse": [
        {"label": "Exp. Litt. : $F_t$ =", "id": "ft_litt", "width": "medium"},
        {"label": "$F_n$ =", "id": "fn_litt", "width": "medium"},
        {"label": "Appl. Num. : $F_t$ =", "id": "ft_num", "width": "medium"},
        {"label": "$F_n$ =", "id": "fn_num", "width": "medium"}
      ],
      "reponse_attendue": "$F_t = Ma_t = 0$ N ; $F_n = Ma_n = 50 \\times 10^5 = 5 \\times 10^6$ N",
      "points": 2,
      "explication": "Projection du PFD sur les axes du repère de Frenet : $F_t = Ma_t$ et $F_n = Ma_n$.",
      "cours_associe": "Projection du PFD dans le repère de Frenet : $F_t = ma_t$ et $F_n = ma_n$.",
      "indice": "Projetez $M\\vec{a} = \\vec{F}$ sur chaque axe du repère de Frenet."
    },
    {
      "id": "PC2025-I-6",
      "enonce": "Identifier le ou les systèmes à l'origine des forces dont la résultante est $\\vec{F}$.",
      "type": "qcm_multi",
      "options": [
        {"label": "Le sol", "correct": false},
        {"label": "Le bras de catapulte", "correct": true},
        {"label": "Le projectile", "correct": false},
        {"label": "Le satellite", "correct": false},
        {"label": "Le tube d'éjection", "correct": false},
        {"label": "Les parois de la chambre d'accélération", "correct": true}
      ],
      "points": 1,
      "explication": "Les forces sur le projectile proviennent des objets en contact avec lui : le bras (qui le maintient) et les parois de la chambre (réaction normale).",
      "cours_associe": "Inventaire des forces : identifier tous les objets en contact avec le système étudié + les forces à distance (poids, ici négligé).",
      "indice": "Quels objets sont en contact physique avec le projectile pendant la phase B ?"
    },
    {
      "id": "PC2025-I-7",
      "enonce": "Pour diminuer l'intensité de $\\vec{F}$ sans modifier la vitesse $V_L$, quel(s) paramètre(s) faudrait-il modifier ? Préciser le sens d'évolution.",
      "type": "manuscrit",
      "champs_reponse": [
        {"label": "Paramètre(s) et sens d'évolution :", "id": "params", "width": "large"}
      ],
      "reponse_attendue": "Diminuer $M$ (masse du projectile) et/ou augmenter $R$ (longueur du bras). Car $F_n = MV_L^2/R$.",
      "points": 2,
      "explication": "$F_n = MV_L^2/R$. À $V_L$ constant : diminuer $M$ diminue $F$, augmenter $R$ diminue $F$.",
      "cours_associe": "Analyse dimensionnelle d'une formule : identifier les paramètres et leur influence sur le résultat.",
      "indice": "Reprenez l'expression $F_n = MV_L^2/R$. Quels paramètres pouvez-vous changer si $V_L$ est fixé ?"
    }
  ]
}
```

---

## 3. Gestion des schémas — Crop de PDF

### Problème
Afficher une page entière de PDF montre les exercices suivants. Il faut cropper.

### Solution : `pdf_crop_service.py`

```python
import os
import subprocess
from PIL import Image
from config import settings

CACHE_DIR = os.path.join(settings.DATA_DIR, "page_cache")

def get_pdf_crop(pdf_filename: str, page: int, 
                 top: float, bottom: float, left: float, right: float) -> str | None:
    """Retourne un crop d'une page PDF comme image PNG.
    
    top, bottom, left, right : fractions de la page (0.0 à 1.0).
    Ex: top=0.05, bottom=0.45 = la moitié haute de la page.
    """
    os.makedirs(CACHE_DIR, exist_ok=True)
    
    crop_id = f"{pdf_filename.replace('.pdf','')}_{page}_{int(top*100)}_{int(bottom*100)}_{int(left*100)}_{int(right*100)}"
    cache_path = os.path.join(CACHE_DIR, f"{crop_id}.png")
    
    if os.path.exists(cache_path):
        return cache_path
    
    # D'abord, obtenir la page complète
    from services.pdf_service import get_pdf_page_image
    full_page = get_pdf_page_image(pdf_filename, page)
    if not full_page:
        return None
    
    # Cropper avec Pillow
    img = Image.open(full_page)
    w, h = img.size
    box = (int(left * w), int(top * h), int(right * w), int(bottom * h))
    cropped = img.crop(box)
    cropped.save(cache_path, "PNG")
    
    return cache_path
```

### Endpoint

Ajouter dans `routers/exercices.py` :

```python
from services.pdf_crop_service import get_pdf_crop

@router.get("/pdf-crop/{pdf_filename}/{page}")
async def get_cropped_page(pdf_filename: str, page: int,
                           top: float = 0, bottom: float = 1,
                           left: float = 0, right: float = 1):
    """Retourne un crop d'une page PDF."""
    image_path = get_pdf_crop(pdf_filename, page, top, bottom, left, right)
    if not image_path:
        raise HTTPException(404, "Crop introuvable")
    return FileResponse(image_path, media_type="image/png")
```

---

## 4. Frontend — Nouveau composant `ExerciceRedige.tsx`

### Layout tablette paysage

```
┌──────────────────────────────────────────────────────────┐
│  Catapulte spatiale — Q3/7 (2 pts)          ⏱️ 12:34    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌── CONTEXTE (scrollable, toujours visible) ──────────┐│
│  │ Dans le cas de l'envoi de petits satellites...       ││
│  │ Données : M=50kg, R=40m, V_L=2000 m/s              ││
│  │ ┌─────────────────────────────────────┐             ││
│  │ │ [Image croppée du schéma catapulte] │             ││
│  │ │ [+ graphique v(t) + repère Frenet]  │             ││
│  │ └─────────────────────────────────────┘             ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌── QUESTION ─────────────────────────────────────────┐│
│  │ I-3 Exprimer puis calculer les coordonnées a_t      ││
│  │ et a_n du vecteur accélération a = a_t·t + a_n·n    ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌── RÉPONSE ──────────────────────────────────────────┐│
│  │ Exp. Litt. : a_t = [________]  a_n = [________]     ││
│  │ Appl. Num. : a_t = [________]  a_n = [________]     ││
│  │                                                      ││
│  │     (zones de canvas manuscrit pour chaque champ)    ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  [💡 Indice]                         [✅ Valider]       │
└──────────────────────────────────────────────────────────┘
```

### Composant pour les questions QCM intégrées

```tsx
interface QCMOption {
  label: string
  correct: boolean
}

function QCMMulti({ options, selected, onChange }: {
  options: QCMOption[]
  selected: Set<number>
  onChange: (selected: Set<number>) => void
}) {
  const toggle = (i: number) => {
    const next = new Set(selected)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    onChange(next)
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => toggle(i)}
          style={{
            padding: '12px 20px',
            borderRadius: 'var(--radius)',
            border: '2px solid',
            borderColor: selected.has(i) ? 'var(--accent-blue)' : '#D1D5DB',
            background: selected.has(i) ? '#EFF6FF' : 'white',
            color: selected.has(i) ? 'var(--accent-blue)' : 'var(--text-primary)',
            fontWeight: selected.has(i) ? 600 : 400,
            cursor: 'pointer',
            minWidth: 120,
            minHeight: 44,
            fontSize: '0.95rem'
          }}
        >
          {selected.has(i) ? '☑' : '☐'} {opt.label}
        </button>
      ))}
    </div>
  )
}
```

### Composant pour les champs manuscrits structurés

```tsx
function ChampsManuscrits({ champs, onExport }: {
  champs: { label: string, id: string, width: string }[]
  onExport: (data: Record<string, string>) => void  // id → base64
}) {
  // Chaque champ a son propre mini-canvas
  // "width" : "small" = 200px, "medium" = 350px, "large" = 700px
  const widthMap = { small: 200, medium: 350, large: 700 }
  
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end'
    }}>
      {champs.map(ch => (
        <div key={ch.id}>
          <div style={{
            fontSize: '0.9rem', marginBottom: 4,
            color: 'var(--text-secondary)'
          }}>
            <MathRender latex={ch.label} />
          </div>
          <MiniCanvas
            width={widthMap[ch.width as keyof typeof widthMap] || 350}
            height={60}
            id={ch.id}
          />
        </div>
      ))}
    </div>
  )
}
```

Le `MiniCanvas` est une version simplifiée du `DrawingCanvas` : juste un rectangle blanc avec stylet, sans toolbar. La toolbar (couleur, gomme, etc.) est partagée au-dessus de tous les champs.

### Correction QCM intégrée (pas de LLM)

Pour les questions de type `qcm_multi`, la correction est locale :

```typescript
function scoreQCMMulti(selected: Set<number>, options: QCMOption[]): {
  correct: boolean, score: number, max: number
} {
  const correctSet = new Set(options.map((o, i) => o.correct ? i : -1).filter(i => i >= 0))
  const isCorrect = selected.size === correctSet.size && 
                    [...selected].every(i => correctSet.has(i))
  return {
    correct: isCorrect,
    score: isCorrect ? 1 : 0,  // scoring simple pour les QCM dans exercices rédigés
    max: 1
  }
}
```

### Correction manuscrite (LLM)

Pour les questions de type `manuscrit`, le comportement actuel reste : on exporte les canvas en PNG et on envoie à Gemini. La différence : on envoie TOUS les champs d'une question en une seule image composite (ou en images séparées avec les labels).

---

## 5. Extraction du contexte — Travail de données

### Ce que Léo doit faire pour chaque exercice

Pour chaque exercice rédigé (PC 2024, PC 2025, Maths Spé 2024, Maths Spé 2025) :

1. **Identifier le texte de contexte** (avant les questions) et le saisir en texte + LaTeX dans le champ `contexte.texte`
2. **Lister les données numériques** dans `contexte.donnees`
3. **Identifier les schémas** et définir les coordonnées de crop dans `contexte.schemas`
4. **Pour chaque question**, déterminer le `type` :
   - `"qcm_single"` : une seule réponse parmi N (ex: cocher la bonne formule)
   - `"qcm_multi"` : plusieurs réponses possibles (ex: cocher Rectiligne + Accéléré)
   - `"manuscrit"` : réponse écrite à la main
5. **Pour les QCM** : lister les `options` avec `correct: true/false`
6. **Pour les manuscrits** : définir les `champs_reponse` qui reproduisent la feuille réponse

### Priorité : commencer par PC 2025 (3 exercices)

Les 3 exercices de PC 2025 sont les plus variés (QCM + manuscrit + schémas + graphiques). Une fois le modèle validé, Léo réplique pour les autres.

---

## 6. Backend — Adaptation du scoring

### Nouveau endpoint unifié

Remplacer les endpoints séparés `/correction/qcm` et `/correction/redige` par un endpoint unique pour les exercices rédigés :

```python
@router.post("/correction/exercice")
async def corriger_exercice(submission):
    """Corrige une question d'exercice (QCM ou manuscrit)."""
    question = get_question(submission.question_id)
    
    if question["type"] in ("qcm_single", "qcm_multi"):
        # Correction locale, pas de LLM
        return score_qcm_in_exercise(submission.selected, question["options"])
    
    elif question["type"] == "manuscrit":
        # Correction LLM
        return await correct_handwritten(submission.images, question)
```

Les anciens endpoints QCM V/F du Run 2 restent inchangés (ils gèrent les QCM "purs" de maths).

---

## 7. Tests

| # | Test | Attendu |
|---|------|---------|
| 1 | Ouvrir PC2025-I (Catapulte) | Contexte en haut avec schéma croppé |
| 2 | Question I-1 (QCM mouvement) | 6 boutons cliquables (Rectiligne, Uniforme...) |
| 3 | Valider I-1 avec "Circulaire + Accéléré" | Correct, feedback vert |
| 4 | Question I-3 (manuscrit at, an) | 4 champs manuscrits étiquetés |
| 5 | Écrire dans les champs et valider | Correction LLM avec feedback |
| 6 | Le contexte reste visible entre les questions | Schéma toujours là quand on passe de I-1 à I-3 |
| 7 | Le schéma est croppé (pas toute la page) | Seule la partie pertinente est visible |

---

## 8. Git

```bash
git add .
git commit -m "Enhance: faithful exercise presentation with context, mixed QCM/handwriting, PDF crops"
git push origin main
```

---

## 9. Rappels

- Le crop PDF nécessite `Pillow` (déjà dans requirements.txt)
- `poppler-utils` doit être installé (hotfix précédent)
- Commencer par PC2025-I comme exercice pilote, valider, puis répliquer
- Le texte du contexte et des questions est en **texte formaté + LaTeX**, PAS en image (sauf les schémas)
- Les schémas sont des crops d'image du PDF (seule solution pour les graphiques et dessins)
- Les champs manuscrits mini-canvas remplacent le gros canvas unique
