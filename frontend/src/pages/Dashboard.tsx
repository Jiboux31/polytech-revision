import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface DashboardData {
  progression: any[]
  stats_par_matiere: any[]
  historique_recent: any[]
  points_faibles: any[]
  simulations: any[]
  stats_globales: any
  note_estimee: any
  jours_restants: number
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [analyse, setAnalyse] = useState<string>('')
  const [loadingAnalyse, setLoadingAnalyse] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/dashboard/garance').then(r => r.json()).then(setData)
  }, [])

  const handleAnalyse = async () => {
    setLoadingAnalyse(true)
    const res = await fetch('/api/dashboard/analyse')
    const json = await res.json()
    setAnalyse(json.analyse)
    setLoadingAnalyse(false)
  }

  if (!data) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>

  const { stats_globales, note_estimee, jours_restants, points_faibles, progression } = data

  // Grouper la progression par matière
  const matieres: Record<string, any[]> = {}
  for (const p of progression) {
    if (!matieres[p.matiere]) matieres[p.matiere] = []
    matieres[p.matiere].push(p)
  }

  const niveauColor: Record<string, string> = {
    non_vu: 'var(--level-non-vu)',
    en_cours: 'var(--level-en-cours)',
    fragile: 'var(--level-fragile)',
    acquis: 'var(--level-acquis)',
    maitrise: 'var(--level-maitrise)'
  }

  const niveauLabel: Record<string, string> = {
    non_vu: 'Non vu',
    en_cours: 'En cours',
    fragile: 'Fragile',
    acquis: 'Acquis',
    maitrise: 'Maîtrisé'
  }

  const matiereLabel: Record<string, string> = {
    maths_qcm: 'Maths QCM',
    maths_specialite: 'Maths Spécialité',
    physique_chimie: 'Physique-Chimie'
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Tableau de bord</h1>
        <div style={{
          background: jours_restants <= 7 ? 'var(--accent-red)' : 'var(--accent-blue)',
          color: 'white', padding: '8px 16px', borderRadius: 'var(--radius)', fontWeight: 700
        }}>
          J-{jours_restants}
        </div>
      </div>

      {/* Résumé en cartes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard label="Questions faites" value={stats_globales.total_questions || 0} icon="📝" />
        <StatCard label="Réponses correctes" value={stats_globales.total_correct || 0} icon="✅" />
        <StatCard label="Chapitres travaillés" value={stats_globales.chapitres_travailles || 0} icon="📚" />
        <StatCard label="Temps total" value={formatTime(stats_globales.temps_total_sec || 0)} icon="⏱️" />
      </div>

      {/* Note Polytech estimée */}
      {note_estimee && (
        <div style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
          padding: 20, marginBottom: 24
        }}>
          <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>📊 Note Polytech estimée</h3>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <NoteBar label="QCM" value={note_estimee.qcm_sur_40} max={40} />
            <NoteBar label="Maths Spé" value={note_estimee.maths_spe_sur_40} max={40} />
            <NoteBar label="PC" value={note_estimee.pc_sur_40} max={40} />
            <div style={{
              fontSize: '2rem', fontWeight: 700, marginLeft: 'auto',
              color: note_estimee.note_sur_20 >= 12 ? 'var(--accent-green)' : note_estimee.note_sur_20 >= 8 ? 'var(--accent-orange)' : 'var(--accent-red)'
            }}>
              {note_estimee.note_sur_20}/20
            </div>
          </div>
        </div>
      )}

      {/* Points faibles */}
      {points_faibles.length > 0 && (
        <div style={{
          background: 'var(--partial-bg)', border: '1px solid var(--partial-border)',
          borderRadius: 'var(--radius)', padding: 20, marginBottom: 24
        }}>
          <h3 style={{ marginTop: 0, color: '#92400E' }}>⚠️ Chapitres à renforcer</h3>
          {points_faibles.map((pf: any) => (
            <div key={pf.chapitre} style={{ marginBottom: 8 }}>
              <strong>{matiereLabel[pf.matiere] || pf.matiere}</strong> — {pf.chapitre.replace(/_/g, ' ')}
              <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
                ({Math.round(pf.score_moyen * 100)}% sur {pf.nb_questions_faites} questions)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Progression par matière */}
      {Object.entries(matieres).map(([matiere, chapitres]) => (
        <div key={matiere} style={{
          background: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
          padding: 20, marginBottom: 16
        }}>
          <h3 style={{ marginTop: 0 }}>{matiereLabel[matiere] || matiere}</h3>
          {chapitres.map((ch: any) => (
            <div key={ch.chapitre} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ flex: '0 0 180px', fontSize: '0.9rem' }}>{ch.chapitre.replace(/_/g, ' ')}</span>
              <div style={{ flex: 1, height: 12, background: '#E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.round(ch.score_moyen * 100)}%`,
                  height: '100%', background: niveauColor[ch.niveau] || '#ccc',
                  borderRadius: 6, transition: 'width 0.5s ease'
                }} />
              </div>
              <span style={{
                fontSize: '0.8rem', padding: '2px 8px', borderRadius: 4,
                background: niveauColor[ch.niveau] || '#ccc', color: ch.niveau === 'maitrise' ? 'white' : 'var(--text-primary)',
                fontWeight: 600, whiteSpace: 'nowrap'
              }}>
                {niveauLabel[ch.niveau] || ch.niveau}
              </span>
            </div>
          ))}
        </div>
      ))}

      {/* Analyse IA */}
      <div style={{
        background: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
        padding: 20, marginBottom: 24
      }}>
        <h3 style={{ marginTop: 0 }}>🤖 Analyse personnalisée</h3>
        {analyse ? (
          <p style={{ lineHeight: 1.7, color: 'var(--text-primary)' }}>{analyse}</p>
        ) : (
          <button onClick={handleAnalyse} disabled={loadingAnalyse} style={{
            padding: '12px 24px', borderRadius: 'var(--radius)', border: '1px solid var(--accent-blue)',
            background: 'white', color: 'var(--accent-blue)', fontWeight: 600, cursor: 'pointer'
          }}>
            {loadingAnalyse ? '🔍 Analyse en cours...' : '📊 Générer mon analyse'}
          </button>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => navigate('/plan')} style={navBtnStyle}>← Plan de révision</button>
        <button onClick={() => navigate('/simulation')} style={{ ...navBtnStyle, background: 'var(--accent-blue)', color: 'white', border: 'none' }}>
          🏁 Lancer une simulation
        </button>
      </div>
    </div>
  )
}

// === Composants internes ===

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: string }) {
  return (
    <div style={{
      background: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
      padding: 16, textAlign: 'center'
    }}>
      <div style={{ fontSize: '1.5rem' }}>{icon}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  )
}

function NoteBar({ label, value, max }: { label: string, value: number, max: number }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div style={{ minWidth: 150 }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 10, background: '#E5E7EB', borderRadius: 5 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-blue)', borderRadius: 5 }} />
        </div>
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{value}/{max}</span>
      </div>
    </div>
  )
}

function formatTime(sec: number): string {
  if (sec < 60) return `${sec}s`
  if (sec < 3600) return `${Math.floor(sec / 60)}min`
  return `${Math.floor(sec / 3600)}h${Math.floor((sec % 3600) / 60)}min`
}

const navBtnStyle: React.CSSProperties = {
  padding: '14px 24px', borderRadius: 'var(--radius)', border: '1px solid #D1D5DB',
  background: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '1rem'
}
