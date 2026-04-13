# SPEC_RUN2_FRONTEND_QCM_V1.md — Interface QCM + Navigation

> **Run** : 2 — Frontend QCM jouable + navigation de base
> **Objectif** : Garance peut lancer un QCM depuis le plan de révision, répondre V/F, recevoir sa note et le feedback
> **Pré-requis** : Run 1 terminé (API backend fonctionnelle)
> **Durée estimée** : 3-4h

---

## 0. Pré-run

### Vérifications
1. Backend tourne : `curl http://localhost:8042/api/exercices/plan` → JSON
2. Frontend tourne : `npm run dev` dans `frontend/` → page d'accueil
3. Git propre : `git status` → working tree clean
4. **Tagger le Run 1** pour pouvoir y revenir :
```bash
git tag -a run1-ok -m "Run 1 stable - backend API + question bank"
git push origin run1-ok
```

### Stratégie rollback
À partir de maintenant, chaque run stable est taggé. En cas de crash :
```bash
git checkout run1-ok        # revenir au dernier état stable
git checkout -b fix/xxx     # créer une branche de fix
```

---

## 1. Direction design

### Contexte
Garance, 17 ans, révise sur tablette (iPad ou Android) en mode paysage. L'interface doit être :
- **Propre et concentrée** : pas de distraction, focus sur les exercices
- **Encourageante** : couleurs douces, messages positifs, jamais culpabilisant
- **Tablette-first** : gros boutons tactiles, pas de hover, scroll minimal

### Direction esthétique
**"Cahier de révision moderne"** — tons doux (bleu-gris, blanc cassé, vert sauge pour les succès, orange doux pour les alertes), typographie lisible et élégante, cartes avec ombres subtiles, transitions fluides. Pas de fioritures, pas de dark mode pour le MVP.

### Palette CSS variables

```css
:root {
  /* Couleurs principales */
  --bg-primary: #F8F9FB;
  --bg-card: #FFFFFF;
  --bg-header: #2C3E6B;
  
  /* Texte */
  --text-primary: #1A1A2E;
  --text-secondary: #6B7280;
  --text-light: #9CA3AF;
  
  /* Accents */
  --accent-blue: #3B82F6;
  --accent-green: #10B981;
  --accent-orange: #F59E0B;
  --accent-red: #EF4444;
  
  /* Niveaux de progression */
  --level-non-vu: #D1D5DB;
  --level-en-cours: #93C5FD;
  --level-fragile: #FCD34D;
  --level-acquis: #6EE7B7;
  --level-maitrise: #059669;
  
  /* Feedback */
  --correct-bg: #ECFDF5;
  --correct-border: #10B981;
  --partial-bg: #FFFBEB;
  --partial-border: #F59E0B;
  --incorrect-bg: #FEF2F2;
  --incorrect-border: #EF4444;
  
  /* Dimensions */
  --radius: 12px;
  --shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-lg: 0 4px 12px rgba(0,0,0,0.1);
  
  /* Typographie */
  --font-body: 'Source Sans 3', sans-serif;
  --font-math: 'KaTeX_Main', serif;
}
```

### Font
Charger depuis Google Fonts dans `index.html` :
```html
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
```

---

## 2. Routing (React Router)

```
/                     → Home (accueil Garance)
/plan                 → Plan de révision 5 jours
/qcm/:exerciseId      → Mode QCM V/F
/qcm/:exerciseId/result → Résultats QCM
/dashboard            → Tableau de bord progression
```

