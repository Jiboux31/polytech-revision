export const API_BASE = '/api'

export async function submitRedige(data: {
  exercise_id: string
  sub_question_id: string
  image_base64: string
  indice_utilise: number
  temps_reponse_sec: number
}) {
  const res = await fetch(`${API_BASE}/correction/redige`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return res.json()
}

export async function fetchRedigeExercises(matiere: string, chapitre: string) {
  const res = await fetch(`${API_BASE}/exercices/redige/${matiere}/${chapitre}`)
  return res.json()
}
