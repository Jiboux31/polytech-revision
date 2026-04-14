const API_BASE = '/api'

export async function fetchPlan() {
  const res = await fetch(`${API_BASE}/exercices/plan`)
  return res.json()
}

export async function fetchExercise(id: string) {
  const res = await fetch(`${API_BASE}/exercices/${id}`)
  return res.json()
}

export async function fetchChapterExercises(matiere: string, chapitre: string) {
  const res = await fetch(`${API_BASE}/exercices/chapitre/${matiere}/${chapitre}`)
  return res.json()
}

export async function fetchRedigeExercises(matiere: string, chapitre: string) {
  const res = await fetch(`${API_BASE}/exercices/redige/${matiere}/${chapitre}`)
  return res.json()
}

export async function submitQCM(exerciseId: string, reponses: Record<string, boolean | null>) {
  const res = await fetch(`${API_BASE}/correction/qcm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exercise_id: exerciseId, reponses })
  })
  return res.json()
}

export async function saveResult(data: {
  question_id: string
  matiere: string
  chapitre: string
  est_correct: number
  score_obtenu: number
  score_max: number
  indice_utilise: number
  temps_reponse_sec: number
}) {
  const res = await fetch(`${API_BASE}/progression/resultat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function fetchProgression() {
  const res = await fetch(`${API_BASE}/progression/garance`)
  return res.json()
}
