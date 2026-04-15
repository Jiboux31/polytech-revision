import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MathRender from '../components/MathRender'
import QCMMulti from '../components/QCMMulti'
import ChampsManuscrits from '../components/ChampsManuscrits'

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
  const [selectedQCM, setSelectedQCM] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetch(`${API_BASE}/exercices/${exerciseId}`)
      .then(r => r.json())
      .then(data => {
        setExercise(data)
        setCurrentQIndex(0)
      })
  }, [exerciseId])

  if (!exercise) return <div className="loading">Chargement...</div>

  const questions = exercise.questions || exercise.sous_questions || []
  const currentQ = questions[currentQIndex]
  
  if (!currentQ) return <div>Aucune question trouvée.</div>

  const handleSubmit = async () => {
    setLoading(true)
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    
    try {
      const payload: any = {
        exercise_id: exerciseId,
        question_id: currentQ.id,
        indice_utilise: hintUsed ? 1 : 0,
        temps_reponse_sec: elapsed,
        type: currentQ.type || 'manuscrit'
      }

      if (currentQ.type === 'qcm_multi' || currentQ.type === 'qcm_single') {
        payload.selected = Array.from(selectedQCM)
        payload.options = currentQ.options
      } else {
        // Collect canvas images (extract from MiniCanvas)
        const canvasImages: Record<string, string> = {}
        const canvases = document.querySelectorAll('canvas')
        canvases.forEach((c: any) => {
          // Find the id from class mini-canvas-ID
          const classList = Array.from(c.classList) as string[]
          const miniCanvasClass = classList.find(cls => cls.startsWith('mini-canvas-'))
          if (miniCanvasClass) {
            const id = miniCanvasClass.replace('mini-canvas-', '')
            // Check if canvas is not empty (simple check: any pixel != white)
            canvasImages[id] = c.toDataURL()
          }
        })
        payload.images = canvasImages
      }

      const res = await fetch(`${API_BASE}/correction/exercice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
    setSelectedQCM(new Set())
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1)
    } else {
      navigate('/dashboard')
    }
  }

  const handleHint = () => { setShowHint(true); setHintUsed(true) }

  return (
    <div className="exercice-page" style={{ padding: 20 }}>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2>{exercise.titre}</h2>
          <span>Question {currentQIndex + 1}/{questions.length} — {currentQ.points} pts</span>
        </div>
        <button onClick={() => navigate('/plan')} className="btn-back-plan">📅 Plan</button>
      </div>

      {exercise.contexte && (
        <div className="zone-a-contexte" style={{ background: '#f8fafc', padding: 15, borderRadius: 8, marginBottom: 20, border: '1px solid #e2e8f0' }}>
          <h3>Contexte</h3>
          {typeof exercise.contexte === 'string' ? (
            <p><MathRender latex={exercise.contexte} /></p>
          ) : (
            <>
              {exercise.contexte.texte && <p><MathRender latex={exercise.contexte.texte} /></p>}
              {exercise.contexte.donnees && (
                <ul>
                  {exercise.contexte.donnees.map((d: string, i: number) => (
                    <li key={i}><MathRender latex={d} /></li>
                  ))}
                </ul>
              )}
              {exercise.contexte.schemas && exercise.contexte.schemas.map((s: any, i: number) => {
                 if (s.source === 'pdf_crop') {
                   const { pdf, page, crop } = s;
                   return <img key={i} src={`${API_BASE}/exercices/pdf-crop/${pdf}/${page}?top=${crop.top}&bottom=${crop.bottom}&left=${crop.left}&right=${crop.right}`} style={{ maxWidth: '100%', marginTop: 10, border: '1px solid #cbd5e1' }} alt={s.description} />
                 }
                 return null;
              })}
            </>
          )}
        </div>
      )}

      <div className="zone-b-question" style={{ marginBottom: 20 }}>
        <strong>{currentQ.id}</strong> <MathRender latex={currentQ.enonce || currentQ.enonce_court || ""} />
      </div>

      <div className="zone-c-reponse">
        {!result && (
          <div style={{ marginBottom: 20 }}>
            {(currentQ.type === 'qcm_multi' || currentQ.type === 'qcm_single') ? (
              <QCMMulti options={currentQ.options} selected={selectedQCM} onChange={setSelectedQCM} />
            ) : (
              <ChampsManuscrits champs={currentQ.champs_reponse || [{label: "Réponse :", id: "rep_1", width: "large"}]} />
            )}
          </div>
        )}

        {!result && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleHint} disabled={hintUsed}>💡 Indice</button>
            <button onClick={handleSubmit} disabled={loading} style={{ background: 'var(--accent-blue)', color: 'white' }}>
              {loading ? 'Validation...' : '✅ Valider'}
            </button>
          </div>
        )}
        
        {showHint && !result && (
          <div style={{ marginTop: 10, padding: 10, background: '#fffbeb', border: '1px solid #fef3c7' }}>
            <strong>Indice :</strong> <MathRender latex={currentQ.indice || ""} />
          </div>
        )}

        {result && (
          <div className="feedback" style={{ marginTop: 20, padding: 15, background: result.est_correct ? '#ecfdf5' : '#fef2f2', border: '1px solid #ccc' }}>
            <p><strong>Feedback :</strong> <MathRender latex={result.feedback || result.explication || ""} /></p>
            <p><strong>Réponse attendue :</strong> <MathRender latex={result.reponse_attendue || "Voir cours"} /></p>
            <button onClick={handleNext} style={{ marginTop: 10, padding: '10px 20px', background: 'var(--accent-blue)', color: 'white' }}>
              {currentQIndex < questions.length - 1 ? 'Question suivante' : 'Terminer'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
