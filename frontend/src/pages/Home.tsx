import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchProgression } from '../services/api'
import Header from '../components/Header'

export default function Home() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any[]>([])
  
  useEffect(() => {
    fetchProgression().then(data => {
      setStats(data.stats_par_matiere || [])
    }).catch(console.error)
  }, [])
  
  // Calcul compte à rebours (28 avril 2026)
  const targetDate = new Date('2026-04-28T08:00:00Z')
  const now = new Date()
  const diffTime = Math.abs(targetDate.getTime() - now.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  // Progression globale (ratio questions correctes / totales)
  let total = 0
  let correct = 0
  stats.forEach(s => {
    total += s.nb_total
    correct += s.nb_correct
  })
  const progressPercent = total > 0 ? Math.round((correct / total) * 100) : 0
  
  const handleStartSession = () => {
    // Dans la vraie vie, on chercherait le premier exercice non fait
    // Pour l'instant, on redirige vers le plan de révision
    navigate('/plan')
  }

  return (
    <div className="container" data-testid="home-page">
      <Header title="PolytechRevision" showBack={false} />
      
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <h1 
          data-testid="welcome-message"
          style={{ fontSize: '2.5rem', marginBottom: '10px', color: 'var(--text-primary)' }}
        >
          Bonjour Garance ! 👋
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px' }}>
          Prête pour ta session de révision ?
        </p>
        
        <div style={{
          display: 'inline-block',
          background: 'var(--bg-card)',
          padding: '24px 40px',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)',
          marginBottom: '40px',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '1.5rem' }}>📅</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Concours dans {diffDays} jours</span>
          </div>
          <div data-testid="global-progress" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>📊</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Taux de réussite : {progressPercent}%</span>
          </div>
        </div>
        
        <div data-testid="daily-suggestion" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <button
            onClick={handleStartSession}
            style={{
              background: 'var(--accent-blue)',
              color: 'white',
              border: 'none',
              padding: '16px 32px',
              fontSize: '1.2rem',
              fontWeight: 600,
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow)'
            }}
          >
            📝 Commencer les révisions
          </button>
          <button
            onClick={() => navigate('/plan')}
            style={{
              background: 'white',
              color: 'var(--text-primary)',
              border: '2px solid #E5E7EB',
              padding: '16px 32px',
              fontSize: '1.2rem',
              fontWeight: 600,
              borderRadius: 'var(--radius)',
              cursor: 'pointer'
            }}
          >
            📚 Plan de révision
          </button>
        </div>
      </div>
    </div>
  )
}
