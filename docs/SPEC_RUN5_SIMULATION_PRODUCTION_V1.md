# SPEC_RUN5_SIMULATION_PRODUCTION_V1.md — Simulation complète + Mise en production

> **Run** : 5 — Simulation 3h fonctionnelle, mise en prod, exploitation
> **Objectif** : Garance peut faire un concours blanc complet de 3h, l'app tourne en production stable
> **Chemin projet** : `/root/.openclaw/workspace-coder/projects/polytech-revision/`

---

## 0. Pré-run

```bash
cd /root/.openclaw/workspace-coder/projects/polytech-revision
git tag -a run4-ok -m "Run 4 stable - dashboard + simulation skeleton + generation"
git push origin run4-ok
```

---

## 1. Simulation 3h — Intégration complète

### 1.1 Principe

La simulation reproduit les conditions du concours :
- 3 épreuves enchaînées : QCM (1h) → Maths Spé (1h) → PC (1h)
- Chronomètre global (3h) toujours visible
- Chronomètre par épreuve (1h) avec alerte à 5 min restantes
- **Pas d'indice** disponible
- **Pas de retour en arrière** entre épreuves (une fois le QCM terminé, on ne revient pas)
- Les exercices sont piochés aléatoirement parmi les annales + générés
- À la fin : note complète /120 et /20

### 1.2 Backend — Améliorer `GET /api/simulation/generer`

Le endpoint existant pioche des exercices mais ne structure pas assez. Nouveau format de retour :

```python
@router.get("/generer")
async def generer_simulation():
    all_q = load_all_questions()

    # QCM : piocher des exercices pour couvrir ~40 points
    qcm_pool = []
    for annale in all_q.get("maths_qcm", []):
        qcm_pool.extend(annale.get("exercices", []))
    random.shuffle(qcm_pool)
    # Prendre 8 exercices max (comme le vrai concours)
    qcm_selection = qcm_pool[:8]
    
    # Calculer le nombre total de questions QCM
    nb_qcm = sum(len(ex.get("questions", [])) for ex in qcm_selection)

    # Maths Spé : piocher 2-3 exercices
    mspe_pool = []
    for annale in all_q.get("maths_specialite", []):
        mspe_pool.extend(annale.get("exercices", []))
    random.shuffle(mspe_pool)
    mspe_selection = mspe_pool[:3]

    # PC : piocher 3 exercices
    pc_pool = []
    for annale in all_q.get("physique_chimie", []):
        pc_pool.extend(annale.get("exercices", []))
    random.shuffle(pc_pool)
    pc_selection = pc_pool[:3]

    return {
        "id": f"SIM-{int(time.time())}",
        "duree_totale_sec": 10800,
        "epreuves": [
            {
                "ordre": 1,
                "matiere": "maths_qcm",
                "label": "Mathématiques — QCM",
                "duree_sec": 3600,
                "points_total": 40,
                "nb_questions": nb_qcm,
                "exercices": qcm_selection,
                "type_correction": "auto"
            },
            {
                "ordre": 2,
                "matiere": "maths_specialite",
                "label": "Mathématiques — Spécialité",
                "duree_sec": 3600,
                "points_total": 40,
                "exercices": mspe_selection,
                "type_correction": "mixte"
            },
            {
                "ordre": 3,
                "matiere": "physique_chimie",
                "label": "Physique-Chimie",
                "duree_sec": 3600,
                "points_total": 40,
                "exercices": pc_selection,
                "type_correction": "mixte"
            }
        ],
        "regles": {
            "calculatrice": False,
            "documents": False,
            "indices": False,
            "retour_arriere": False
        }
    }
```

### 1.3 Backend — Scoring complet de simulation

Ajouter dans `routers/simulation.py` :

