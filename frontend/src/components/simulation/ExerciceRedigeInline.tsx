import { useState, useCallback, useRef } from 'react'
import MathRender from '../MathRender'
import QCMMulti from '../QCMMulti'
import ChampsManuscrits from '../ChampsManuscrits'

interface ExerciceRedigeInlineProps {
  exercise: any
  onComplete: (responses: any[]) => void
}

export default function ExerciceRedigeInline({ exercise, onComplete }: ExerciceRedigeInlineProps) {
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [collectedResponses, setCollectedResponses] = useState<any[]>([])
  const [selectedQCM, setSelectedQCM] = useState<Set<number>>(new Set())
  const startTimeRef = useRef(Date.now())

  const questions = exercise.questions || exercise.sous_questions || []
  const currentQ = questions[currentQIndex]

  const handleNext = useCallback(async () => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
    
    // Collect current response
    const currentResponse: any = {
      exercise_id: exercise.id,
      question_id: currentQ.id,
      temps_reponse_sec: elapsed,
      type: currentQ.type || 'manuscrit'
    }

    if (currentQ.type === 'qcm_multi' || currentQ.type === 'qcm_single') {
      currentResponse.selected = Array.from(selectedQCM)
      currentResponse.options = currentQ.options
    } else {
      // Collect canvas images (extract from MiniCanvas)
      const canvasImages: Record<string, string> = {}
      if (currentQ.champs_reponse) {
        currentQ.champs_reponse.forEach((ch: any) => {
          const c = (window as any).activeCanvases?.[ch.id]
          if (c) {
            canvasImages[ch.id] = c.toDataURL()
          }
        })
      } else {
        // Fallback id for single rep
        const c = (window as any).activeCanvases?.['rep_1']
        if (c) canvasImages['rep_1'] = c.toDataURL()
      }
      currentResponse.images = canvasImages
    }

    const updatedResponses = [...collectedResponses, currentResponse]
    setCollectedResponses(updatedResponses)

    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1)
      setSelectedQCM(new Set())
      startTimeRef.current = Date.now()
    } else {
      onComplete(updatedResponses)
    }
  }, [currentQIndex, questions.length, exercise.id, currentQ.id, currentQ.type, currentQ.options, currentQ.champs_reponse, selectedQCM, collectedResponses, onComplete])

  const handleClear = () => {
    if (currentQ.champs_reponse) {
      currentQ.champs_reponse.forEach((ch: any) => {
        (window as any).clearCanvas?.(ch.id)
      })
    } else {
      (window as any).clearCanvas?.("rep_1")
    }
  }

  const toolBtnStyle = {
    padding: '6px 16px',
    fontSize: '0.9rem',
    background: 'white',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 500
  }

  if (!currentQ) return <div>Aucune question trouvée.</div>

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {exercise.contexte && (
        <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <h4 style={{ color: 'var(--accent-blue)', marginBottom: 16 }}>Contexte</h4>
          {typeof exercise.contexte === 'string' ? (
            <div style={{ fontSize: '1.1rem', lineHeight: 1.6 }}><MathRender latex={exercise.contexte} /></div>
          ) : (
            <>
              {exercise.contexte.texte && <div style={{ fontSize: '1.1rem', lineHeight: 1.6, marginBottom: 12 }}><MathRender latex={exercise.contexte.texte} /></div>}
              {exercise.contexte.donnees && (
                <ul style={{ listStyleType: 'disc', paddingLeft: 24, marginBottom: 16 }}>
                  {exercise.contexte.donnees.map((d: string, i: number) => (
                    <li key={i} style={{ marginBottom: 4 }}><MathRender latex={d} /></li>
                  ))}
                </ul>
              )}
              {exercise.contexte.schemas && exercise.contexte.schemas.map((s: any, i: number) => {
                 if (s.source === 'pdf_crop') {
                   const { pdf, page, crop } = s;
                   const url = `/api/exercices/pdf-crop/${pdf}/${page}?top=${crop.top}&bottom=${crop.bottom}&left=${crop.left}&right=${crop.right}`
                   return <img key={i} src={url} style={{ maxWidth: '100%', borderRadius: 8, marginTop: 12, border: '1px solid #cbd5e1' }} alt={s.description} />
                 }
                 return null;
              })}
            </>
          )}
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', padding: 32, borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
          <div style={{ fontWeight: 700, color: 'var(--accent-blue)', fontSize: '1.2rem' }}>{currentQIndex + 1}.</div>
          <div style={{ fontSize: '1.25rem', lineHeight: 1.6, flex: 1 }}>
            <MathRender latex={currentQ.enonce || currentQ.enonce_court || ""} />
          </div>
        </div>

        <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
          <button onClick={handleClear} style={toolBtnStyle}>🗑️ Effacer mon tracé</button>
        </div>

        <div style={{ marginBottom: 32 }}>
          {(currentQ.type === 'qcm_multi' || currentQ.type === 'qcm_single') ? (
            <QCMMulti options={currentQ.options} selected={selectedQCM} onChange={setSelectedQCM} />
          ) : (
            <ChampsManuscrits champs={currentQ.champs_reponse || [{label: "Réponse :", id: "rep_1", width: "large"}]} />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={handleNext} 
            style={{ 
              background: 'var(--accent-blue)', 
              color: 'white', 
              border: 'none', 
              padding: '12px 32px', 
              fontSize: '1.1rem', 
              fontWeight: 600, 
              borderRadius: 'var(--radius)', 
              cursor: 'pointer',
              boxShadow: 'var(--shadow)'
            }}
          >
            {currentQIndex < questions.length - 1 ? 'Question suivante' : 'Terminer l\'exercice'}
          </button>
        </div>
      </div>
    </div>
  )
}
