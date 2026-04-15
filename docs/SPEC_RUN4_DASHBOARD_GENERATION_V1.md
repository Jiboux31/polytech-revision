# SPEC_RUN4_DASHBOARD_GENERATION_V1.md — Dashboard avancé + Génération IA + Simulation

> **Run** : 4 — Dashboard de progression, génération d'exercices par IA, mode simulation 3h
> **Objectif** : Garance voit sa progression détaillée, reçoit des exercices générés par IA sur ses points faibles, et peut faire des simulations chronométrées en conditions réelles
> **Pré-requis** : Runs 0-3 + hotfixes appliqués
> **Chemin projet** : `/root/.openclaw/workspace-coder/projects/polytech-revision/`

---

## 0. Pré-run

```bash
cd /root/.openclaw/workspace-coder/projects/polytech-revision
git tag -a run3-ok -m "Run 3 stable - canvas + OCR + LLM correction"
git push origin run3-ok
```

---

## 1. Dashboard avancé

### 1.1 Backend — Endpoint d'analyse

Créer `backend/routers/dashboard.py` :

```python
from fastapi import APIRouter
import aiosqlite
from config import settings

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/garance")
async def dashboard_complet():
    """Retourne toutes les données du tableau de bord."""
    async with aiosqlite.connect(settings.DB_PATH) as db:
        db.row_factory = aiosqlite.Row

        # 1. Progression par chapitre
        cursor = await db.execute(
            "SELECT * FROM progression WHERE utilisateur_id = 1 ORDER BY matiere, chapitre"
        )
        progression = [dict(r) for r in await cursor.fetchall()]

        # 2. Stats par matière
        cursor = await db.execute("""
            SELECT matiere,
                   COUNT(*) as nb_total,
                   SUM(CASE WHEN est_correct = 2 THEN 1 ELSE 0 END) as nb_correct,
                   SUM(CASE WHEN est_correct = 1 THEN 1 ELSE 0 END) as nb_partiel,
                   SUM(CASE WHEN est_correct = 0 THEN 1 ELSE 0 END) as nb_incorrect,
                   ROUND(AVG(score_obtenu), 2) as score_moyen,
                   SUM(score_obtenu) as score_total,
                   SUM(score_max) as score_max_total
            FROM resultats WHERE utilisateur_id = 1
            GROUP BY matiere
        """)
        stats_matiere = [dict(r) for r in await cursor.fetchall()]

        # 3. Historique récent (dernières 20 réponses)
        cursor = await db.execute("""
            SELECT question_id, matiere, chapitre, est_correct,
                   score_obtenu, score_max, date_reponse, indice_utilise
            FROM resultats WHERE utilisateur_id = 1
            ORDER BY date_reponse DESC LIMIT 20
        """)
        historique = [dict(r) for r in await cursor.fetchall()]

        # 4. Chapitres faibles (score < 50% avec au moins 2 questions faites)
        cursor = await db.execute("""
            SELECT matiere, chapitre, score_moyen, nb_questions_faites, niveau
            FROM progression
            WHERE utilisateur_id = 1 AND nb_questions_faites >= 2 AND score_moyen < 0.5
            ORDER BY score_moyen ASC
        """)
        points_faibles = [dict(r) for r in await cursor.fetchall()]

        # 5. Simulations passées
        cursor = await db.execute(
            "SELECT * FROM simulations WHERE utilisateur_id = 1 ORDER BY date_simulation DESC"
        )
        simulations = [dict(r) for r in await cursor.fetchall()]

        # 6. Stats globales
        cursor = await db.execute("""
            SELECT COUNT(DISTINCT chapitre) as chapitres_travailles,
                   COUNT(*) as total_questions,
                   SUM(CASE WHEN est_correct = 2 THEN 1 ELSE 0 END) as total_correct,
                   SUM(indice_utilise) as total_indices,
                   SUM(temps_reponse_sec) as temps_total_sec
            FROM resultats WHERE utilisateur_id = 1
        """)
        row = await cursor.fetchone()
        stats_globales = dict(row) if row else {}

    # 7. Note Polytech estimée
    note_estimee = None
    scores = {s["matiere"]: s for s in stats_matiere}
    if scores:
        qcm = scores.get("maths_qcm", {})
        mspe = scores.get("maths_specialite", {})
        pc = scores.get("physique_chimie", {})

        score_qcm = qcm.get("score_total", 0) or 0
        max_qcm = qcm.get("score_max_total", 1) or 1
        score_mspe = mspe.get("score_total", 0) or 0
        max_mspe = mspe.get("score_max_total", 1) or 1
        score_pc = pc.get("score_total", 0) or 0
        max_pc = pc.get("score_max_total", 1) or 1

        # Ramener chaque matière sur 40
        note_qcm_40 = round((score_qcm / max_qcm) * 40, 1) if max_qcm else 0
        note_mspe_40 = round((score_mspe / max_mspe) * 40, 1) if max_mspe else 0
        note_pc_40 = round((score_pc / max_pc) * 40, 1) if max_pc else 0
        total_120 = note_qcm_40 + note_mspe_40 + note_pc_40
        note_20 = round(total_120 * 20 / 120, 1)

        note_estimee = {
            "qcm_sur_40": note_qcm_40,
            "maths_spe_sur_40": note_mspe_40,
            "pc_sur_40": note_pc_40,
            "total_sur_120": total_120,
            "note_sur_20": note_20
        }

    return {
        "progression": progression,
        "stats_par_matiere": stats_matiere,
        "historique_recent": historique,
        "points_faibles": points_faibles,
        "simulations": simulations,
        "stats_globales": stats_globales,
        "note_estimee": note_estimee,
        "jours_restants": _jours_restants()
    }

def _jours_restants():
    from datetime import date
    concours = date(2026, 4, 28)
    today = date.today()
    delta = (concours - today).days
    return max(0, delta)


@router.get("/analyse")
async def analyse_ia():
    """Génère une analyse personnalisée via Gemini."""
    from services.llm_service import call_gemini_text
    
    # Récupérer les données
    async with aiosqlite.connect(settings.DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("""
            SELECT matiere, chapitre, niveau, score_moyen, nb_questions_faites
            FROM progression WHERE utilisateur_id = 1
        """)
        progression = [dict(r) for r in await cursor.fetchall()]

    if not progression:
        return {"analyse": "Tu n'as pas encore commencé les révisions ! Lance un premier QCM pour que je puisse t'analyser."}

    prompt = f"""Tu es un coach de révision bienveillant pour Garance, élève de Terminale qui prépare le concours Geipi Polytech (le 28 avril 2026).

Voici sa progression actuelle :
{progression}

Rédige une analyse courte (5-8 lignes) qui :
1. Valorise ce qui est acquis
2. Identifie les 2-3 points faibles prioritaires
3. Donne un conseil concret pour les prochains jours
4. Reste encourageant et motivant

Tutoie Garance. Sois précis sur les chapitres. Pas de liste à puces, écris en paragraphes."""

    try:
        result = await call_gemini_text(prompt)
        return {"analyse": result}
    except Exception as e:
        return {"analyse": f"Analyse indisponible pour le moment. Continue tes révisions !"}
```

