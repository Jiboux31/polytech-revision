import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../components/Header'

export default function QCMGenere() {
  const location = useLocation()
  const navigate = useNavigate()
  const exercise = location.state?.exercice

  const [answers, setAnswers] = useState<Record<number, boolean | null>>({})
  const [showCorrection, setShowCorrection] = useState(false)

  if (!exercise) {
    return (
      <div className="container">
        <p>Aucun exercice trouvé. Retournez au plan.</p>
        <button onClick={() => navigate('/plan')}>Retour</button>
      </div>
    )
  }

  const handleToggle = (qIdx: number, val: boolean) => {
    if (showCorrection) return
    setAnswers({ ...answers, [qIdx]: answers[qIdx] === val ? null : val })
  }

  const calculateScore = () => {
    let score = 0
    exercise.questions.forEach((q: any, idx: number) => {
      if (answers[idx] === q.reponse) score += 1
      else if (answers[idx] !== null && answers[idx] !== undefined) score -= 0.5
    })
    return Math.max(0, score)
  }

  return (
    <div className="container">
      <Header title="Exercice Surprise IA" />
      
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', marginBottom: '24px' }}>
        <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>{exercise.enonce_commun}</p>
        
        {exercise.questions.map((q: any, idx: number) => (
          <div key={idx} style={{ marginBottom: '24px', padding: '16px', border: '1px solid #E5E7EB', borderRadius: 8 }}>
            <p style={{ fontWeight: 600, marginBottom: '12px' }}>{idx + 1}. {q.enonce}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => handleToggle(idx, true)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB',
                  background: answers[idx] === true ? 'var(--accent-blue)' : 'white',
                  color: answers[idx] === true ? 'white' : 'var(--text-primary)',
                  fontWeight: 600, cursor: showCorrection ? 'default' : 'pointer'
                }}
              >VRAI</button>
              <button
                onClick={() => handleToggle(idx, false)}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #D1D5DB',
                  background: answers[idx] === false ? 'var(--accent-blue)' : 'white',
                  color: answers[idx] === false ? 'white' : 'var(--text-primary)',
                  fontWeight: 600, cursor: showCorrection ? 'default' : 'pointer'
                }}
              >FAUX</button>
            </div>
            
            {showCorrection && (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 6, background: answers[idx] === q.reponse ? 'var(--success-bg)' : 'var(--error-bg)', color: answers[idx] === q.reponse ? 'var(--success-text)' : 'var(--error-text)' }}>
                <strong>{q.reponse ? 'VRAI' : 'FAUX'}</strong> — {q.explication}
              </div>
            )}
          </div>
        ))}
        
        {!showCorrection ? (
          <button
            onClick={() => setShowCorrection(true)}
            style={{ width: '100%', padding: '16px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: 8, fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}
          >Valider mes réponses</button>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>Score : {calculateScore()} / {exercise.questions.length}</div>
            <button onClick={() => navigate('/plan')} style={{ padding: '12px 24px', background: 'white', border: '1px solid #D1D5DB', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Retour au plan</button>
          </div>
        )}
      </div>
      
      <div style={{ background: '#EFF6FF', padding: 16, borderRadius: 8, color: '#1E40AF', fontSize: '0.9rem' }}>
        💡 <strong>Indice :</strong> {exercise.indice}
      </div>
    </div>
  )
}
