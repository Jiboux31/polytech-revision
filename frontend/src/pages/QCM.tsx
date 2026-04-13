import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchExercise, submitQCM, saveResult } from '../services/api'
import MathRender from '../components/MathRender'
import VFButton from '../components/VFButton'
import Header from '../components/Header'

export default function QCM() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  
  const [exercise, setExercise] = useState<any>(null)
  const [reponses, setReponses] = useState<Record<string, boolean | null>>({})
  const [hintVisible, setHintVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (exerciseId) {
      fetchExercise(exerciseId).then(data => {
        setExercise(data)
        const initialReponses: any = {}
        data.questions.forEach((q: any) => initialReponses[q.id] = null)
        setReponses(initialReponses)
        setLoading(false)
      }).catch(e => {
        console.error(e)
        alert("Erreur de chargement")
      })
    }
  }, [exerciseId])

  const handleReponse = (qId: string, val: boolean | null) => {
    setReponses(prev => ({ ...prev, [qId]: val }))
  }

  const handleValidate = async () => {
    if (!exerciseId || !exercise) return
    setSubmitting(true)
    try {
      const result = await submitQCM(exerciseId, reponses)
      
      for (const detail of result.details) {
        await saveResult({
          question_id: detail.id,
          matiere: exercise.matiere || 'maths_qcm',
          chapitre: exercise.chapitre,
          est_correct: detail.status === 'correct' ? 2 : detail.status === 'incorrect' ? 0 : 1,
          score_obtenu: detail.score,
          score_max: 1,
          indice_utilise: hintVisible ? 1 : 0,
          temps_reponse_sec: 30 
        })
      }
      
      navigate(`/qcm/${exerciseId}/result`, { state: { resultData: result, exerciseData: exercise } })
    } catch (e) {
      console.error(e)
      alert("Erreur lors de la correction")
      setSubmitting(false)
    }
  }

  if (loading) return <div className="container">Chargement...</div>

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <Header 
        title={`QCM — Exercice ${exercise?.id?.split('-')[1] || exercise?.id} : ${exercise?.titre}`} 
        showDashboard={false} 
        showBack={true}
      />
      
      {exercise?.enonce_commun && (
        <div style={{
          background: '#F0F4FF',
          padding: '20px',
          borderRadius: 'var(--radius)',
          borderLeft: '4px solid var(--accent-blue)',
          marginBottom: '32px',
          fontSize: '1.15rem',
          lineHeight: '1.7',
          
          boxShadow: 'var(--shadow)'
        }}>
          <MathRender latex={exercise.enonce_commun} display={false} />
        </div>
      )}

      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '40px' }}>
        {exercise?.questions?.map((q: any) => (
          <div key={q.id} style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: 'var(--radius)',
            
          boxShadow: 'var(--shadow)'
          }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-blue)', fontSize: '1.1rem' }}>
                {q.id.split('-').pop()}
              </div>
              <div style={{ fontSize: '1.2rem', flex: 1,  }}>
                <MathRender latex={q.enonce} display={true} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
               <VFButton 
                value={reponses[q.id]} 
                onChange={(val) => handleReponse(q.id, val)} 
              />
            </div>
          </div>
        ))}
      </div>
      
      {hintVisible && exercise?.indice && (
        <div style={{
          background: '#FFFBEB',
          borderLeft: '4px solid var(--accent-orange)',
          padding: '16px',
          borderRadius: '4px var(--radius) var(--radius) 4px',
          marginBottom: '24px',
          color: '#B45309'
        }}>
          <strong>💡 Indice : </strong> {exercise.indice}
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '40px' }}>
        <button
          onClick={() => setHintVisible(true)}
          disabled={hintVisible || !exercise?.indice}
          style={{
            background: 'white',
            color: hintVisible ? 'var(--text-light)' : 'var(--accent-orange)',
            border: `2px solid ${hintVisible ? '#E5E7EB' : 'var(--accent-orange)'}`,
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: 'var(--radius)',
            cursor: hintVisible ? 'default' : 'pointer',
            opacity: exercise?.indice ? 1 : 0.5
          }}
        >
          {exercise?.indice ? '💡 Indice' : '💡 Aucun indice disponible'}
        </button>
        
        <button
          onClick={handleValidate}
          disabled={submitting}
          style={{
            background: 'var(--accent-green)',
            color: 'white',
            border: 'none',
            padding: '12px 40px',
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 'var(--radius)',
            cursor: submitting ? 'wait' : 'pointer',
            
          boxShadow: 'var(--shadow)'
          }}
        >
          {submitting ? 'Validation...' : '✅ Valider'}
        </button>
      </div>
    </div>
  )
}