```python
class EpreuveResult(BaseModel):
    matiere: str
    score: float
    max_score: float
    details: list  # liste des résultats par question

class SimulationCompleteResult(BaseModel):
    simulation_id: str
    duree_totale_sec: int
    epreuves: list[EpreuveResult]

@router.post("/terminer")
async def terminer_simulation(result: SimulationCompleteResult):
    """Enregistre les résultats complets d'une simulation."""
    scores = {}
    for ep in result.epreuves:
        scores[ep.matiere] = ep.score
    
    score_qcm = scores.get("maths_qcm", 0)
    score_mspe = scores.get("maths_specialite", 0)
    score_pc = scores.get("physique_chimie", 0)
    total = score_qcm + score_mspe + score_pc
    note_20 = round(total * 20 / 120, 2)

    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute(
            """INSERT INTO simulations 
               (utilisateur_id, duree_totale_sec, score_qcm, score_maths_spe, 
                score_pc, score_total, note_sur_20)
               VALUES (1, ?, ?, ?, ?, ?, ?)""",
            (result.duree_totale_sec, score_qcm, score_mspe, score_pc, total, note_20)
        )
        
        # Aussi enregistrer chaque résultat individuel
        for ep in result.epreuves:
            for detail in ep.details:
                await db.execute(
                    """INSERT INTO resultats 
                       (utilisateur_id, question_id, matiere, chapitre,
                        reponse_donnee, est_correct, score_obtenu, score_max,
                        indice_utilise, temps_reponse_sec)
                       VALUES (1, ?, ?, ?, ?, ?, ?, ?, 0, ?)""",
                    (detail.get("question_id", ""),
                     ep.matiere,
                     detail.get("chapitre", ""),
                     detail.get("reponse", ""),
                     detail.get("est_correct", 0),
                     detail.get("score", 0),
                     detail.get("max_score", 0),
                     detail.get("temps_sec", 0))
                )
        
        await db.commit()

    return {
        "status": "ok",
        "score_qcm": score_qcm,
        "score_maths_spe": score_mspe,
        "score_pc": score_pc,
        "total_120": total,
        "note_sur_20": note_20
    }
```

### 1.4 Frontend — Simulation complète

Refonte de `Simulation.tsx`. La page gère un state machine :

```
intro → epreuve_qcm → transition → epreuve_mspe → transition → epreuve_pc → results
```

```tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// Importer les composants existants
// QCMExercice : affiche un exercice QCM V/F (réutilise la logique de QCM.tsx)
// ExerciceRedigeInline : affiche un exercice rédigé (réutilise ExerciceRedige sans navigation)

type Phase = 'intro' | 'epreuve' | 'transition' | 'results'

interface SimState {
  phase: Phase
  epreuveIndex: number       // 0, 1, 2
  exerciceIndex: number      // dans l'épreuve courante
  questionIndex: number      // dans l'exercice courant (pour les rédigés)
  globalTimer: number        // secondes restantes sur 3h
  epreuveTimer: number       // secondes restantes sur 1h
  scores: {
    maths_qcm: { score: number, max: number, details: any[] }
    maths_specialite: { score: number, max: number, details: any[] }
    physique_chimie: { score: number, max: number, details: any[] }
  }
}
```

**Comportement détaillé :**

**Phase `intro`** : identique au Run 4 (règles + bouton "Commencer").

**Phase `epreuve`** : 
- Header fixe avec : nom de l'épreuve, chrono global (HH:MM:SS), chrono épreuve (MM:SS), numéro exercice
- Si l'épreuve courante est "maths_qcm" → afficher les exercices QCM V/F un par un
- Si l'épreuve est "maths_specialite" ou "physique_chimie" → afficher les exercices rédigés (contexte + questions)
- Bouton "Exercice suivant" quand toutes les questions d'un exercice sont répondues
- Bouton "Terminer l'épreuve" visible en permanence (on peut finir avant 1h)
- **Pas de bouton Indice** (masqué en mode simulation)

**Phase `transition`** (entre deux épreuves) :
```
┌───────────────────────────────────────┐
│  ✅ Épreuve QCM terminée              │
│  Score provisoire : 28/40             │
│                                       │
│  Prochaine épreuve :                  │
│  📐 Mathématiques Spécialité (1h)     │
│                                       │
│  Temps global restant : 2:12:34       │
│                                       │
│  [Commencer l'épreuve suivante]       │
└───────────────────────────────────────┘
```

**Phase `results`** :
```
┌───────────────────────────────────────┐
│  🏁 Simulation terminée !             │
│                                       │
│       14.2 / 20                       │
│                                       │
│  QCM :        28 / 40                 │
│  Maths Spé :  24 / 40                 │
│  PC :         33 / 40                 │
│  ─────────────────────                │
│  Total :      85 / 120               │
│                                       │
│  Temps utilisé : 2h47min              │
│                                       │
│  [📊 Voir le détail]                  │
│  [📈 Tableau de bord]                 │
└───────────────────────────────────────┘
```

**Scoring QCM en simulation** : identique au mode révision (points négatifs, plancher 0/exercice). La correction est immédiate et locale.

