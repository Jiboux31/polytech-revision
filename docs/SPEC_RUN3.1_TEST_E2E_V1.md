# SPEC_RUN3.1 — Test E2E "Test Enhancement"

> **Projet** : PolytechRevision — Tests end-to-end via navigateur
> **Run** : 3.1 (intercalé après Run 3 Canvas+OCR)
> **Architecte** : Claude | **Développeur** : Léo | **Validateur** : JB
> **Réf. parent** : `SPEC_GENERALE_V1.md` — sections 4, 7, 9, 10
> **Réf. système** : `OPENCLAW_REF.md` — sections 1, 3

---

## 0. Objectif

Créer un protocole de test E2E réaliste qui **ouvre un vrai navigateur**, navigue dans l'application PolytechRevision comme le ferait Garance, et produit un **Compte-Rendu (CR) structuré** exploitable par Léo pour corriger les bugs de manière méthodique (diagnostic → correction → test unitaire → documentation).

Le script doit pouvoir tester **tout le site** ou **un sous-ensemble ciblé** (par domaine fonctionnel ou par scénario individuel).

---

## 1. Environnement — Pré-requis et vérification

### 1.1 Vérification Playwright

Avant toute implémentation, Léo DOIT vérifier que Playwright est opérationnel sur le VPS.

**Commandes de diagnostic (Phase 1) :**

```bash
/usr/local/bin/python3.10 -c "import playwright; print(playwright.__version__)"
```

```bash
/usr/local/bin/python3.10 -m playwright install --dry-run
```

```bash
ls -la /root/.cache/ms-playwright/
```

```bash
/usr/local/bin/python3.10 -c "
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.firefox.launch(headless=True)
    page = browser.new_page()
    page.goto('https://example.com')
    print(f'Title: {page.title()}')
    browser.close()
    print('OK — Playwright Firefox headless fonctionne')
"
```

**Si Playwright n'est PAS installé :**

```bash
/usr/local/bin/python3.10 -m pip install playwright --break-system-packages
```

```bash
/usr/local/bin/python3.10 -m playwright install firefox
```

```bash
/usr/local/bin/python3.10 -m playwright install-deps firefox
```

⚠️ **Ne PAS installer chromium** — trop lourd pour 4 Go RAM. Firefox headless suffit.

⚠️ `install-deps` installe les libs système (libgtk, libnss, etc.) — nécessite root (Léo est root).

### 1.2 Vérification de l'application cible

Le script doit pouvoir atteindre l'application. Léo doit vérifier :

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/
```

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs
```

Si l'app tourne derrière Nginx en HTTPS, adapter l'URL de base. Le script prendra l'URL en paramètre (voir section 3).

### 1.3 Dépendances Python supplémentaires

```bash
/usr/local/bin/python3.10 -m pip install Pillow --break-system-packages
```

Pillow est nécessaire pour la génération des fixtures manuscrites (section 5) et la vérification de taille des exports PNG.

### 1.4 Vérification mémoire disponible

Firefox headless + Playwright consomme ~300-400 Mo RAM. Vérifier avant de lancer :

```bash
free -h | head -2
```

Si la RAM disponible est < 500 Mo, le script doit afficher un warning dans le CR mais tenter quand même (le swap de 4 Go rattrapera).

### 1.5 Arborescence à créer

```
polytech-revision/
└── tests/
    └── e2e/
        ├── polytech_e2e.py          # Script principal
        ├── scenarios.py             # Catalogue des scénarios
        ├── fixtures/                # Images manuscrites de test
        │   ├── fixture_correct.png
        │   ├── fixture_partielle.png
        │   ├── fixture_fausse.png
        │   ├── fixture_vide.png
        │   └── generate_fixtures.py # Script de génération
        ├── reports/                  # CR générés (gitignore)
        │   └── .gitkeep
        ├── screenshots/             # Captures (gitignore)
        │   └── .gitkeep
        └── README.md                # Doc d'utilisation rapide
```

---

## 2. Architecture du script

### 2.1 Principes

Le script est un **unique fichier Python** (`polytech_e2e.py`) qui utilise Playwright en mode async. Il est conçu pour être :
- Exécuté par Léo via `exec` sur le VPS
- Lisible et modifiable par Léo sans connaître un framework de test complexe
- Extensible : ajouter un scénario = ajouter une fonction dans `scenarios.py`

**Pas de pytest, pas de unittest.** Le script produit directement un CR Markdown. On veut de la simplicité, pas un framework.