### 1.2 Backend — Ajouter `call_gemini_text` dans `llm_service.py`

Ajouter cette fonction :

```python
async def call_gemini_text(prompt: str, model: str = None) -> str:
    """Appelle Gemini avec un prompt texte uniquement (pas d'image)."""
    model = model or settings.GEMINI_MODEL_FAST
    url = f"{settings.GEMINI_API_URL}/{model}:generateContent?key={settings.GEMINI_API_KEY}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1024
        }
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError):
        return ""
```

### 1.3 Mettre à jour `main.py`

```python
from routers import exercices, correction, correction_redige, progression, dashboard

app.include_router(dashboard.router, prefix="/api")
```

### 1.4 Frontend — Page Dashboard enrichie

Remplacer `frontend/src/pages/Dashboard.tsx` par une version complète :

```tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface DashboardData {
  progression: any[]
  stats_par_matiere: any[]
  historique_recent: any[]
  points_faibles: any[]
  simulations: any[]
  stats_globales: any
  note_estimee: any
  jours_restants: number
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [analyse, setAnalyse] = useState<string>('')
  const [loadingAnalyse, setLoadingAnalyse] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/dashboard/garance').then(r => r.json()).then(setData)
  }, [])

  const handleAnalyse = async () => {
    setLoadingAnalyse(true)
    const res = await fetch('/api/dashboard/analyse')
    const json = await res.json()
    setAnalyse(json.analyse)
    setLoadingAnalyse(false)
  }

  if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>

  const { stats_globales, note_estimee, jours_restants, points_faibles, progression } = data

  // Grouper la progression par matière
  const matieres: Record<string, any[]> = {}
  for (const p of progression) {
    if (!matieres[p.matiere]) matieres[p.matiere] = []
    matieres[p.matiere].push(p)
  }

  const niveauColor: Record<string, string> = {
    non_vu: 'var(--level-non-vu)',
    en_cours: 'var(--level-en-cours)',
    fragile: 'var(--level-fragile)',
    acquis: 'var(--level-acquis)',
    maitrise: 'var(--level-maitrise)'
  }

  const niveauLabel: Record<string, string> = {
    non_vu: 'Non vu',
    en_cours: 'En cours',
    fragile: 'Fragile',
    acquis: 'Acquis',
    maitrise: 'Maîtrisé'
  }

  const matiereLabel: Record<string, string> = {
    maths_qcm: 'Maths QCM',
    maths_specialite: 'Maths Spécialité',
    physique_chimie: 'Physique-Chimie'
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Tableau de bord</h1>
        <div style={{
          background: jours_restants <= 7 ? 'var(--accent-red)' : 'var(--accent-blue)',
          color: 'white', padding: '8px 16px', borderRadius: 'var(--radius)', fontWeight: 700
        }}>
          J-{jours_restants}
        </div>
      </div>

      {/* Résumé en cartes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Questions faites" value={stats_globales.total_questions || 0} icon="📝" />
        <StatCard label="Réponses correctes" value={stats_globales.total_correct || 0} icon="✅" />
        <StatCard label="Chapitres travaillés" value={stats_globales.chapitres_travailles || 0} icon="📚" />
        <StatCard label="Temps total" value={formatTime(stats_globales.temps_total_sec || 0)} icon="⏱️" />
      </div>

      {/* Note Polytech estimée */}
      {note_estimee && (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
          padding: 20, marginBottom: 24
        }}>
          <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>📊 Note Polytech estimée</h3>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <NoteBar label="QCM" value={note_estimee.qcm_sur_40} max={40} />
            <NoteBar label="Maths Spé" value={note_estimee.maths_spe_sur_40} max={40} />
            <NoteBar label="PC" value={note_estimee.pc_sur_40} max={40} />
            <div style={{
              fontSize: '2rem', fontWeight: 700, marginLeft: 'auto',
              color: note_estimee.note_sur_20 >= 12 ? 'var(--accent-green)' : note_estimee.note_sur_20 >= 8 ? 'var(--accent-orange)' : 'var(--accent-red)'
            }}>
              {note_estimee.note_sur_20}/20
            </div>
          </div>
        </div>
      )}

      {/* Points faibles */}
      {points_faibles.length > 0 && (
        <div style={{
          background: 'var(--partial-bg)', border: '1px solid var(--partial-border)',
          borderRadius: 'var(--radius)', padding: 20, marginBottom: 24
        }}>
          <h3 style={{ marginTop: 0, color: '#92400E' }}>⚠️ Chapitres à renforcer</h3>
          {points_faibles.map((pf: any) => (
            <div key={pf.chapitre} style={{ marginBottom: 8 }}>
              <strong>{matiereLabel[pf.matiere] || pf.matiere}</strong> — {pf.chapitre.replace(/_/g, ' ')}
              <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
                ({Math.round(pf.score_moyen * 100)}% sur {pf.nb_questions_faites} questions)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Progression par matière */}
      {Object.entries(matieres).map(([matiere, chapitres]) => (
        <div key={matiere} style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
          padding: 20, marginBottom: 16
        }}>
          <h3 style={{ marginTop: 0 }}>{matiereLabel[matiere] || matiere}</h3>
          {chapitres.map((ch: any) => (
            <div key={ch.chapitre} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ flex: '0 0 180px', fontSize: '0.9rem' }}>{ch.chapitre.replace(/_/g, ' ')}</span>
              <div style={{ flex: 1, height: 12, background: '#E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.round(ch.score_moyen * 100)}%`,
                  height: '100%', background: niveauColor[ch.niveau] || '#ccc',
                  borderRadius: 6, transition: 'width 0.5s ease'
                }} />
              </div>
              <span style={{
                fontSize: '0.8rem', padding: '2px 8px', borderRadius: 4,
                background: niveauColor[ch.niveau] || '#ccc', color: ch.niveau === 'maitrise' ? 'white' : 'var(--text-primary)',
                fontWeight: 600, whiteSpace: 'nowrap'
              }}>
                {niveauLabel[ch.niveau] || ch.niveau}
              </span>
            </div>
          ))}
        </div>
      ))}

      {/* Analyse IA */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
        padding: 20, marginBottom: 24
      }}>
        <h3 style={{ marginTop: 0 }}>🤖 Analyse personnalisée</h3>
        {analyse ? (
          <p style={{ lineHeight: 1.7, color: 'var(--text-primary)' }}>{analyse}</p>
        ) : (
          <button onClick={handleAnalyse} disabled={loadingAnalyse} style={{
            padding: '12px 24px', borderRadius: 'var(--radius)', border: '1px solid var(--accent-blue)',
            background: 'white', color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer'
          }}>
            {loadingAnalyse ? '🔍 Analyse en cours...' : '📊 Générer mon analyse'}
          </button>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => navigate('/plan')} style={navBtnStyle}>← Plan de révision</button>
        <button onClick={() => navigate('/simulation')} style={{ ...navBtnStyle, background: 'var(--accent-blue)', color: 'white', border: 'none' }}>
          🏁 Lancer une simulation
        </button>
      </div>
    </div>
  )
}

