import { useState, useEffect } from 'react'
import { fetchProgression } from '../services/api'
import Header from '../components/Header'

export default function Dashboard() {
  const [progression, setProgression] = useState<any[]>([])
  
  useEffect(() => {
    fetchProgression().then(data => {
      setProgression(data.progression || [])
    }).catch(console.error)
  }, [])
  
  const getLevelColor = (niveau: string) => {
    switch (niveau) {
      case 'non_vu': return 'var(--level-non-vu)'
      case 'en_cours': return 'var(--level-en-cours)'
      case 'fragile': return 'var(--level-fragile)'
      case 'acquis': return 'var(--level-acquis)'
      case 'maitrise': return 'var(--level-maitrise)'
      default: return 'var(--level-non-vu)'
    }
  }

  const renderSubject = (title: string, matiereCode: string, chapters: string[]) => {
    return (
      <div 
        data-testid={`matiere-${matiereCode}`}
        style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          marginBottom: '24px'
        }}
      >
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>{title}</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {chapters.map(chap => {
            const prog = progression.find(p => p.matiere === matiereCode && p.chapitre === chap)
            const percent = prog ? Math.round(prog.score_moyen * 100) : 0
            const level = prog ? prog.niveau : 'non_vu'
            const color = getLevelColor(level)
            
            return (
              <div key={chap} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '180px', fontWeight: 600 }}>
                  {chap.replace('_', ' ')}
                </div>
                <div 
                  data-testid="chapter-level" 
                  data-level={level}
                  style={{ flex: 1, height: '16px', background: '#F3F4F6', borderRadius: '8px', overflow: 'hidden' }}
                >
                  <div style={{ 
                    height: '100%', 
                    width: `${percent}%`, 
                    background: color,
                    transition: 'width 0.5s ease'
                  }} />
                </div>
                <div style={{ width: '60px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {percent}%
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="container" data-testid="dashboard-page">
      <Header title="Tableau de bord — Garance" showDashboard={false} />
      
      {renderSubject('Mathématiques QCM', 'maths_qcm', ['calculs_algebre', 'fonctions', 'suites', 'probabilites', 'geometrie_plan'])}
      {renderSubject('Mathématiques Spécialité', 'maths_specialite', ['analyse_fonctions', 'analyse_suites', 'geometrie_espace', 'probabilites_avancées', 'integration'])}
      {renderSubject('Physique-Chimie', 'physique_chimie', ['mecanique', 'ondes_optique', 'electricite', 'chimie_organique', 'chimie_generale'])}
      
    </div>
  )
}