**Scoring exercices rédigés en simulation** : les réponses manuscrites sont stockées et envoyées à Gemini APRÈS la fin de la simulation (pas pendant, pour ne pas casser le flux). Pendant la simulation, le score rédigé est estimé à 0 et corrigé a posteriori. Le détail apparaît sur la page résultat une fois que Gemini a tout traité.

Alternative plus simple (recommandée pour le MVP) : ne scorer que les QCM intégrés aux exercices (type `qcm_single` / `qcm_multi`) en temps réel, et pour les champs manuscrits, les collecter et les envoyer en batch à Gemini à la fin. Garance voit d'abord son score QCM, puis le score manuscrit arrive progressivement.

### 1.5 Chronomètre avec alertes

```tsx
function SimTimer({ globalSec, epreuveSec }: { globalSec: number, epreuveSec: number }) {
  const formatHMS = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0')
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${h}:${m}:${sec}`
  }
  const formatMS = (s: number) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${m}:${sec}`
  }

  const epreuveUrgent = epreuveSec <= 300  // 5 min restantes
  const globalUrgent = globalSec <= 600    // 10 min restantes

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <div style={{
        fontFamily: 'monospace', fontSize: '1.1rem',
        color: epreuveUrgent ? 'var(--accent-red)' : 'white',
        animation: epreuveUrgent ? 'pulse 1s infinite' : 'none'
      }}>
        Épreuve : {formatMS(epreuveSec)}
      </div>
      <div style={{
        fontFamily: 'monospace', fontSize: '0.9rem',
        color: globalUrgent ? '#FCA5A5' : 'rgba(255,255,255,0.7)'
      }}>
        Global : {formatHMS(globalSec)}
      </div>
    </div>
  )
}
```

CSS pour l'animation d'alerte (ajouter dans `index.css`) :
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## 2. Mise en production

### 2.1 Systemd services

Le backend et le frontend doivent tourner en permanence, pas seulement en mode dev.

**Backend** — Créer `/etc/systemd/system/polytech-backend.service` :

```ini
[Unit]
Description=PolytechRevision Backend (FastAPI)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/.openclaw/workspace-coder/projects/polytech-revision/backend
EnvironmentFile=/root/.openclaw/.env
ExecStart=/usr/local/bin/python3.10 -m uvicorn main:app --host 127.0.0.1 --port 8042
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**Frontend** — Build statique + servir via Caddy (pas de `npm run dev` en prod).

```bash
cd /root/.openclaw/workspace-coder/projects/polytech-revision/frontend
npm run build
# Produit un dossier dist/ avec les fichiers statiques
```

### 2.2 Caddy reverse proxy (HTTPS automatique)

Installer Caddy :
```bash
apt-get install -y caddy
```

Créer `/etc/caddy/Caddyfile` :

```
# Si on a un nom de domaine :
# polytech.example.com {
#     reverse_proxy /api/* localhost:8042
#     root * /root/.openclaw/workspace-coder/projects/polytech-revision/frontend/dist
#     file_server
#     try_files {path} /index.html
# }