### Fichier `frontend/src/App.tsx`

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import RevisionPlan from './pages/RevisionPlan'
import QCM from './pages/QCM'
import QCMResult from './pages/QCMResult'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plan" element={<RevisionPlan />} />
        <Route path="/qcm/:exerciseId" element={<QCM />} />
        <Route path="/qcm/:exerciseId/result" element={<QCMResult />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App
```

---

## 3. Pages

### 3.1 Home — `/`

Layout simple, centré, tablette paysage.

```
┌──────────────────────────────────────────────────┐
│  PolytechRevision                    [Dashboard]  │
├──────────────────────────────────────────────────┤
│                                                   │
│         Bonjour Garance ! 👋                      │
│                                                   │
│    ┌─────────────────────────────────────┐       │
│    │  📅 Concours dans X jours           │       │
│    │  📊 Progression globale : XX%       │       │
│    └─────────────────────────────────────┘       │
│                                                   │
│    ┌──────────────┐  ┌──────────────┐            │
│    │ 📝 Commencer │  │ 📊 Plan de   │            │
│    │  les révisions│  │   révision   │            │
│    └──────────────┘  └──────────────┘            │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Logique** :
- Calculer le compte à rebours : jours restants jusqu'au 28 avril 2026
- Charger la progression depuis `GET /api/progression/garance`
- Bouton "Commencer" → `/plan`

### 3.2 Plan de révision — `/plan`

```
┌──────────────────────────────────────────────────┐
│  ← Retour          Plan de révision              │
├──────────────────────────────────────────────────┤
│                                                   │
│  Jour 1 — Calculs, Algèbre & Mécanique          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ Maths QCM  │ │ Maths Spé  │ │ Physique   │   │
│  │ Calculs    │ │ Analyse I  │ │ Mécanique  │   │
│  │ ●●●○○      │ │ ●○○○○      │ │ ○○○○○      │   │
│  │ [Lancer]   │ │ [Lancer]   │ │ [Lancer]   │   │
│  └────────────┘ └────────────┘ └────────────┘   │
│                                                   │
│  Jour 2 — Fonctions & Ondes                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ ...        │ │ ...        │ │ ...        │   │
│  └────────────┘ └────────────┘ └────────────┘   │
│                                                   │
│  ... (5 jours)                                    │
└──────────────────────────────────────────────────┘
```

**Logique** :
- `GET /api/exercices/plan` → structure des 5 jours
- `GET /api/progression/garance` → niveaux par chapitre
- Bouton "Lancer" d'un bloc QCM → `/qcm/{exerciseId}`
- Indicateur de progression (points colorés selon le niveau d'acquisition)
- Les blocs "Maths Spé" et "Physique" resteront grisés pour le Run 2 (exercices rédigés = Run 3)

### 3.3 Mode QCM — `/qcm/:exerciseId`

**C'est la page la plus importante du Run 2.**

```
┌──────────────────────────────────────────────────┐
│  QCM — Exercice I : Calculs        ⏱️ 07:23     │
├──────────────────────────────────────────────────┤
│                                                   │
│  I-A  (√8)² × (√3)⁵                             │
│       ─────────────── = 4/3                      │
│       6³ × √6 × (√2)⁻⁵                         │
│                                                   │
│       [ VRAI ]    [ FAUX ]    [ ? ]  (pas sûr)  │
│                                                   │
│  ─────────────────────────────────────────        │
│                                                   │
│  I-B  8¹⁰ − 4¹⁰                                 │
│       ──────────── = 2¹⁰                         │
│       10¹⁰ − 8¹⁰                                │
│                                                   │
│       [ VRAI ]    [ FAUX ]    [ ? ]              │
│                                                   │
│  ... (toutes les questions de l'exercice)         │
│                                                   │
├──────────────────────────────────────────────────┤
│  [💡 Indice]               [✅ Valider]           │
└──────────────────────────────────────────────────┘
```

**Comportement détaillé** :

1. **Chargement** : `GET /api/exercices/{exerciseId}` → affiche toutes les questions de l'exercice
2. **Rendu LaTeX** : chaque énoncé est rendu via KaTeX (composant `MathRender`)
3. **Boutons V/F** : 
   - 3 états par question : VRAI (vert), FAUX (rouge), non répondu (gris)
   - Un clic sélectionne, un 2e clic sur le même déselectionne (permet de ne pas répondre)
   - Bouton "?" pour marquer "pas sûr" (visuel seulement, compte comme non répondu)
4. **Chronomètre** : 
   - Démarre au chargement de la page
   - Affiche MM:SS en haut à droite
   - Pas de limite de temps en mode révision (juste informatif)
5. **Bouton Indice** :
   - Affiche l'indice de l'exercice dans un bandeau en bas
   - L'utilisation est tracée (envoyée au backend)
   - Un seul indice par exercice (bouton grisé après utilisation)
6. **Bouton Valider** :
   - Envoie `POST /api/correction/qcm` avec les réponses
   - Redirige vers `/qcm/{exerciseId}/result`

### 3.4 Résultats QCM — `/qcm/:exerciseId/result`

```
┌──────────────────────────────────────────────────┐
│  Résultats — Exercice I : Calculs    Score: 4/6  │
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌─ I-A ────────────────────────────────────┐    │
│  │ ✅ VRAI — Correct !                       │    │
│  │ (√8)² × (√3)⁵ / (6³ × √6 × (√2)⁻⁵) = 4/3  │
│  │ En simplifiant : numérateur = 72√3...     │    │
│  └───────────────────────────────────────────┘    │
│                                                   │
│  ┌─ I-B ────────────────────────────────────┐    │
│  │ ❌ Tu as répondu VRAI — la réponse est FAUX │  │
│  │ 📚 Rappel : Pour simplifier 8¹⁰, pensez │    │
│  │ à écrire 8 = 2³, donc 8¹⁰ = 2³⁰...      │    │
│  └───────────────────────────────────────────┘    │
│                                                   │
│  ┌─ I-C ────────────────────────────────────┐    │
│  │ ⬜ Pas de réponse (0 point)               │    │
│  │ La bonne réponse était VRAI.              │    │
│  │ 📚 ln(e/4) + ln(1/(9e)) + ln(36e) = ...  │    │
│  └───────────────────────────────────────────┘    │
│                                                   │
│  ── Feedback global ──                            │
│  "Pas mal Garance ! 4/6. Revois les propriétés   │
│   des puissances pour les calculs avec 8 et 10." │
│                                                   │
├──────────────────────────────────────────────────┤
│  [← Autre exercice]         [📊 Dashboard]       │
└──────────────────────────────────────────────────┘
```

**Logique** :
- Reçoit les résultats du POST correction (passés via state ou re-fetch)
- Affiche chaque question avec code couleur (vert/rouge/gris)
- Affiche l'explication pour chaque question
- Pour les erreurs : rappel de cours en premier, puis la bonne réponse
- Score en haut
- Feedback global (message du backend)
- Enregistrer chaque résultat : `POST /api/progression/resultat` pour chaque question

### 3.5 Dashboard — `/dashboard` (version basique)

```
┌──────────────────────────────────────────────────┐
│  Tableau de bord — Garance           📅 J-16     │
├──────────────────────────────────────────────────┤
│                                                   │
│  Maths QCM                                       │
│  ┌──────────────────────────────────────┐        │
│  │ Calculs       ████████░░  80%  ✅    │        │
│  │ Fonctions     ███░░░░░░░  30%  🟡    │        │
│  │ Suites        ░░░░░░░░░░   0%  ⬜    │        │
│  │ Probabilités  ░░░░░░░░░░   0%  ⬜    │        │
│  │ Géométrie     ░░░░░░░░░░   0%  ⬜    │        │
│  └──────────────────────────────────────┘        │
│                                                   │
│  Maths Spécialité                                │
│  ┌──────────────────────────────────────┐        │
│  │ (bientôt disponible)                  │        │
│  └──────────────────────────────────────┘        │
│                                                   │
│  Physique-Chimie                                 │
│  ┌──────────────────────────────────────┐        │
│  │ (bientôt disponible)                  │        │
│  └──────────────────────────────────────┘        │
│                                                   │
├──────────────────────────────────────────────────┤
│  [← Plan de révision]                             │
└──────────────────────────────────────────────────┘
```

**Logique** :
- `GET /api/progression/garance` → progression par chapitre
- Barres de progression colorées selon le niveau
- Maths spé et PC marqués "bientôt" (Run 3)

---

## 4. Composants réutilisables

### 4.1 `MathRender.tsx` — Rendu LaTeX

```tsx
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useRef, useEffect } from 'react'

interface Props {
  latex: string
  display?: boolean  // true = block, false = inline
}

export default function MathRender({ latex, display = false }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  
  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(latex, ref.current, {
          displayMode: display,
          throwOnError: false,
          trust: true
        })
      } catch (e) {
        // Fallback : afficher le LaTeX brut
        ref.current.textContent = latex
      }
    }
  }, [latex, display])
  
  return <span ref={ref} />
}
```

### 4.2 `Timer.tsx` — Chronomètre

```tsx
import { useState, useEffect } from 'react'

export default function Timer() {
  const [seconds, setSeconds] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])
  
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')
  
  return (
    <div style={{
      fontFamily: 'monospace',
      fontSize: '1.2rem',
      color: 'var(--text-secondary)',
      background: 'var(--bg-card)',
      padding: '4px 12px',
      borderRadius: '8px',
      boxShadow: 'var(--shadow)'
    }}>
      ⏱️ {mm}:{ss}
    </div>
  )
}
```

### 4.3 `VFButton.tsx` — Bouton Vrai/Faux

```tsx
interface Props {
  value: boolean | null  // true=vrai, false=faux, null=non répondu
  onChange: (v: boolean | null) => void
}

export default function VFButton({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
      <button
        onClick={() => onChange(value === true ? null : true)}
        style={{
          padding: '12px 32px',
          borderRadius: 'var(--radius)',
          border: '2px solid',
          borderColor: value === true ? 'var(--accent-green)' : '#E5E7EB',
          background: value === true ? 'var(--correct-bg)' : 'white',
          color: value === true ? 'var(--accent-green)' : 'var(--text-primary)',
          fontWeight: 600,
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          minWidth: '100px'
        }}
      >
        VRAI
      </button>
      <button
        onClick={() => onChange(value === false ? null : false)}
        style={{
          padding: '12px 32px',
          borderRadius: 'var(--radius)',
          border: '2px solid',
          borderColor: value === false ? 'var(--accent-red)' : '#E5E7EB',
          background: value === false ? 'var(--incorrect-bg)' : 'white',
          color: value === false ? 'var(--accent-red)' : 'var(--text-primary)',
          fontWeight: 600,
          fontSize: '1rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          minWidth: '100px'
        }}
      >
        FAUX
      </button>
    </div>
  )
}
```

### 4.4 `api.ts` — Client API

```tsx
const API_BASE = '/api'

export async function fetchPlan() {
  const res = await fetch(`${API_BASE}/exercices/plan`)
  return res.json()
}

export async function fetchExercise(id: string) {
  const res = await fetch(`${API_BASE}/exercices/${id}`)
  return res.json()
}

export async function fetchChapterExercises(matiere: string, chapitre: string) {
  const res = await fetch(`${API_BASE}/exercices/chapitre/${matiere}/${chapitre}`)
  return res.json()
}

export async function submitQCM(exerciseId: string, reponses: Record<string, boolean | null>) {
  const res = await fetch(`${API_BASE}/correction/qcm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exercise_id: exerciseId, reponses })
  })
  return res.json()
}