### 2.2 Invocations

```bash
/usr/local/bin/python3.10 tests/e2e/polytech_e2e.py --all

/usr/local/bin/python3.10 tests/e2e/polytech_e2e.py --tag accueil

/usr/local/bin/python3.10 tests/e2e/polytech_e2e.py --tag qcm --tag manuscrit

/usr/local/bin/python3.10 tests/e2e/polytech_e2e.py --sc SC-07

/usr/local/bin/python3.10 tests/e2e/polytech_e2e.py --sc SC-07 --sc SC-30 --sc SC-31

/usr/local/bin/python3.10 tests/e2e/polytech_e2e.py --rerun-fails

/usr/local/bin/python3.10 tests/e2e/polytech_e2e.py --tag correction-llm --no-screenshots
```

### 2.3 Arguments CLI

| Argument | Type | Défaut | Description |
|----------|------|--------|-------------|
| `--all` | flag | — | Lance tous les scénarios |
| `--tag TAG` | multi | — | Filtre par domaine (cumulable, OR logique) |
| `--sc SC-XX` | multi | — | Lance uniquement le(s) scénario(s) spécifié(s) |
| `--rerun-fails` | flag | — | Relit le dernier CR, relance les FAIL et WARN |
| `--url URL` | string | `http://localhost:5173` | URL de base de l'application |
| `--api-url URL` | string | `http://localhost:8000` | URL de base du backend |
| `--timeout MS` | int | `30000` | Timeout global par scénario (ms) |
| `--llm-timeout MS` | int | `45000` | Timeout spécifique pour les appels LLM |
| `--no-screenshots` | flag | — | Désactive les captures (plus rapide) |
| `--viewport WxH` | string | `1024x768` | Taille du viewport |
| `--output DIR` | string | `tests/e2e/reports/` | Dossier de sortie du CR |
| `--verbose` | flag | — | Affiche le détail dans stdout en temps réel |

### 2.4 Structure interne du script

```python
# polytech_e2e.py — structure logique (pas le code final)

class Scenario:
    id: str           # "SC-07"
    name: str         # "Soumission réponse manuscrite"
    tags: list[str]   # ["manuscrit", "correction-llm"]
    timeout: int      # override du timeout global si besoin
    
    async def run(self, page, ctx) -> ScenarioResult:
        # Implémentation du scénario
        ...

class ScenarioResult:
    status: str       # "PASS" | "FAIL" | "WARN" | "SKIP"
    duration_ms: int
    message: str
    screenshot_path: str | None
    console_errors: list[str]
    network_errors: list[dict]  # {url, status, method}
    suggested_files: list[str]  # fichiers probablement impliqués
    suggested_action: str       # action corrective suggérée

class TestRunner:
    async def run(self, scenarios: list[Scenario]) -> TestReport
    
class TestReport:
    def to_markdown(self) -> str   # Génère le CR
    def save(self, path: str)
    def get_fails(self) -> list[str]  # IDs des FAIL/WARN pour --rerun-fails
```

### 2.5 Capture automatique des erreurs

Pour **chaque scénario**, le script capture automatiquement (sans que chaque scénario ait à le coder) :

- **Erreurs console JS** : `page.on("console", ...)` filtré sur `error` et `warning`
- **Requêtes réseau échouées** : `page.on("requestfailed", ...)` + réponses 4xx/5xx via `page.on("response", ...)`
- **Screenshot en cas de FAIL** : capture automatique au moment de l'échec
- **Screenshot de succès** : capture à la fin du scénario si `--no-screenshots` n'est pas activé (utile pour le premier run complet, pour avoir une référence visuelle)

---

## 3. Catalogue des scénarios

### 3.1 Domaine `accueil` — 3 scénarios

**SC-01 : Chargement page d'accueil**
- Action : `page.goto(BASE_URL)`
- Vérifie : page chargée en < 5s, pas d'erreur console
- Vérifie : `page.wait_for_selector('[data-testid="home-page"]', timeout=5000)`
- FAIL si : timeout, erreur JS, ou HTTP != 200

**SC-02 : Message de bienvenue et progression**
- Prérequis : SC-01
- Vérifie : texte "Bonjour Garance" visible — `page.locator('[data-testid="welcome-message"]')`
- Vérifie : barre de progression globale présente — `[data-testid="global-progress"]`
- WARN si : progression affiche 0% alors que des résultats existent en base