# Sans nom de domaine (accès par IP) :
:80 {
    reverse_proxy /api/* localhost:8042
    root * /root/.openclaw/workspace-coder/projects/polytech-revision/frontend/dist
    file_server
    try_files {path} /index.html
}
```

Activer :
```bash
systemctl enable caddy
systemctl start caddy
systemctl enable polytech-backend
systemctl start polytech-backend
```

Garance accède à `http://195.154.114.204/` (port 80, pas 5173).

### 2.3 Build frontend pour production

Modifier `frontend/vite.config.ts` pour la prod :

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8042',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
```

Note : en production, le proxy Vite n'est pas utilisé — c'est Caddy qui fait le routing `/api/*` → backend.

Le backend doit donc écouter sur `/api/*` directement. Vérifier que les routers sont bien montés avec `prefix="/api"` dans `main.py`.

---

## 3. Exploitation

### 3.1 Créer `scripts/backup.sh`

```bash
#!/bin/bash
# Backup de la BDD et des images de réponses
PROJ="/root/.openclaw/workspace-coder/projects/polytech-revision"
BACKUP_DIR="/root/backups/polytech-revision"
DATE=$(date +%Y%m%d-%H%M)

mkdir -p $BACKUP_DIR

# BDD SQLite
cp $PROJ/backend/data/polytech.db $BACKUP_DIR/polytech-$DATE.db

# Images des réponses manuscrites
if [ -d "$PROJ/backend/data/reponses_images" ]; then
  tar czf $BACKUP_DIR/reponses-$DATE.tar.gz -C $PROJ/backend/data reponses_images/
fi

# Garder les 10 derniers backups
ls -t $BACKUP_DIR/polytech-*.db | tail -n +11 | xargs rm -f 2>/dev/null
ls -t $BACKUP_DIR/reponses-*.tar.gz | tail -n +11 | xargs rm -f 2>/dev/null

echo "Backup OK: $BACKUP_DIR/polytech-$DATE.db"
```

Rendre exécutable et programmer :
```bash
chmod +x scripts/backup.sh
crontab -e
# Ajouter : 0 */6 * * * /root/.openclaw/workspace-coder/projects/polytech-revision/scripts/backup.sh
```

### 3.2 Créer `scripts/restart.sh`

```bash
#!/bin/bash
# Restart propre des services
echo "Restarting backend..."
systemctl restart polytech-backend
sleep 3
curl -s http://localhost:8042/api/health | python3 -c "import sys,json; d=json.load(sys.stdin); print('Backend:', d.get('status','FAIL'))"

echo "Rebuilding frontend..."
cd /root/.openclaw/workspace-coder/projects/polytech-revision/frontend
npm run build
systemctl restart caddy
sleep 2
echo "Frontend: OK (Caddy restarted)"
```

### 3.3 Créer `scripts/rollback.sh`

```bash
#!/bin/bash
# Rollback vers un tag Git stable
TAG=${1:-"run4-ok"}
PROJ="/root/.openclaw/workspace-coder/projects/polytech-revision"

echo "=== ROLLBACK vers $TAG ==="

# 1. Backup de sécurité
$PROJ/scripts/backup.sh

# 2. Git rollback
cd $PROJ
git stash
git checkout $TAG

# 3. Réinstaller les dépendances
cd backend
/usr/local/bin/python3.10 -m pip install -r requirements.txt

cd ../frontend
npm install
npm run build

# 4. Restart
systemctl restart polytech-backend
systemctl restart caddy

sleep 3
echo "=== ROLLBACK TERMINÉ ==="
curl -s http://localhost:8042/api/health
```

Usage : `./scripts/rollback.sh run3-ok`

### 3.4 Créer `scripts/status.sh`

```bash
#!/bin/bash
# Status rapide de l'application
echo "=== PolytechRevision Status ==="
echo ""

echo "Backend:"
systemctl is-active polytech-backend 2>/dev/null || echo "  Service non configuré"
curl -s http://localhost:8042/api/health 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print('  Health:', d.get('status','FAIL'))" 2>/dev/null || echo "  UNREACHABLE"

echo ""
echo "Caddy:"
systemctl is-active caddy 2>/dev/null || echo "  Service non configuré"
curl -s -o /dev/null -w "  HTTP %{http_code}" http://localhost:80/ 2>/dev/null
echo ""

echo ""
echo "BDD:"
ls -lh /root/.openclaw/workspace-coder/projects/polytech-revision/backend/data/polytech.db 2>/dev/null || echo "  PAS DE BDD"

echo ""
echo "Disk:"
df -h / | tail -1

echo ""
echo "RAM:"
free -h | head -2

echo ""
echo "Last backup:"
ls -t /root/backups/polytech-revision/polytech-*.db 2>/dev/null | head -1 || echo "  Aucun backup"
```

---

## 4. Polish UX

### 4.1 Responsive tablette

Ajouter dans `index.css` :

```css
/* Tablette paysage */
@media (min-width: 768px) and (max-width: 1366px) {
  body {
    font-size: 16px;
  }
  
  /* Empêcher le zoom sur double-tap */
  * {
    touch-action: manipulation;
  }
  
  /* Canvas : prendre toute la largeur */
  canvas {
    max-width: 100% !important;
  }
}

/* Tablette portrait — déconseillé mais supporté */
@media (max-width: 767px) {
  body {
    font-size: 14px;
  }
}

/* Empêcher le pull-to-refresh pendant le dessin */
html, body {
  overscroll-behavior: none;
}
```

### 4.2 Message d'accueil dynamique

Dans `Home.tsx`, adapter le message selon l'heure et la progression :

```typescript
function getMessage(jours: number, progression: number): string {
  if (jours <= 2) return "Dernier sprint Garance ! Tu es prête."
  if (jours <= 7) return "La dernière ligne droite ! Chaque exercice compte."
  if (progression > 0.7) return "Tu avances super bien ! Continue comme ça."
  if (progression > 0.3) return "Bon rythme ! Les bases sont là."
  return "C'est parti ! Un pas après l'autre."
}
```

### 4.3 Favicon et meta

Dans `frontend/index.html` :
```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <title>PolytechRevision — Garance</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎓</text></svg>">
  <link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet">
</head>
```

`maximum-scale=1.0, user-scalable=no` empêche le zoom parasite sur tablette pendant le dessin.

---

## 5. Complétion du contenu

### 5.1 Vérifier tous les exercices

Léo doit parcourir chaque exercice et vérifier :

| Fichier | Vérification |
|---------|-------------|
| `qcm_2024.json` | Toutes les questions ont `enonce_commun` si nécessaire |
| `qcm_2025.json` | Idem |
| `qcm_genere_probas.json` | Les 5 exercices générés sont jouables |
| `maths_spe_2024.json` | Format enhanced (contexte + questions typées) |
| `maths_spe_2025.json` | Idem |
| `pc_2024.json` | Format enhanced + crops de schémas fonctionnels |
| `pc_2025.json` | Idem — exercice Catapulte = pilote |

### 5.2 Convertir les exercices 2024 au format enhanced

Si pas encore fait, Léo convertit `maths_spe_2024.json` et `pc_2024.json` au nouveau format (contexte + questions typées). Il suit le modèle de PC2025-I (Catapulte) fourni dans `ENHANCE_EXERCICES.md`.

---

## 6. Tests de validation Run 5

| # | Test | Attendu |
|---|------|---------|
| 1 | Lancer une simulation | Page intro → clic → QCM démarre |
| 2 | QCM en simulation | Exercices QCM V/F s'enchaînent, PAS d'indice |
| 3 | Chrono épreuve | Décompte depuis 60:00, alerte rouge à 5:00 |
| 4 | Chrono global | Décompte depuis 3:00:00 en permanence |
| 5 | Terminer QCM | Transition avec score provisoire, bouton épreuve suivante |
| 6 | Épreuve Maths Spé | Exercices rédigés avec contexte + questions |
| 7 | Épreuve PC | Idem avec schémas croppés |
| 8 | Fin simulation | Page résultats avec note /20 + détail par épreuve |
| 9 | Score en BDD | `GET /api/dashboard/garance` montre la simulation |
| 10 | Accès production | `http://195.154.114.204/` → app (pas port 5173) |
| 11 | Backend service | `systemctl status polytech-backend` → active |
| 12 | Restart | `./scripts/restart.sh` → tout revient |
| 13 | Backup | `./scripts/backup.sh` → fichier dans /root/backups/ |
| 14 | Tablette | iPad/Android paysage → layout correct, dessin fluide |

---

## 7. Git

```bash
git add .
git commit -m "Run 5: complete 3h simulation, production setup (systemd+Caddy), exploitation scripts"
git push origin main
git tag -a run5-ok -m "Run 5 - MVP COMPLET"
git push origin run5-ok
```

DEVLOG.md et CHANGELOG.md à jour.

---

## 8. Checklist MVP final

Avant de donner l'app à Garance, vérifier :

- [ ] QCM jouable avec V/F, scoring points négatifs, explications
- [ ] Exercices rédigés avec contexte, schémas, mix QCM/manuscrit
- [ ] Correction manuscrite par Gemini fonctionnelle
- [ ] Plan de révision 5 jours affiché
- [ ] Dashboard avec note /20 estimée + barres de progression
- [ ] Analyse IA personnalisée
- [ ] Simulation 3h de bout en bout
- [ ] Au moins 60 questions QCM disponibles (annales + générés)
- [ ] Au moins 6 exercices rédigés (3 Maths Spé + 3 PC)
- [ ] App accessible sur tablette via IP (pas de port bizarre)
- [ ] Backup automatique toutes les 6h
- [ ] Script de rollback fonctionnel
- [ ] README à jour avec instructions complètes

---

## 9. Rappels Léo

- Chemin : `/root/.openclaw/workspace-coder/projects/polytech-revision/`
- Modèle Gemini : `gemini-3-flash-preview`
- Clé API : dans `/root/.openclaw/.env` (variable `GEMINI_API_KEY`)
- Python : `/usr/local/bin/python3.10`
- Le build frontend (`npm run build`) produit des fichiers statiques dans `dist/`
- Caddy sert les fichiers statiques ET proxy `/api/*` vers le backend
- **NE PAS** utiliser `npm run dev` en production
- `systemctl daemon-reload` après avoir créé les fichiers service
- Tester le rollback au moins une fois : `./scripts/rollback.sh run4-ok` puis revenir
- Rollback courant : `git checkout run4-ok`