// === Composants internes ===

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: string }) {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
      padding: 16, textAlign: 'center'
    }}>
      <div style={{ fontSize: '1.5rem' }}>{icon}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  )
}

function NoteBar({ label, value, max }: { label: string, value: number, max: number }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div style={{ minWidth: 150 }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 10, background: '#E5E7EB', borderRadius: 5 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-blue)', borderRadius: 5 }} />
        </div>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{value}/{max}</span>
      </div>
    </div>
  )
}

function formatTime(sec: number): string {
  if (sec < 60) return `${sec}s`
  if (sec < 3600) return `${Math.floor(sec / 60)}min`
  return `${Math.floor(sec / 3600)}h${Math.floor((sec % 3600) / 60)}min`
}

const navBtnStyle: React.CSSProperties = {
  padding: '14px 24px', borderRadius: 'var(--radius)', border: '1px solid #D1D5DB',
  background: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '1rem'
}
```

---

## 2. Mode simulation 3h

### 2.1 Backend — Endpoints simulation

Créer `backend/routers/simulation.py` :

```python
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import aiosqlite
from config import settings
from services.questions_service import load_all_questions
import random

router = APIRouter(prefix="/simulation", tags=["simulation"])

@router.get("/generer")
async def generer_simulation():
    """Génère une simulation complète de 3h : QCM + 2 spécialités."""
    all_q = load_all_questions()

    # QCM : piocher 8 exercices parmi toutes les annales
    qcm_exercices = []
    for annale in all_q.get("maths_qcm", []):
        qcm_exercices.extend(annale.get("exercices", []))
    random.shuffle(qcm_exercices)
    qcm_selection = qcm_exercices[:8]

    # Maths Spé : piocher 3 exercices
    mspe_exercices = []
    for annale in all_q.get("maths_specialite", []):
        mspe_exercices.extend(annale.get("exercices", []))
    random.shuffle(mspe_exercices)
    mspe_selection = mspe_exercices[:3]

    # PC : piocher 3 exercices
    pc_exercices = []
    for annale in all_q.get("physique_chimie", []):
        pc_exercices.extend(annale.get("exercices", []))
    random.shuffle(pc_exercices)
    pc_selection = pc_exercices[:3]

    return {
        "duree_totale_sec": 10800,  # 3h
        "epreuves": [
            {
                "matiere": "maths_qcm",
                "label": "Mathématiques QCM",
                "duree_sec": 3600,
                "exercices": qcm_selection
            },
            {
                "matiere": "maths_specialite",
                "label": "Mathématiques Spécialité",
                "duree_sec": 3600,
                "exercices": mspe_selection
            },
            {
                "matiere": "physique_chimie",
                "label": "Physique-Chimie",
                "duree_sec": 3600,
                "exercices": pc_selection
            }
        ],
        "regles": {
            "calculatrice": false,
            "documents": false,
            "indices": false
        }
    }