**SC-03 : Suggestion du jour**
- Prérequis : SC-01
- Vérifie : `[data-testid="daily-suggestion"]` visible OU un placeholder "Commence par..."
- SKIP si : composant pas encore implémenté (Léo note dans le CR)

### 3.2 Domaine `qcm` — 5 scénarios

**SC-10 : Navigation vers un QCM**
- Action : naviguer vers la page QCM (clic menu ou URL directe `/qcm`)
- Vérifie : au moins 1 exercice QCM listé
- Vérifie : rendu KaTeX fonctionnel — `page.wait_for_selector('.katex', timeout=5000)`
- FAIL si : page vide ou erreur de rendu LaTeX

**SC-11 : Interaction cases V/F**
- Prérequis : SC-10, ouvrir un exercice QCM
- Action : cliquer sur chaque case V/F d'un exercice
- Vérifie : changement d'état visuel au clic (classe CSS `checked` ou `selected`)
- Vérifie : re-clic déselectionne
- FAIL si : clic sans effet ou crash JS

**SC-12 : Chronomètre QCM**
- Prérequis : SC-10
- Vérifie : `[data-testid="timer"]` visible, format `MM:SS` ou `HH:MM:SS`
- Action : attendre 2 secondes
- Vérifie : la valeur du timer a changé (il décompte)
- FAIL si : timer figé ou absent

**SC-13 : Soumission et scoring QCM**
- Prérequis : SC-11 (cases cochées)
- Action : cocher quelques réponses (mix bonnes/mauvaises), cliquer `[data-testid="submit-qcm"]`
- Vérifie : score affiché dans `[data-testid="qcm-score"]`
- Vérifie : bonnes réponses en vert, mauvaises en rouge
- FAIL si : pas de score ou erreur API

**SC-14 : Barème points négatifs**
- Prérequis : SC-13
- Action : sur un exercice dont les réponses sont connues, cocher volontairement 1 fausse + 1 non-répondue
- Vérifie : la fausse donne des points négatifs, la non-répondue donne 0
- Vérifie : score de l'exercice ≥ 0 (plancher)
- FAIL si : calcul incorrect

### 3.3 Domaine `manuscrit` — 4 scénarios

**SC-20 : Affichage canvas et outils**
- Action : naviguer vers un exercice rédigé
- Vérifie : `[data-testid="canvas-container"]` visible
- Vérifie : outils présents — `[data-testid="tool-color"]`, `[data-testid="tool-eraser"]`, `[data-testid="tool-undo"]`, `[data-testid="tool-redo"]`
- FAIL si : canvas absent ou outils manquants

**SC-21 : Injection PNG et activation validation**
- Prérequis : SC-20
- Action : injecter `fixture_correct.png` sur le canvas via JS (voir section 4)
- Vérifie : bouton `[data-testid="submit-answer"]` passe de disabled à enabled
- FAIL si : bouton reste grisé après injection

**SC-22 : Undo/Redo**
- Prérequis : SC-21 (image injectée)
- Action : clic sur undo → vérifie canvas vide → clic redo → vérifie image revenue
- Vérifie : l'état du canvas change à chaque action
- WARN si : undo/redo ne marchent pas (non bloquant mais à corriger)

**SC-23 : Export PNG non-vide**
- Prérequis : SC-21
- Action : déclencher l'export PNG via JS (`canvas.toDataURL()`)
- Vérifie : l'image exportée fait > 1 Ko (pas un canvas blanc)
- FAIL si : export vide ou erreur

### 3.4 Domaine `correction-llm` — 6 scénarios

⚠️ **Ces scénarios font de vrais appels LLM** (Gemini Flash Vision). Ils coûtent ~$0.001/appel et prennent 5-15s chacun. Le timeout est `--llm-timeout` (défaut 45s).

**SC-30 : Correction réponse correcte**
- Prérequis : SC-20 (sur un exercice rédigé)
- Action : injecter `fixture_correct.png`, cliquer Valider
- Attente : `page.wait_for_selector('[data-testid="feedback-block"]', timeout=LLM_TIMEOUT)`
- Vérifie : le feedback contient un indicateur positif (chercher texte "Bravo", "correct", "parfait" ou `[data-testid="feedback-correct"]`)
- FAIL si : timeout, erreur API, ou feedback négatif sur réponse correcte
- **Fichiers impliqués si FAIL** : `backend/routers/correction.py`, `backend/services/ocr_service.py`, `frontend/src/components/Feedback.tsx`

