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
        background: '#1E40AF', color: 'white', padding: '12px 20px',
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