class SimulationResult(BaseModel):
    duree_totale_sec: int
    score_qcm: float
    score_maths_spe: float
    score_pc: float

@router.post("/enregistrer")
async def enregistrer_simulation(result: SimulationResult):
    """Enregistre les résultats d'une simulation."""
    total = result.score_qcm + result.score_maths_spe + result.score_pc
    note_20 = round(total * 20 / 120, 2)

    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute(
            """INSERT INTO simulations 
               (utilisateur_id, duree_totale_sec, score_qcm, score_maths_spe, score_pc, score_total, note_sur_20)
               VALUES (1, ?, ?, ?, ?, ?, ?)""",
            (result.duree_totale_sec, result.score_qcm, result.score_maths_spe, result.score_pc, total, note_20)
        )
        await db.commit()

    return {"status": "ok", "total_120": total, "note_sur_20": note_20}
```

### 2.2 Frontend — Page Simulation

Créer `frontend/src/pages/Simulation.tsx` :

```tsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

type Phase = 'intro' | 'qcm' | 'maths_spe' | 'pc' | 'results'

export default function Simulation() {
  const [simulation, setSimulation] = useState<any>(null)
  const [phase, setPhase] = useState<Phase>('intro')
  const [globalTimer, setGlobalTimer] = useState(10800) // 3h en secondes
  const [running, setRunning] = useState(false)
  const [scores, setScores] = useState({ qcm: 0, maths_spe: 0, pc: 0 })
  const timerRef = useRef<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/simulation/generer').then(r => r.json()).then(setSimulation)
  }, [])

  useEffect(() => {
    if (running && globalTimer > 0) {
      timerRef.current = setInterval(() => setGlobalTimer(t => t - 1), 1000)
      return () => clearInterval(timerRef.current)
    }
    if (globalTimer <= 0) {
      clearInterval(timerRef.current)
      setPhase('results')
    }
  }, [running, globalTimer])

  const startSimulation = () => {
    setPhase('qcm')
    setRunning(true)
  }

  const hh = String(Math.floor(globalTimer / 3600)).padStart(2, '0')
  const mm = String(Math.floor((globalTimer % 3600) / 60)).padStart(2, '0')
  const ss = String(globalTimer % 60).padStart(2, '0')

  if (!simulation) return <div style={{ padding: 40, textAlign: 'center' }}>Génération de la simulation...</div>

  if (phase === 'intro') {
    return (
      <div style={{ maxWidth: 700, margin: '80px auto', textAlign: 'center', padding: 20 }}>
        <h1>🏁 Simulation Geipi Polytech</h1>
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
          padding: 32, marginTop: 24
        }}>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-primary)' }}>
            <strong>Durée :</strong> 3 heures<br/>
            <strong>Épreuves :</strong> Maths QCM (1h) + Maths Spécialité (1h) + Physique-Chimie (1h)<br/>
            <strong>Conditions :</strong> Pas de calculatrice, pas de document, pas d'indice<br/>
            <strong>Barème :</strong> Identique au concours (points négatifs en QCM)
          </p>
          <div style={{
            background: '#FEF2F2', border: '1px solid var(--accent-red)', borderRadius: 8,
            padding: 16, marginTop: 16, color: '#991B1B', fontWeight: 500
          }}>
            ⚠️ Une fois lancée, la simulation ne peut pas être mise en pause.
          </div>
          <button onClick={startSimulation} style={{
            marginTop: 24, padding: '16px 48px', borderRadius: 'var(--radius)',
            background: 'var(--accent-blue)', color: 'white', border: 'none',
            fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer'
          }}>
            Commencer la simulation
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'results') {
    const total = scores.qcm + scores.maths_spe + scores.pc
    const note20 = (total * 20 / 120).toFixed(1)
    const tempsUtilise = 10800 - globalTimer

    // Enregistrer
    fetch('/api/simulation/enregistrer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        duree_totale_sec: tempsUtilise,
        score_qcm: scores.qcm,
        score_maths_spe: scores.maths_spe,
        score_pc: scores.pc
      })
    })

    return (
      <div style={{ maxWidth: 700, margin: '40px auto', textAlign: 'center', padding: 20 }}>
        <h1>🎉 Simulation terminée !</h1>
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
          padding: 32, marginTop: 24
        }}>
          <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{note20}/20</div>
          <p style={{ color: 'var(--text-secondary)' }}>Total : {total.toFixed(1)}/120</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 24 }}>
            <div><strong>QCM</strong><br/>{scores.qcm}/40</div>
            <div><strong>Maths Spé</strong><br/>{scores.maths_spe}/40</div>
            <div><strong>PC</strong><br/>{scores.pc}/40</div>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>
            Temps utilisé : {formatTime(tempsUtilise)}
          </p>
        </div>
        <button onClick={() => navigate('/dashboard')} style={{
          marginTop: 24, padding: '14px 32px', borderRadius: 'var(--radius)',
          background: 'var(--accent-blue)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer'
        }}>
          Voir le tableau de bord →
        </button>
      </div>
    )
  }

  // Phase active (qcm, maths_spe, pc)
  // Pour le MVP : rediriger vers les pages QCM / ExerciceRedige existantes
  // avec un mode "simulation" qui désactive les indices et transmet le score
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--bg-header)', color: 'white', padding: '12px 20px',
        borderRadius: 'var(--radius)', marginBottom: 20
      }}>
        <span style={{ fontWeight: 700 }}>
          {phase === 'qcm' ? '📝 Maths QCM' : phase === 'maths_spe' ? '📐 Maths Spé' : '⚗️ Physique-Chimie'}
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: '1.3rem' }}>
          {hh}:{mm}:{ss}
        </span>
      </div>

      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
        padding: 32, textAlign: 'center'
      }}>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          Mode simulation — les exercices s'enchaînent.
          <br/>Le chronomètre tourne. Pas d'indice disponible.
        </p>
        <p style={{ marginTop: 16 }}>
          <em>Note pour le dev : intégrer ici les composants QCM et ExerciceRedige en mode simulation.
          Pour le MVP, un bouton "Passer à l'épreuve suivante" suffit.</em>
        </p>
        <button onClick={() => {
          if (phase === 'qcm') setPhase('maths_spe')
          else if (phase === 'maths_spe') setPhase('pc')
          else setPhase('results')
        }} style={{
          marginTop: 24, padding: '14px 32px', borderRadius: 'var(--radius)',
          background: 'var(--accent-blue)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer'
        }}>
          Épreuve suivante →
        </button>
      </div>
    </div>
  )
}

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}h${m}min`
  return `${m}min`
}
```