**SC-31 : Correction réponse partielle**
- Même flow que SC-30 avec `fixture_partielle.png`
- Vérifie : feedback contient un rappel de cours (`[data-testid="feedback-cours"]`) ET une correction (`[data-testid="feedback-correction"]`)
- FAIL si : feedback de type "correct" (faux positif) ou timeout

**SC-32 : Correction réponse fausse**
- Même flow avec `fixture_fausse.png`
- Vérifie : feedback de type niveau 3 — rappel de cours complet + correction pas à pas
- FAIL si : feedback de type "correct" ou "partiel"

**SC-33 : Soumission canvas vide**
- Action : ne rien dessiner/injecter, forcer le clic Valider (si le bouton est actif) ou vérifier qu'il est grisé
- Vérifie : soit le bouton est désactivé (OK), soit le backend gère proprement (message "Écris ta réponse d'abord")
- FAIL si : crash JS ou erreur 500

**SC-34 : Timeout LLM — comportement gracieux**
- Ce test est difficile à forcer. Stratégie : on l'observe naturellement. Si SC-30/31/32 timeout, ce scénario vérifie que l'UI affiche un message d'attente (`[data-testid="feedback-loading"]`) plutôt qu'un écran cassé.
- SKIP si : aucun timeout observé dans les tests précédents
- WARN si : le loading spinner/message n'est pas présent pendant l'attente

**SC-35 : Bouton Indice**
- Prérequis : SC-20 (sur un exercice rédigé qui a un indice)
- Action : clic sur `[data-testid="hint-button"]`
- Vérifie : `[data-testid="hint-content"]` apparaît avec du texte non vide
- Vérifie : le bouton Indice est désactivé après usage (un seul indice par question)
- WARN si : indice vide ou bouton toujours actif après clic

### 3.5 Domaine `dashboard` — 4 scénarios

**SC-40 : Chargement tableau de bord**
- Action : naviguer vers `/dashboard`
- Vérifie : page chargée, les 3 matières listées (Maths QCM, Maths Spé, PC)
- FAIL si : page vide ou matières manquantes

**SC-41 : Code couleur des chapitres**
- Prérequis : SC-40
- Vérifie : chaque chapitre a un indicateur de niveau (gris/bleu/orange/vert clair/vert foncé)
- Vérifie : `[data-testid="chapter-level"]` a un attribut `data-level` parmi `non_vu|en_cours|fragile|acquis|maitrise`
- WARN si : tous les chapitres sont au même niveau (probablement pas de données)

**SC-42 : Navigation chapitre → exercices**
- Prérequis : SC-41
- Action : clic sur un chapitre
- Vérifie : navigation vers la liste d'exercices de ce chapitre
- FAIL si : clic sans effet ou erreur

**SC-43 : Plan de révision 5 jours**
- Action : naviguer vers le plan de révision
- Vérifie : 5 jours affichés avec chapitres associés
- Vérifie : indication d'avancement par jour
- WARN si : plan affiché mais vide ou incomplet

### 3.6 Domaine `simulation` — 4 scénarios

**SC-50 : Démarrage mode simulation**
- Action : naviguer vers `/simulation`, cliquer Démarrer
- Vérifie : chronomètre 3h visible, décompte actif
- FAIL si : chrono absent ou ne démarre pas

**SC-51 : Enchaînement des 3 épreuves**
- Prérequis : SC-50
- Action : répondre rapidement à quelques questions de la première épreuve, soumettre
- Vérifie : passage automatique à l'épreuve suivante (QCM → Maths Spé → PC)
- FAIL si : blocage entre épreuves

**SC-52 : Pas d'indice en mode simulation**
- Prérequis : SC-50
- Vérifie : le bouton Indice est absent ou désactivé en mode simulation
- FAIL si : bouton Indice actif et fonctionnel

**SC-53 : Score final simulation**
- Prérequis : terminer (ou forcer la fin de) la simulation
- Vérifie : score total /120 affiché + note /20
- Vérifie : détail par épreuve (QCM /40, Maths Spé /40, PC /40)
- FAIL si : score absent ou calcul incohérent

### 3.7 Domaine `responsive` — 3 scénarios

Ces scénarios relancent SC-01 + SC-10 + SC-20 avec des viewports différents.

**SC-60 : iPad paysage (1024×768)**
- Viewport par défaut — vérifie qu'aucun contenu ne déborde horizontalement
- Vérifie : `document.documentElement.scrollWidth <= document.documentElement.clientWidth`

**SC-61 : iPad portrait (768×1024)**
- Même vérification de débordement + le canvas est toujours utilisable (largeur ≥ 300px)