export async function saveResult(data: {
  question_id: string
  matiere: string
  chapitre: string
  est_correct: number
  score_obtenu: number
  score_max: number
  indice_utilise: number
  temps_reponse_sec: number
}) {
  const res = await fetch(`${API_BASE}/progression/resultat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function fetchProgression() {
  const res = await fetch(`${API_BASE}/progression/garance`)
  return res.json()
}
```

---

## 5. Dépendances npm à vérifier

```bash
cd frontend
npm ls react-router-dom katex axios
```

Si manquant :
```bash
npm install react-router-dom katex
```

Note : `axios` n'est plus nécessaire (on utilise `fetch` natif). `fabric` sera pour le Run 3 (canvas manuscrit).

---

## 6. Fichiers à créer/modifier

```
frontend/src/
├── App.tsx                    # MODIFIER (routing)
├── index.css                  # MODIFIER (variables CSS + reset)
├── pages/
│   ├── Home.tsx               # CRÉER
│   ├── RevisionPlan.tsx       # CRÉER
│   ├── QCM.tsx                # CRÉER (page principale)
│   ├── QCMResult.tsx          # CRÉER
│   └── Dashboard.tsx          # CRÉER (basique)
├── components/
│   ├── MathRender.tsx         # CRÉER
│   ├── Timer.tsx              # CRÉER
│   ├── VFButton.tsx           # CRÉER
│   └── Header.tsx             # CRÉER (barre de nav simple)
└── services/
    └── api.ts                 # CRÉER
```

---

## 7. Tests de validation Run 2

| # | Test | Action | Attendu |
|---|------|--------|---------|
| 1 | Home s'affiche | Ouvrir `http://...:5173/` | "Bonjour Garance", compte à rebours, boutons |
| 2 | Plan s'affiche | Cliquer "Plan de révision" | 5 jours avec blocs de chapitres |
| 3 | QCM se lance | Cliquer "Lancer" sur un bloc QCM | Exercice avec questions V/F et rendu LaTeX |
| 4 | V/F fonctionne | Cliquer VRAI puis FAUX | Sélection bascule, déselection au 2e clic |
| 5 | Indice | Cliquer "Indice" | Bandeau avec l'indice, bouton grisé ensuite |
| 6 | Chrono | Attendre 10s | Timer affiche 00:10 |
| 7 | Correction | Répondre à tout et Valider | Page résultat avec score + explications |
| 8 | Dashboard | Ouvrir `/dashboard` | Barres de progression (vides au début) |
| 9 | Tablette | Redimensionner le navigateur en 1024×768 | Layout correct, pas de scroll horizontal |

**Test critique** : le test 7 (correction complète) doit fonctionner de bout en bout — du clic VRAI/FAUX jusqu'à l'affichage du score et des explications.

---

## 8. Git

```bash
git tag -a run1-ok -m "Run 1 stable - backend API + question bank"  # si pas déjà fait
git add .
git commit -m "Run 2: frontend QCM - V/F interface, timer, correction, plan de revision, dashboard"
git push origin main
git tag -a run2-ok -m "Run 2 stable - QCM jouable"
git push origin run2-ok
```

**DEVLOG.md** et **CHANGELOG.md** à jour.

---

## 9. Rappels Léo

- Le CSS doit utiliser les variables définies en section 1 (pas de couleurs en dur)
- **Tablette-first** : tester en 1024×768 minimum, boutons assez gros (min 44px de hauteur tactile)
- KaTeX : importer le CSS (`import 'katex/dist/katex.min.css'`) sinon le rendu sera cassé
- Le proxy Vite `/api → localhost:8042` est configuré dans `vite.config.ts` (Run 0)
- **Ne pas installer de bibliothèque CSS** (Tailwind, etc.) — du CSS vanilla avec variables, c'est suffisant et léger
- Tester le rendu LaTeX avec une formule complexe comme `\frac{(\sqrt{8})^2}{6^3}` pour vérifier que KaTeX fonctionne
- Les résultats de correction doivent être passés à la page Result (via React state/navigate, ou via un re-fetch)
- Git tag obligatoire à la fin du run
