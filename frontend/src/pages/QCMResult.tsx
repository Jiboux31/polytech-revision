import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import Header from '../components/Header'
import MathRender from '../components/MathRender'

export default function QCMResult() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const resultData = location.state?.resultData
  const exerciseData = location.state?.exerciseData
  
  if (!resultData || !exerciseData) {
    return <Navigate to="/plan" />
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'correct': return { bg: 'var(--correct-bg)', border: 'var(--correct-border)', text: 'var(--accent-green)' }
      case 'incorrect': return { bg: 'var(--incorrect-bg)', border: 'var(--incorrect-border)', text: 'var(--accent-red)' }
      case 'non_repondu': default: return { bg: '#F3F4F6', border: '#D1D5DB', text: 'var(--text-secondary)' }
    }
  }

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <Header title={`Résultats — ${exerciseData.titre}`} />
      
      <div style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
        marginBottom: '32px',
        textAlign: 'center'
      }}>
        <div data-testid="qcm-score" style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--bg-header)' }}>
          {resultData.score_final} / {exerciseData.questions.length}
        </div>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginTop: '8px' }}>
          {resultData.feedback}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
        {resultData.details.map((detail: any) => {
          const q = exerciseData.questions.find((x: any) => x.id === detail.id)
          const colors = getStatusColor(detail.status)
          
          return (
            <div key={detail.id} style={{
              background: colors.bg,
              border: `2px solid ${colors.border}`,
              padding: '20px',
              borderRadius: 'var(--radius)'
            }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontWeight: 700, color: colors.text }}>
                  {detail.id.split('-').pop()}
                </span>
                <span style={{ flex: 1, overflowX: 'auto' }}>
                  <MathRender latex={q?.enonce || ''} display={false} />
                </span>
              </div>
              
              <div style={{ fontWeight: 600, color: colors.text, marginBottom: '8px' }}>
                {detail.status === 'correct' && `✅ Correct (VRAI)`}
                {detail.status === 'incorrect' && `❌ Faux — La bonne réponse était ${detail.bonne_reponse ? 'VRAI' : 'FAUX'}`}
                {detail.status === 'non_repondu' && `⬜ Non répondu — La bonne réponse était ${detail.bonne_reponse ? 'VRAI' : 'FAUX'}`}
              </div>
              
              <div style={{ color: 'var(--text-primary)', background: 'white', padding: '12px', borderRadius: '8px', fontSize: '0.95rem' }}>
                <strong>📚 Explication : </strong>
                {detail.explication}
              </div>
            </div>
          )
        })}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '40px' }}>
        <button
          onClick={() => navigate('/plan')}
          style={{
            background: 'white',
            color: 'var(--text-primary)',
            border: '2px solid #E5E7EB',
            padding: '12px 24px',
            fontSize: '1.1rem',
            fontWeight: 600,
            borderRadius: 'var(--radius)',
            cursor: 'pointer'
          }}
        >
          ← Autre exercice
        </button>
        
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'var(--bg-header)',
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
          📊 Mon Dashboard
        </button>
      </div>
    </div>
  )
}
