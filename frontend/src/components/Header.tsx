import { useNavigate } from 'react-router-dom'

interface Props {
  title: string
  showBack?: boolean
  showDashboard?: boolean
}

export default function Header({ title, showBack = true, showDashboard = true }: Props) {
  const navigate = useNavigate()
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 20px',
      background: 'var(--bg-header)',
      color: 'white',
      borderRadius: 'var(--radius)',
      marginBottom: '24px',
      boxShadow: 'var(--shadow)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {showBack && (
          <button 
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Retour
          </button>
        )}
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{title}</h2>
      </div>
      {showDashboard && (
        <button 
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          📊 Dashboard
        </button>
      )}
    </div>
  )
}
