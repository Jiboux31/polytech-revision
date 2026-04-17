import { useState } from 'react'
import MathRender from '../MathRender'
import VFButton from '../VFButton'

interface QCMExerciceProps {
  exercise: any
  onComplete: (reponses: Record<string, boolean | null>) => void
}

export default function QCMExercice({ exercise, onComplete }: QCMExerciceProps) {
  const [reponses, setReponses] = useState<Record<string, boolean | null>>(() => {
    const initial: Record<string, boolean | null> = {}
    exercise.questions.forEach((q: any) => initial[q.id] = null)
    return initial
  })

  const handleReponse = (qId: string, val: boolean | null) => {
    setReponses(prev => ({ ...prev, [qId]: val }))
  }

  const isComplete = Object.values(reponses).every(v => v !== null)

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ color: 'var(--accent-blue)', marginBottom: 8 }}>{exercise.titre}</h3>
        {exercise.enonce_commun && (
          <div style={{
            background: '#F0F4FF',
            padding: '20px',
            borderRadius: 'var(--radius)',
            borderLeft: '4px solid var(--accent-blue)',
            marginBottom: '32px',
            fontSize: '1.1rem',
            lineHeight: '1.6',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <MathRender latex={exercise.enonce_commun} display={false} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
        {exercise.questions.map((q: any) => (
          <div key={q.id} style={{
            background: 'var(--bg-card)',
            padding: '20px',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid #E5E7EB'
          }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                {q.id.split('-').pop()}
              </div>
              <div style={{ fontSize: '1.1rem', flex: 1 }}>
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '40px' }}>
        <button
          onClick={() => onComplete(reponses)}
          disabled={!isComplete}
          style={{
            background: isComplete ? 'var(--accent-green)' : '#E5E7EB',
            color: 'white',
            border: 'none',
            padding: '12px 40px',
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 'var(--radius)',
            cursor: isComplete ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s'
          }}
        >
          Valider l'exercice
        </button>
      </div>
    </div>
  )
}
