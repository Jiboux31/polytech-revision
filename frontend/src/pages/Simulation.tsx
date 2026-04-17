import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import QCMExercice from '../components/simulation/QCMExercice'
import ExerciceRedigeInline from '../components/simulation/ExerciceRedigeInline'

type Phase = 'intro' | 'epreuve' | 'transition' | 'results'

interface SimulationState {
  id: string
  duree_totale_sec: number
  epreuves: any[]
}

export default function Simulation() {
  const [simData, setSimData] = useState<SimulationState | null>(null)
  const [phase, setPhase] = useState<Phase>('intro')
  const [epreuveIdx, setEpreuveIdx] = useState(0)
  const [exerciceIdx, setExerciceIdx] = useState(0)
  const [globalTimer, setGlobalTimer] = useState(10800) // 3h
  const [epreuveTimer, setEpreuveTimer] = useState(3600) // 1h
  const [running, setRunning] = useState(false)
  const [scores, setScores] = useState<Record<string, any>>({})
  const [resultsSent, setResultsSent] = useState(false)
  
  const timerRef = useRef<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/simulation/generer')
      .then(r => r.json())
      .then(setSimData)
  }, [])

  useEffect(() => {
    if (running && globalTimer > 0) {
      timerRef.current = setInterval(() => {
        setGlobalTimer(t => Math.max(0, t - 1))
        setEpreuveTimer(t => Math.max(0, t - 1))
      }, 1000)
      return () => clearInterval(timerRef.current)
    }
  }, [running])

  const startSimulation = () => {
    setPhase('epreuve')
    setRunning(true)
    setEpreuveTimer(simData?.epreuves[0]?.duree_sec || 3600)
  }

  const handleNextEpreuve = () => {
    if (epreuveIdx < (simData?.epreuves.length || 0) - 1) {
      const nextIdx = epreuveIdx + 1
      setEpreuveIdx(nextIdx)
      setExerciceIdx(0)
      setEpreuveTimer(simData?.epreuves[nextIdx].duree_sec || 3600)
      setPhase('epreuve')
    } else {
      setPhase('results')
      setRunning(false)
    }
  }

  const handleExerciceComplete = async (responses: any) => {
    const epreuve = simData?.epreuves[epreuveIdx]
    if (!epreuve) return

    // Store responses for this epreuve
    const currentExercice = epreuve.exercices[exerciceIdx]
    const updatedScores = { ...scores }
    if (!updatedScores[epreuve.matiere]) {
      updatedScores[epreuve.matiere] = { score: 0, max: 40, details: [] }
    }

    // Calculer score localement pour QCM
    if (epreuve.matiere === 'maths_qcm') {
      let exScore = 0
      const exDetails = []
      for (const q of currentExercice.questions) {
        const rep = responses[q.id]
        const isCorrect = rep === q.reponse_correcte
        const qScore = isCorrect ? 1 : (rep === null ? 0 : -0.5)
        exScore += qScore
        exDetails.push({
          question_id: q.id,
          reponse: rep,
          est_correct: isCorrect ? 1 : 0,
          score: qScore,
          max_score: 1,
          temps_sec: 0 // TODO
        })
      }
      updatedScores[epreuve.matiere].score += Math.max(0, exScore)
      updatedScores[epreuve.matiere].details.push(...exDetails)
    } else {
      // Pour rédigé, on stocke les réponses pour envoi batch
      updatedScores[epreuve.matiere].details.push(...responses)
    }

    setScores(updatedScores)

    if (exerciceIdx < epreuve.exercices.length - 1) {
      setExerciceIdx(exerciceIdx + 1)
    } else {
      setPhase('transition')
    }
  }

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

  useEffect(() => {
    if (phase === 'results' && !resultsSent && simData) {
      const payload = {
        simulation_id: simData.id,
        duree_totale_sec: 10800 - globalTimer,
        epreuves: Object.entries(scores).map(([matiere, data]) => ({
          matiere,
          score: data.score,
          max_score: data.max,
          details: data.details
        }))
      }
      fetch('/api/simulation/terminer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(() => setResultsSent(true))
    }
  }, [phase, resultsSent, scores, simData, globalTimer])

  if (!simData) return <div style={{ padding: 40, textAlign: 'center' }}>Génération de la simulation...</div>

  if (phase === 'intro') {
    return (
      <div style={{ maxWidth: 700, margin: '80px auto', textAlign: 'center', padding: 20 }}>
        <h1>🏁 Simulation Geipi Polytech</h1>
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: 32, marginTop: 24 }}>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            <strong>Durée :</strong> 3 heures<br/>
            <strong>Épreuves :</strong> QCM (1h) → Maths Spé (1h) → PC (1h)<br/>
            <strong>Conditions :</strong> Pas de calculatrice, pas d'indice, pas de retour en arrière
          </p>
          <button onClick={startSimulation} style={{
            marginTop: 24, padding: '16px 48px', borderRadius: 12, background: 'var(--accent-blue)', color: 'white',
            border: 'none', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer'
          }}>Commencer l'épreuve</button>
        </div>
      </div>
    )
  }

  if (phase === 'transition') {
    const epreuve = simData.epreuves[epreuveIdx]
    const isLast = epreuveIdx === simData.epreuves.length - 1
    return (
      <div style={{ maxWidth: 700, margin: '80px auto', textAlign: 'center', padding: 20 }}>
        <h2 style={{ color: 'var(--accent-green)' }}>✅ Épreuve terminée</h2>
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: 32, marginTop: 24 }}>
          <p style={{ fontSize: '1.2rem', marginBottom: 24 }}>
            Bravo Garance ! Tu as terminé l'épreuve de <strong>{epreuve.label}</strong>.
          </p>
          {!isLast ? (
            <>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                La prochaine épreuve est : <strong>{simData.epreuves[epreuveIdx + 1].label}</strong>.
              </p>
              <button onClick={handleNextEpreuve} style={{
                padding: '16px 48px', borderRadius: 12, background: 'var(--accent-blue)', color: 'white',
                border: 'none', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer'
              }}>Passer à l'épreuve suivante</button>
            </>
          ) : (
            <button onClick={handleNextEpreuve} style={{
              padding: '16px 48px', borderRadius: 12, background: 'var(--accent-blue)', color: 'white',
              border: 'none', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer'
            }}>Voir mes résultats</button>
          )}
        </div>
      </div>
    )
  }

  if (phase === 'results') {
    const totalScore = Object.values(scores).reduce((acc, curr) => acc + curr.score, 0)
    const note20 = (totalScore * 20 / 120).toFixed(1)
    
    return (
      <div style={{ maxWidth: 800, margin: '40px auto', textAlign: 'center', padding: 20 }}>
        <h1>🏁 Résultats de la Simulation</h1>
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: 40, marginTop: 24 }}>
          <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--accent-blue)', marginBottom: 8 }}>{note20}/20</div>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Total : {totalScore.toFixed(1)} / 120 pts</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 40 }}>
            {simData.epreuves.map(ep => (
              <div key={ep.matiere} style={{ background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{ep.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{scores[ep.matiere]?.score.toFixed(1) || 0} / 40</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 40, padding: 20, background: '#ecfdf5', borderRadius: 12, border: '1px solid #10b981', color: '#064e3b' }}>
            <p><strong>Note :</strong> Les scores des parties rédigées sont estimés à 0 tant que la correction IA n'est pas finalisée.</p>
          </div>
          
          <button onClick={() => navigate('/dashboard')} style={{
            marginTop: 40, padding: '16px 48px', borderRadius: 12, background: 'var(--accent-blue)', color: 'white',
            border: 'none', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer'
          }}>Retour au tableau de bord</button>
        </div>
      </div>
    )
  }

  const currentEpreuve = simData.epreuves[epreuveIdx]
  const currentExercice = currentEpreuve.exercices[exerciceIdx]
  const isQCM = currentEpreuve.matiere === 'maths_qcm'

  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <div style={{ 
        position: 'sticky', top: 0, zIndex: 100, background: '#1E3A8A', color: 'white', 
        padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{currentEpreuve.label}</span>
          <span style={{ opacity: 0.7 }}>Exercice {exerciceIdx + 1}/{currentEpreuve.exercices.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase' }}>Temps épreuve</div>
            <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700, color: epreuveTimer < 300 ? '#FCA5A5' : 'white' }}>
              {formatMS(epreuveTimer)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.7, textTransform: 'uppercase' }}>Global</div>
            <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', fontWeight: 700 }}>
              {formatHMS(globalTimer)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '40px 20px', maxWidth: 1100, margin: '0 auto' }}>
        {isQCM ? (
          <QCMExercice 
            key={`${epreuveIdx}-${exerciceIdx}`} 
            exercise={currentExercice} 
            onComplete={handleExerciceComplete} 
          />
        ) : (
          <ExerciceRedigeInline 
            key={`${epreuveIdx}-${exerciceIdx}`} 
            exercise={currentExercice} 
            onComplete={handleExerciceComplete} 
          />
        )}
      </div>
    </div>
  )
}