**SC-62 : Mobile petit (375×667)**
- Vérifie : contenu accessible (pas de texte coupé). Le canvas peut être dégradé.
- WARN si : le canvas fait moins de 250px de large (inutilisable au stylet)

---

## 4. Injection de contenu manuscrit — Méthode technique

### 4.1 Principe

Le script ne simule pas des gestes stylet — il **charge une image PNG directement dans le canvas** via l'API JavaScript du composant.

Léo devra déterminer quelle librairie canvas est utilisée (fabric.js, tldraw, ou canvas natif) et adapter l'injection. Voici les 3 cas :

### 4.2 Si fabric.js

```javascript
// Exécuté via page.evaluate()
async function injectFixture(base64PNG) {
    return new Promise((resolve, reject) => {
        const canvasInstance = window.__fabricCanvas; // Léo doit exposer cette ref
        if (!canvasInstance) {
            reject('fabric canvas instance not found');
            return;
        }
        fabric.Image.fromURL('data:image/png;base64,' + base64PNG, (img) => {
            img.scaleToWidth(canvasInstance.width * 0.8);
            canvasInstance.add(img);
            canvasInstance.renderAll();
            resolve('OK');
        });
    });
}
```

### 4.3 Si tldraw

```javascript
// tldraw utilise une API de création de shapes
const editor = window.__tldrawEditor;
editor.createShape({
    type: 'image',
    props: {
        src: 'data:image/png;base64,' + base64PNG,
        w: 600, h: 400
    }
});
```

### 4.4 Si canvas natif (2D Context)

```javascript
const canvas = document.querySelector('[data-testid="canvas-container"] canvas');
const ctx = canvas.getContext('2d');
const img = new Image();
img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    resolve('OK');
};
img.src = 'data:image/png;base64,' + base64PNG;
```

### 4.5 Obligation pour Léo : exposer le handle canvas

Léo DOIT exposer une référence globale au canvas dans le composant React, de sorte que les tests E2E puissent y accéder. Convention :

```typescript
// Dans Canvas.tsx — ajouter en fin de useEffect d'initialisation :
if (process.env.NODE_ENV !== 'production' || window.__E2E_TEST_MODE) {
    window.__fabricCanvas = fabricCanvasRef.current;
    // ou window.__tldrawEditor = editorRef.current;
}
```

Alternativement, Léo peut exposer une **fonction utilitaire** sur `window` :

```typescript
window.__injectTestImage = async (base64: string): Promise<void> => {
    // Charge l'image dans le canvas quelle que soit la lib
};
window.__getCanvasExport = (): string => {
    // Retourne le canvas en base64 PNG
};
window.__clearCanvas = (): void => {
    // Efface le canvas
};
```

Cette approche est **préférée** car elle isole le test de l'implémentation interne du canvas.

### 4.6 Attente de la réponse LLM

Après injection + clic Valider, le script attend la réponse avec une stratégie à 3 niveaux :

```python
async def wait_for_correction(page, llm_timeout):
    """Attend la correction LLM avec gestion des états intermédiaires."""
    
    # Niveau 1 : vérifier qu'un loader/spinner apparaît (2s max)
    try:
        await page.wait_for_selector(
            '[data-testid="feedback-loading"]',
            timeout=2000
        )
        loading_visible = True
    except:
        loading_visible = False
    
    # Niveau 2 : attendre le feedback final
    try:
        await page.wait_for_selector(
            '[data-testid="feedback-block"]',
            timeout=llm_timeout
        )
        return "feedback_received"
    except:
        pass
    
    # Niveau 3 : chercher un message d'erreur
    error_el = await page.query_selector('[data-testid="feedback-error"]')
    if error_el:
        return "api_error"
    
    return "timeout"
```

---

## 5. Fixtures manuscrites — Génération

### 5.1 Option A — Photos réelles (recommandée)

JB écrit sur papier blanc les 4 réponses ci-dessous, photographie au téléphone, et crop chaque image en ~800×400 px. C'est la meilleure option car Gemini Vision sera confronté à du vrai manuscrit.

### 5.2 Option B — Génération Python (fallback)

Si JB n'a pas le temps, Léo génère des fixtures synthétiques avec le script `generate_fixtures.py`. Ces images utilisent une police manuscrite pour écrire les réponses en noir sur fond blanc.

