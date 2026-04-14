import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DrawingCanvas from '../components/DrawingCanvas'
import MathRender from '../components/MathRender'

const API_BASE = '/api'

export default function ExerciceRedige() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState<any>(null)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    fetch(`${API_BASE}/exercices/${exerciseId}`)
      .then(r => r.json())
      .then(setExercise)
  }, [exerciseId])

  if (!exercise) return <div className="loading">Chargement...</div>

  const questions = exercise.sous_questions || []
  const currentQ = questions[currentQIndex]
  
  if (!currentQ) return <div>Aucune question trouvée.</div>

  const handleSubmit = async (imageBase64: string) => {
    setLoading(true)
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    try {
      const res = await fetch(`${API_BASE}/correction/redige`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: exerciseId,
          sub_question_id: currentQ.id,
          image_base64: imageBase64,
          indice_utilise: hintUsed ? 1 : 0,
          temps_reponse_sec: elapsed
        })
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setResult({
        est_correct: 0,
        feedback: "Erreur de connexion au serveur de correction.",
        reponse_attendue: currentQ.reponse_attendue,
        cours_rappel: currentQ.cours_associe
      })
    }
    setLoading(false)
  }

  const handleNext = () => {
    setResult(null)
    setShowHint(false)
    setHintUsed(false)
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1)
    } else {
      navigate('/dashboard')
    }
  }

  const handleHint = () => { setShowHint(true); setHintUsed(true) }

  const feedbackClass = (level: number) => {
    if (level === 2) return 'feedback-correct'
    if (level === 1) return 'feedback-partial'
    return 'feedback-incorrect'
  }

  return (
    <div className="exercice-page">
      <div className="header">
        <div>
          <h2>{exercise.titre}</h2>
          <span className="subtitle">
            Question {currentQIndex + 1}/{questions.length} — {currentQ.points} pts
          </span>
        </div>
      </div>

      <div className="enonce">
        <strong style={{ 
          minWidth: '120px', 
          color: 'var(--accent-blue)', 
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '0.9rem',
          marginRight: '12px',
          display: 'inline-block',
          textAlign: 'center'
        }}>
          {currentQ.id}
        </strong>
        <span style={{ flex: 1 }}>
          <MathRender latex={currentQ.enonce_court || ""} />
        </span>
      </div>

      {!result && (
        <div className="hint-section">
          <button onClick={handleHint} disabled={hintUsed} className="btn-hint" style={{ marginBottom: '12px' }}>
            💡 {hintUsed ? 'Indice utilisé' : "Besoin d'un indice ?"}
          </button>
          {showHint && (
            <div className="hint-box">
              <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '0.9rem', color: '#B45309' }}>
                INDICE
              </div>
              <MathRender latex={currentQ.indice || ""} />
            </div>
          )}
        </div>
      )}

      {!result ? (
        loading ? (
          <div className="correction-loading">
            <div className="spinner">🔍</div>
            <p>Correction en cours... Gemini analyse ta réponse.</p>
          </div>
        ) : (
          <DrawingCanvas onExport={handleSubmit} width={1000} height={350} />
        )
      ) : (
        <div>
          <div className={`feedback ${feedbackClass(result.est_correct)}`}>
            <div className="emoji">
              {result.est_correct === 2 ? '🎉' : result.est_correct === 1 ? '👍' : '📚'}
            </div>
            
            {result.transcription && (
              <p className="transcription">Ta réponse lue : <MathRender latex={result.transcription} /></p>
            )}
            
            <p className="feedback-text"><MathRender latex={result.feedback || ""} /></p>
            
            {result.cours_rappel && (
              <div className="cours-rappel">
                <strong>Rappel de cours:</strong> <MathRender latex={result.cours_rappel} />
              </div>
            )}
            
            <div className="reponse-attendue">
              <strong>Réponse attendue:</strong> <MathRender latex={result.reponse_attendue || ""} />
            </div>
          </div>

          <div className="next-btn-wrapper">
            <button onClick={handleNext} className="btn-next">
              {currentQIndex < questions.length - 1 ? 'Question suivante →' : 'Terminer →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