### 2.3 Route

Dans `App.tsx` :
```tsx
import Simulation from './pages/Simulation'
// ...
<Route path="/simulation" element={<Simulation />} />
```

---

## 3. Génération d'exercices par IA

### 3.1 Backend — Endpoint de génération

Créer `backend/routers/generation.py` :

```python
from fastapi import APIRouter
from pydantic import BaseModel
from services.llm_service import call_gemini_text
import json

router = APIRouter(prefix="/generation", tags=["generation"])

class GenerationRequest(BaseModel):
    matiere: str       # "maths_qcm", "maths_specialite", "physique_chimie"
    chapitre: str      # "calculs_algebre", "fonctions", etc.
    nb_questions: int = 4

@router.post("/qcm")
async def generer_qcm(req: GenerationRequest):
    """Génère un exercice QCM dans le style Geipi Polytech."""
    prompt = f"""Tu es un concepteur de sujets pour le concours Geipi Polytech (post-bac, niveau Terminale).

Crée un exercice QCM de type VRAI/FAUX sur le chapitre "{req.chapitre}" en mathématiques.

RÈGLES :
- {req.nb_questions} affirmations à évaluer VRAI ou FAUX
- Niveau Terminale Spécialité Maths
- Style identique aux annales Geipi Polytech (formules, calculs, pas de contexte appliqué)
- Mélange de VRAI et de FAUX (pas tout vrai ni tout faux)
- Chaque affirmation doit tester une compétence différente
- Les pièges classiques du concours : signe, domaine de définition, sens d'inégalité, oubli de cas

Réponds UNIQUEMENT en JSON avec cette structure :
{{
  "enonce_commun": "texte introductif si nécessaire (ou vide)",
  "questions": [
    {{
      "enonce": "affirmation en LaTeX",
      "reponse": true ou false,
      "explication": "explication détaillée de la réponse"
    }}
  ],
  "indice": "un indice général pour l'exercice"
}}"""

    try:
        result_text = await call_gemini_text(prompt)
        # Nettoyer le JSON
        result_text = result_text.strip()
        if result_text.startswith("```"):
            result_text = result_text.split("\n", 1)[1].rsplit("```", 1)[0]
        result = json.loads(result_text)
        return {"status": "ok", "exercice": result}
    except Exception as e:
        return {"status": "error", "message": str(e)}