```python
# generate_fixtures.py — logique principale
from PIL import Image, ImageDraw, ImageFont
import os

FIXTURES_DIR = os.path.dirname(os.path.abspath(__file__))
WIDTH, HEIGHT = 800, 400
BG_COLOR = (255, 255, 255)
TEXT_COLOR = (20, 20, 40)

# Police manuscrite — Léo doit en télécharger une libre de droits
# Ex: "Caveat" (Google Fonts, OFL license)
# wget -O caveat.ttf "https://fonts.google.com/download?family=Caveat" (extraire le .ttf)
FONT_PATH = os.path.join(FIXTURES_DIR, "caveat.ttf")
FONT_SIZE = 42

def create_fixture(text_lines, filename):
    """Crée une image fixture avec du texte manuscrit simulé."""
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
    except:
        font = ImageFont.load_default()
        print(f"WARN: police manuscrite non trouvée, utilisation de la police par défaut")
    
    y_offset = 30
    for line in text_lines:
        draw.text((40, y_offset), line, fill=TEXT_COLOR, font=font)
        y_offset += FONT_SIZE + 15
    
    filepath = os.path.join(FIXTURES_DIR, filename)
    img.save(filepath, "PNG")
    print(f"Fixture créée : {filepath}")

# --- Exercice de référence ---
# Question : "Calculer g'(x) sachant que g(x) = 2x³ + ln(x)"
# Réponse attendue : g'(x) = 6x² + 1/x

create_fixture(
    ["g'(x) = 6x² + 1/x"],
    "fixture_correct.png"
)

create_fixture(
    ["g'(x) = 6x² + 1", "(dérivée de ln(x) = 1 je crois)"],
    "fixture_partielle.png"
)

create_fixture(
    ["g'(x) = 2x² + x"],
    "fixture_fausse.png"
)

create_fixture(
    [],  # Image blanche
    "fixture_vide.png"
)
```

### 5.3 Correspondance exercice-fixture

Les fixtures SC-30/31/32/33 doivent être testées sur **un exercice précis** dont la réponse attendue est connue. Le script doit cibler un exercice par son ID dans la banque de questions.

Léo devra identifier un exercice rédigé de type dérivation (ou équivalent) dans la banque JSON et le cibler dans les scénarios. L'ID de cet exercice de référence sera configuré en constante dans `scenarios.py` :

```python
# scenarios.py
FIXTURE_EXERCISE_ID = "MATHS-SPE-2025-I"  # À adapter selon la banque réelle
FIXTURE_QUESTION_ID = "I-1"               # Sous-question ciblée
```

Si l'exercice n'existe pas en base, les scénarios SC-30 à SC-35 passent en SKIP avec un message explicite.

---

## 6. data-testid — Contrat frontend

Léo DOIT poser ces `data-testid` dans les composants React. C'est un prérequis pour que les tests fonctionnent. Si un `data-testid` est absent, le scénario FAIL avec le message "Sélecteur manquant — Léo doit ajouter data-testid=XXX dans le composant YYY".

### 6.1 Liste exhaustive

| data-testid | Composant attendu | Scénarios |
|---|---|---|
| `home-page` | Home.tsx — container principal | SC-01 |
| `welcome-message` | Home.tsx — "Bonjour Garance" | SC-02 |
| `global-progress` | Home.tsx ou ProgressBar.tsx | SC-02 |
| `daily-suggestion` | Home.tsx — suggestion du jour | SC-03 |
| `qcm-exercise-list` | QCM.tsx — liste des exercices | SC-10 |
| `qcm-option-{i}` | QCMGrid.tsx — case V/F individuelle | SC-11 |
| `timer` | Timer.tsx — chronomètre | SC-12, SC-50 |
| `submit-qcm` | QCM.tsx — bouton soumettre | SC-13 |
| `qcm-score` | QCM.tsx — affichage score | SC-13, SC-14 |
| `canvas-container` | Canvas.tsx — zone de dessin | SC-20, SC-60/61/62 |
| `tool-color` | Canvas.tsx — sélecteur couleur | SC-20 |
| `tool-eraser` | Canvas.tsx — gomme | SC-20 |
| `tool-undo` | Canvas.tsx — annuler | SC-22 |
| `tool-redo` | Canvas.tsx — refaire | SC-22 |
| `submit-answer` | Exercise.tsx — bouton Valider | SC-21, SC-30/31/32 |
| `feedback-loading` | Feedback.tsx — spinner/message d'attente | SC-34 |
| `feedback-block` | Feedback.tsx — bloc de correction complet | SC-30/31/32 |
| `feedback-correct` | Feedback.tsx — indicateur réponse correcte | SC-30 |
| `feedback-cours` | Feedback.tsx — rappel de cours | SC-31, SC-32 |
| `feedback-correction` | Feedback.tsx — correction détaillée | SC-31, SC-32 |
| `feedback-error` | Feedback.tsx — message d'erreur API | SC-34 |
| `hint-button` | Exercise.tsx — bouton Indice | SC-35, SC-52 |
| `hint-content` | Exercise.tsx — contenu de l'indice | SC-35 |
| `dashboard-page` | Dashboard.tsx — container | SC-40 |
| `matiere-{slug}` | Dashboard.tsx — section par matière | SC-40 |
| `chapter-level` | Dashboard.tsx — indicateur niveau chapitre | SC-41 |
| `revision-plan` | RevisionPlan.tsx — container plan | SC-43 |
| `simulation-start` | Simulation.tsx — bouton démarrer | SC-50 |
| `simulation-score` | Simulation.tsx — score final | SC-53 |

