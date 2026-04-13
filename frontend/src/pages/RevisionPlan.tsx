import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchPlan, fetchChapterExercises, fetchProgression } from '../services/api'
import Header from '../components/Header'

export default function RevisionPlan() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState<any>(null)
  const [progression, setProgression] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    Promise.all([fetchPlan(), fetchProgression()])
      .then(([planData, progData]) => {
        setPlan(planData)
        setProgression(progData.progression || [])
        setLoading(false)
      })
      .catch(console.error)
  }, [])
  
  const getLevelDots = (matiere: string, chapitre: string) => {
    const prog = progression.find(p => p.matiere === matiere && p.chapitre === chapitre)
    if (!prog) return '○○○○○'
    const score = prog.score_moyen
    if (score >= 0.8) return '●●●●●'
    if (score >= 0.6) return '●●●●○'
    if (score >= 0.4) return '●●●○○'
    if (score > 0) return '●●○○○'
    return '●○○○○'
  }
  
  const handleLaunch = async (matiere: string, chapitre: string) => {
    if (matiere !== 'maths_qcm') return // Pas encore implémenté
    try {
      const data = await fetchChapterExercises(matiere, chapitre)
      if (data.exercices && data.exercices.length > 0) {
        navigate(`/qcm/${data.exercices[0].id}`)
      } else {
        alert("Aucun exercice disponible pour ce chapitre.")
      }
    } catch (e) {
      console.error(e)
      alert("Erreur de chargement de l'exercice.")
    }
  }

  if (loading) return <div className="container">Chargement...</div>

  return (
    <div className="container">
      <Header title="Plan de révision (5 jours)" />
      
      {plan?.jours?.map((jour: any) => (
        <div key={jour.jour} style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Jour {jour.jour} — {jour.theme}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {jour.blocs.map((bloc: any, idx: number) => {
              const isAvailable = bloc.matiere === 'maths_qcm'
              
              return (
                <div key={idx} style={{
                  background: 'var(--bg-card)',
                  padding: '20px',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow)',
                  opacity: isAvailable ? 1 : 0.6,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>
                    {bloc.matiere === 'maths_qcm' ? 'Maths QCM' : 
                     bloc.matiere === 'maths_specialite' ? 'Maths Spé' : 'Physique'}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', flex: 1 }}>
                    {bloc.label}
                  </div>
                  <div style={{ color: 'var(--accent-blue)', letterSpacing: '2px', marginBottom: '16px' }}>
                    {getLevelDots(bloc.matiere, bloc.chapitre)}
                  </div>
                  
                  <button
                    onClick={() => handleLaunch(bloc.matiere, bloc.chapitre)}
                    disabled={!isAvailable}
                    style={{
                      background: isAvailable ? 'var(--accent-blue)' : '#E5E7EB',
                      color: isAvailable ? 'white' : 'var(--text-light)',
                      border: 'none',
                      padding: '10px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: isAvailable ? 'pointer' : 'not-allowed',
                      width: '100%'
                    }}
                  >
                    {isAvailable ? 'Lancer' : 'Bientôt'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