```

Ajouter dans `main.py` :
```python
from routers import generation
app.include_router(generation.router, prefix="/api")
```

### 3.2 Frontend — Bouton "Exercice surprise" dans le plan

Dans `RevisionPlan.tsx`, ajouter un bouton par bloc de chapitre :

```tsx
<button
  onClick={async () => {
    const res = await fetch('/api/generation/qcm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matiere: bloc.matiere, chapitre: bloc.chapitre, nb_questions: 4 })
    })
    const data = await res.json()
    if (data.status === 'ok') {
      // Stocker l'exercice généré et naviguer vers la page QCM
      // (utiliser un state global ou localStorage temporaire)
      navigate('/qcm-genere', { state: { exercice: data.exercice } })
    }
  }}
  style={{
    padding: '8px 16px', borderRadius: 8, border: '1px dashed var(--accent-blue)',
    background: 'transparent', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '0.85rem'
  }}
>
  🎲 Exercice surprise
</button>
```

Créer une page `QCMGenere.tsx` qui reprend la logique de `QCM.tsx` mais avec l'exercice passé en state (pas chargé depuis l'API). Ou, plus simple : sauvegarder l'exercice généré côté backend et rediriger vers `/qcm/{id}`. Léo choisit l'approche la plus rapide.

---

## 4. Tests de validation Run 4

| # | Test | Attendu |
|---|------|---------|
| 1 | `GET /api/dashboard/garance` | JSON complet avec progression, stats, note |
| 2 | Dashboard visuel | Cartes stats, barres progression, note /20 |
| 3 | Points faibles | Chapitres < 50% affichés en orange |
| 4 | Analyse IA | Cliquer "Générer mon analyse" → texte personnalisé |
| 5 | Mode simulation intro | Page avec règles + bouton "Commencer" |
| 6 | Chronomètre 3h | Timer décompte depuis 3:00:00 |
| 7 | Résultats simulation | Note /20 affichée + stockée en BDD |
| 8 | Génération QCM | `POST /api/generation/qcm` → exercice valide |
| 9 | Exercice surprise | Bouton dans le plan → QCM généré jouable |

---

## 5. Git

```bash
git add .
git commit -m "Run 4: dashboard avancé, analyse IA, simulation 3h, génération exercices"
git push origin main
git tag -a run4-ok -m "Run 4 stable - dashboard + simulation + generation"
git push origin run4-ok
```

DEVLOG.md et CHANGELOG.md à jour.

---

## 6. Rappels Léo

- Chemin projet : `/root/.openclaw/workspace-coder/projects/polytech-revision/`
- Modèle Gemini : `gemini-3-flash-preview` (dans config.py via le hotfix)
- La clé est dans `/root/.openclaw/.env`
- La page Simulation est un MVP : le mode intégré (QCM + canvas dans la même page) viendra au Run 5
- La génération d'exercices peut parfois retourner du JSON mal formé → toujours wrapper dans try/catch
- Rollback : `git checkout run3-ok`