### 6.2 Convention de nommage

- Kebab-case : `data-testid="submit-qcm"` (pas camelCase, pas snake_case)
- Préfixe par domaine quand ambigu : `qcm-score`, `simulation-score`
- Suffixe `{i}` ou `{id}` pour les éléments répétés : `qcm-option-0`, `qcm-option-1`

---

## 7. Format du Compte-Rendu (CR)

### 7.1 Nom du fichier

```
CR_E2E_{DATE}_{HEURE}_{FILTRE}.md
```

Exemples : `CR_E2E_2026-04-16_1432_all.md`, `CR_E2E_2026-04-16_1508_tag-qcm.md`, `CR_E2E_2026-04-16_1515_rerun-fails.md`

### 7.2 Structure complète

```markdown
# CR Test E2E — PolytechRevision
Date : {DATE} {HEURE} | Durée : {DUREE_TOTALE}
Filtre : {FILTRE_UTILISE} ({NB_SCENARIOS} scénarios)
URL : {BASE_URL} | API : {API_URL}
Viewport : {VIEWPORT}

## Résumé

| Domaine        | Pass | Fail | Warn | Skip | Total |
|----------------|------|------|------|------|-------|
| accueil        | ...  | ...  | ...  | ...  | ...   |
| qcm            | ...  | ...  | ...  | ...  | ...   |
| manuscrit      | ...  | ...  | ...  | ...  | ...   |
| correction-llm | ...  | ...  | ...  | ...  | ...   |
| dashboard      | ...  | ...  | ...  | ...  | ...   |
| simulation     | ...  | ...  | ...  | ...  | ...   |
| responsive     | ...  | ...  | ...  | ...  | ...   |
| **TOTAL**      | **X**| **Y**| **Z**| **W**| **N** |

## Actions prioritaires pour Léo

1. **SC-XX** [{domaine}] — {description courte} → {fichier principal}
2. **SC-YY** [{domaine}] — {description courte} → {fichier principal}
3. ...

(Listées par ordre de gravité : FAIL d'abord, puis WARN)

---

## Détail — FAIL

### ❌ FAIL — SC-XX : {nom du scénario}
- **Tags** : {tags}
- **Durée** : {durée}
- **Symptôme** : {description précise de ce qui ne marche pas}
- **Screenshot** : `screenshots/SC-XX_fail.png`
- **Erreurs console JS** :
  ```
  {erreurs capturées}
  ```
- **Requêtes réseau échouées** :
  ```
  {méthode} {url} → {status} ({durée}ms)
  ```
- **Fichiers impliqués (probables)** :
  - `{chemin/fichier.ext}` — {raison}
  - `{chemin/fichier.ext}` — {raison}
- **Action suggérée** :
  1. {étape 1}
  2. {étape 2}
  3. {étape 3}

---

## Détail — WARN

### ⚠️ WARN — SC-XX : {nom du scénario}
(même structure que FAIL mais moins grave)

---

## Détail — SKIP

### ⏭️ SKIP — SC-XX : {nom du scénario}
- **Raison** : {pourquoi le test a été sauté}

---

## Scénarios PASS (résumé)

| ID | Nom | Durée | Screenshot |
|----|-----|-------|------------|
| SC-01 | Chargement accueil | 1.2s | `screenshots/SC-01_pass.png` |
| SC-02 | Message bienvenue | 0.8s | `screenshots/SC-02_pass.png` |
| ... | ... | ... | ... |
```

### 7.3 Fichier fails.json

En plus du CR Markdown, le script génère un `fails.json` utilisé par `--rerun-fails` :

```json
{
  "generated_at": "2026-04-16T14:32:00",
  "cr_file": "CR_E2E_2026-04-16_1432_all.md",
  "fails": ["SC-07", "SC-13", "SC-30"],
  "warns": ["SC-22", "SC-34"]
}
```

---

## 8. Workflow d'utilisation

### 8.1 Premier lancement (après implémentation du Run 3.1)

```bash
/usr/local/bin/python3.10 tests/e2e/polytech_e2e.py --all --verbose
```

Ce premier run sert de **baseline**. Le CR doit être lu par JB pour valider que les scénarios sont pertinents et que les SKIP correspondent à des features pas encore implémentées (et pas à des bugs).

### 8.2 Cycle de correction Léo

Quand Léo a un CR avec des FAIL :

1. **Léo lit le CR** — section "Actions prioritaires", puis détail des FAIL
2. **Pour chaque FAIL, Léo suit le cycle en 4 temps :**
   - **Diagnostic** : ouvrir les fichiers listés dans "Fichiers impliqués", reproduire le bug
   - **Correction** : modifier le code
   - **Test unitaire** : écrire un test ciblé (dans `tests/`) si pertinent
   - **Documentation** : mettre à jour CHANGELOG.md + DEVLOG.md
3. **Léo relance les tests ciblés** :
   ```bash
   /usr/local/bin/python3.10 tests/e2e/polytech_e2e.py --rerun-fails
   ```
4. **Si tout passe** : Léo relance `--all` pour vérifier qu'il n'a rien cassé (non-régression)
5. **Léo commit** avec le CR propre (tout vert) en pièce jointe

### 8.3 Utilisation ciblée pendant le dev

Pendant qu'il travaille sur un domaine spécifique :

```bash
/usr/local/bin/python3.10 tests/e2e/polytech_e2e.py --tag qcm
```

Ou un seul scénario problématique :

```bash
/usr/local/bin/python3.10 tests/e2e/polytech_e2e.py --sc SC-14 --verbose
```

---

## 9. Ce que Léo ne doit PAS faire

- ❌ Ne pas utiliser pytest, unittest, ou un framework de test — le script est standalone
- ❌ Ne pas installer Chromium — Firefox headless uniquement
- ❌ Ne pas lancer les tests en parallèle (un seul navigateur à la fois, RAM limitée)
- ❌ Ne pas hardcoder l'URL de l'app — toujours utiliser `--url`
- ❌ Ne pas supprimer les screenshots des runs précédents — les organiser par date
- ❌ Ne pas modifier `openclaw.json` — ce run ne touche pas à la config OpenClaw
- ❌ Ne pas stocker les fixtures dans le repo Git en base64 — ce sont des fichiers PNG binaires normaux

---

## 10. Livrables attendus

| # | Livrable | Chemin |
|---|----------|--------|
| 1 | Script principal E2E | `tests/e2e/polytech_e2e.py` |
| 2 | Catalogue scénarios | `tests/e2e/scenarios.py` |
| 3 | Générateur de fixtures | `tests/e2e/fixtures/generate_fixtures.py` |
| 4 | 4 fixtures PNG | `tests/e2e/fixtures/fixture_{correct,partielle,fausse,vide}.png` |
| 5 | data-testid posés | Modifications dans les composants React listés en section 6 |
| 6 | README tests E2E | `tests/e2e/README.md` |
| 7 | Premier CR baseline | `tests/e2e/reports/CR_E2E_{date}_all.md` |
| 8 | .gitignore mis à jour | Ajouter `tests/e2e/reports/`, `tests/e2e/screenshots/` |
| 9 | CHANGELOG.md | Entrée Run 3.1 |
| 10 | DEVLOG.md | Décisions prises, problèmes rencontrés |

---

## 11. Critères de succès Run 3.1

- [ ] `python3 tests/e2e/polytech_e2e.py --all` s'exécute sans crash du script lui-même
- [ ] Les 29 scénarios sont implémentés (même si certains FAIL — c'est normal au premier run)
- [ ] `--tag`, `--sc`, `--rerun-fails` fonctionnent correctement
- [ ] Le CR Markdown est lisible, structuré, et contient les screenshots
- [ ] Les data-testid sont posés dans tous les composants listés en section 6
- [ ] Les 4 fixtures PNG existent et sont chargées correctement dans le canvas
- [ ] Le premier CR baseline est généré et envoyé à JB via Telegram

---
