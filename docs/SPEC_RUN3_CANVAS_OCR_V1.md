# SPEC_RUN3_CANVAS_OCR_V1.md — Canvas manuscrit + Correction LLM

> **Run** : 3 — Exercices rédigés (Maths Spé + PC) avec écriture manuscrite
> **Objectif** : Garance peut écrire sa réponse au stylet, la soumettre, et recevoir une correction LLM
> **Pré-requis** : Run 2 + hotfix appliqués, tag `run2-ok`
> **Durée estimée** : 4-5h (le plus technique des runs)

---

## 0. Pré-run

```bash
cd /root/.openclaw/workspace-coder/polytech-revision
git tag -a run2-ok -m "Run 2 stable - QCM jouable + hotfix enonce_commun"
git push origin run2-ok
```

Vérifier que la clé API Gemini est dans `.env` :
```bash
cat .env | grep GEMINI
```
Si absente, demander à JB de la renseigner.

---

## 1. Vue d'ensemble du pipeline

```
Garance écrit au stylet sur le canvas
        │
        ▼
   [Export PNG] ← bouton "Valider"
        │
        ▼
   POST /api/correction/redige
   body: { exercise_id, sub_question_id, image_base64, indice_utilise, temps_sec }
        │
        ▼
   Backend → Gemini 3 Flash (vision)
   prompt: "Voici la réponse manuscrite de l'élève à cette question.
            Question: [énoncé court]
            Réponse attendue: [réponse du corrigé]
            Transcris le manuscrit, évalue, donne un feedback."
        │
        ▼
   Gemini retourne JSON structuré :
   { transcription, est_correct (0/1/2), feedback, cours_rappel }
        │
        ▼
   Backend stocke le résultat + renvoie au frontend
        │
        ▼
   Frontend affiche le feedback (3 niveaux)
```

---

## 2. Backend — Service OCR + Correction

### 2.1 Créer `backend/services/llm_service.py`

```python
import os
import json
import base64
import httpx
from config import settings

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

async def call_gemini_vision(image_base64: str, prompt: str, model: str = None) -> dict:
    """Appelle Gemini avec une image et un prompt texte."""
    model = model or settings.GEMINI_MODEL_FAST
    url = f"{GEMINI_API_URL}/{model}:generateContent?key={settings.GEMINI_API_KEY}"
    
    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "image/png",
                        "data": image_base64
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 2048,
            "responseMimeType": "application/json"
        }
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
    
    # Extraire le texte de la réponse Gemini
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text)
    except (KeyError, IndexError, json.JSONDecodeError):
        # Fallback si le JSON est mal formé
        raw = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return {"transcription": raw, "est_correct": 0, "feedback": "Erreur d'analyse de la réponse.", "cours_rappel": ""}


async def correct_handwritten_answer(
    image_base64: str,
    enonce_court: str,
    reponse_attendue: str,
    cours_associe: str,
    matiere: str
) -> dict:
    """Corrige une réponse manuscrite via Gemini Vision."""
    
    prompt = f"""Tu es un correcteur bienveillant du concours Geipi Polytech pour une élève de Terminale qui s'appelle Garance.

MATIÈRE : {matiere}
QUESTION : {enonce_court}
RÉPONSE ATTENDUE : {reponse_attendue}

INSTRUCTIONS :
1. Transcris d'abord le texte manuscrit visible sur l'image (formules, texte, schémas décrits).
2. Compare avec la réponse attendue.
3. Évalue : 2 = correct, 1 = partiellement correct, 0 = incorrect ou vide.
4. Rédige un feedback adapté au niveau de réussite.

RÈGLES DE FEEDBACK :
- Si correct (2) : un message d'encouragement court et chaleureux. Pas besoin de rappel de cours.
- Si partiellement correct (1) : valorise ce qui est bon, puis explique l'erreur avec le rappel de cours suivant, et enfin donne la réponse complète.
- Si incorrect ou vide (0) : pas de jugement négatif, rappelle le cours ci-dessous, puis donne la réponse expliquée pas à pas.

COURS À RAPPELER (si nécessaire) :
{cours_associe}

Réponds UNIQUEMENT en JSON avec cette structure exacte :
{{
  "transcription": "ce que tu lis sur l'image",
  "est_correct": 0 ou 1 ou 2,
  "parties_correctes": "ce qui est juste dans la réponse (vide si rien)",
  "erreurs": "les erreurs identifiées (vide si tout est juste)",
  "feedback": "le message complet pour Garance",
  "cours_rappel": "le rappel de cours si nécessaire (vide si correct)"
}}"""

    return await call_gemini_vision(image_base64, prompt)
```

### 2.2 Créer `backend/routers/correction_redige.py`

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import aiosqlite
import base64
import os
import time

from config import settings
from services.llm_service import correct_handwritten_answer
from services.questions_service import get_exercise_by_id

router = APIRouter(prefix="/correction", tags=["correction"])

class RedigeSubmission(BaseModel):
    exercise_id: str          # ex: "MSPE2025-I"
    sub_question_id: str      # ex: "MSPE2025-I-1"
    image_base64: str         # PNG en base64 (sans le préfixe data:image/png;base64,)
    indice_utilise: int = 0
    temps_reponse_sec: int = 0

@router.post("/redige")
async def corriger_redige(submission: RedigeSubmission):
    """Corrige une réponse manuscrite via Gemini Vision."""
    
    # 1. Trouver la question
    exercise = get_exercise_by_id(submission.exercise_id)
    if not exercise:
        raise HTTPException(404, f"Exercice {submission.exercise_id} introuvable")
    
    # Trouver la sous-question
    sub_q = None
    for sq in exercise.get("sous_questions", []):
        if sq["id"] == submission.sub_question_id:
            sub_q = sq
            break
    
    if not sub_q:
        raise HTTPException(404, f"Sous-question {submission.sub_question_id} introuvable")
    
    # 2. Sauvegarder l'image (pour référence)
    img_dir = os.path.join(settings.DATA_DIR, "reponses_images")
    os.makedirs(img_dir, exist_ok=True)
    img_filename = f"{submission.sub_question_id}_{int(time.time())}.png"
    img_path = os.path.join(img_dir, img_filename)
    
    try:
        img_bytes = base64.b64decode(submission.image_base64)
        with open(img_path, "wb") as f:
            f.write(img_bytes)
    except Exception:
        img_path = ""
    
    # 3. Appeler Gemini pour la correction
    matiere_label = {
        "maths_specialite": "Mathématiques Spécialité",
        "physique_chimie": "Physique-Chimie"
    }.get(exercise.get("matiere", ""), exercise.get("matiere", ""))
    
    try:
        result = await correct_handwritten_answer(
            image_base64=submission.image_base64,
            enonce_court=sub_q.get("enonce_court", ""),
            reponse_attendue=sub_q.get("reponse_attendue", ""),
            cours_associe=sub_q.get("cours_associe", ""),
            matiere=matiere_label
        )
    except Exception as e:
        # Fallback en cas d'erreur API
        result = {
            "transcription": "",
            "est_correct": 0,
            "parties_correctes": "",
            "erreurs": f"Erreur lors de l'appel au service de correction : {str(e)}",
            "feedback": "Désolé, la correction automatique a rencontré un problème. Voici la réponse attendue.",
            "cours_rappel": sub_q.get("cours_associe", "")
        }
    
    # 4. Enrichir le résultat
    result["reponse_attendue"] = sub_q.get("reponse_attendue", "")
    result["points_max"] = sub_q.get("points", 0)
    result["points_obtenus"] = {0: 0, 1: sub_q.get("points", 0) * 0.5, 2: sub_q.get("points", 0)}.get(result.get("est_correct", 0), 0)
    
    # 5. Enregistrer dans la BDD
    async with aiosqlite.connect(settings.DB_PATH) as db:
        await db.execute(
            """INSERT INTO resultats 
               (utilisateur_id, question_id, matiere, chapitre,
                reponse_donnee, est_correct, score_obtenu, score_max,
                indice_utilise, temps_reponse_sec, image_reponse_path)
               VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (submission.sub_question_id,
             exercise.get("matiere", ""),
             exercise.get("chapitre", ""),
             result.get("transcription", ""),
             result.get("est_correct", 0),
             result["points_obtenus"],
             result["points_max"],
             submission.indice_utilise,
             submission.temps_reponse_sec,
             img_path)
        )
        await db.commit()
    
    return result
```

### 2.3 Mettre à jour `backend/main.py`

Ajouter le nouveau router :
```python
from routers import exercices, correction, correction_redige, progression

app.include_router(correction_redige.router, prefix="/api")
```

### 2.4 Endpoint pour lister les exercices rédigés d'un chapitre

Ajouter dans `backend/routers/exercices.py` :

```python
@router.get("/redige/{matiere}/{chapitre}")
async def exercices_rediges(matiere: str, chapitre: str):
    """Retourne les exercices rédigés d'un chapitre avec leurs sous-questions."""
    all_q = load_all_questions()
    result = []
    for annale in all_q.get(matiere, []):
        for ex in annale.get("exercices", []):
            if ex.get("chapitre") == chapitre and "sous_questions" in ex:
                result.append(ex)
    if not result:
        raise HTTPException(404, f"Aucun exercice rédigé pour {matiere}/{chapitre}")
    return {"matiere": matiere, "chapitre": chapitre, "exercices": result}
```

---

## 3. Frontend — Canvas manuscrit

### 3.1 Installer les dépendances

```bash
cd frontend
npm install fabric
```

Note : `@types/fabric` devrait déjà être installé (Run 0). Si erreurs TS, ajouter en haut du composant : `// @ts-nocheck`

### 3.2 Créer `frontend/src/components/DrawingCanvas.tsx`

```tsx
import { useRef, useEffect, useState, useCallback } from 'react'
import { fabric } from 'fabric'

interface Props {
  onExport: (base64: string) => void
  width?: number
  height?: number
}

export default function DrawingCanvas({ onExport, width = 900, height = 400 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const [brushColor, setBrushColor] = useState('#1A1A2E')
  const [brushWidth, setBrushWidth] = useState(2)
  const [isEraser, setIsEraser] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      backgroundColor: '#FFFFFF',
      width,
      height
    })
    
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas)
    canvas.freeDrawingBrush.color = brushColor
    canvas.freeDrawingBrush.width = brushWidth
    
    fabricRef.current = canvas
    
    return () => { canvas.dispose() }
  }, [])

  useEffect(() => {
    if (!fabricRef.current) return
    const brush = fabricRef.current.freeDrawingBrush
    if (isEraser) {
      brush.color = '#FFFFFF'
      brush.width = 20
    } else {
      brush.color = brushColor
      brush.width = brushWidth
    }
  }, [brushColor, brushWidth, isEraser])

  const handleClear = useCallback(() => {
    if (!fabricRef.current) return
    fabricRef.current.clear()
    fabricRef.current.backgroundColor = '#FFFFFF'
    fabricRef.current.renderAll()
  }, [])

  const handleUndo = useCallback(() => {
    if (!fabricRef.current) return
    const objects = fabricRef.current.getObjects()
    if (objects.length > 0) {
      fabricRef.current.remove(objects[objects.length - 1])
      fabricRef.current.renderAll()
    }
  }, [])

  const handleExport = useCallback(() => {
    if (!fabricRef.current) return
    const dataUrl = fabricRef.current.toDataURL({ format: 'png', quality: 0.9 })
    // Retirer le préfixe "data:image/png;base64,"
    const base64 = dataUrl.split(',')[1]
    onExport(base64)
  }, [onExport])

  const toolbarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    padding: '8px 12px',
    background: '#F3F4F6',
    borderRadius: '8px 8px 0 0',
    flexWrap: 'wrap'
  }

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: active ? '2px solid var(--accent-blue)' : '1px solid #D1D5DB',
    background: active ? '#EFF6FF' : 'white',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: active ? 600 : 400,
    minHeight: '44px'
  })

  return (
    <div style={{ border: '1px solid #E5E7EB', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={toolbarStyle}>
        {/* Couleurs */}
        {['#1A1A2E', '#2563EB', '#DC2626'].map(c => (
          <button
            key={c}
            onClick={() => { setBrushColor(c); setIsEraser(false) }}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: c,
              border: brushColor === c && !isEraser ? '3px solid var(--accent-blue)' : '2px solid #D1D5DB',
              cursor: 'pointer'
            }}
          />
        ))}
        
        <div style={{ width: 1, height: 24, background: '#D1D5DB', margin: '0 4px' }} />
        
        {/* Épaisseur */}
        {[1, 2, 4].map(w => (
          <button
            key={w}
            onClick={() => { setBrushWidth(w); setIsEraser(false) }}
            style={btnStyle(brushWidth === w && !isEraser)}
          >
            {'─'.repeat(w)}
          </button>
        ))}
        
        <div style={{ width: 1, height: 24, background: '#D1D5DB', margin: '0 4px' }} />
        
        {/* Outils */}
        <button onClick={() => setIsEraser(!isEraser)} style={btnStyle(isEraser)}>
          🧹 Gomme
        </button>
        <button onClick={handleUndo} style={btnStyle()}>
          ↩️ Annuler
        </button>
        <button onClick={handleClear} style={btnStyle()}>
          🗑️ Effacer tout
        </button>
        
        <div style={{ flex: 1 }} />
        
        <button
          onClick={handleExport}
          style={{
            ...btnStyle(),
            background: 'var(--accent-blue)',
            color: 'white',
            border: 'none',
            fontWeight: 600
          }}
        >
          ✅ Valider ma réponse
        </button>
      </div>
      
      {/* Canvas */}
      <canvas ref={canvasRef} style={{ display: 'block', touchAction: 'none' }} />
    </div>
  )
}
```

### 3.3 Créer `frontend/src/pages/ExerciceRedige.tsx`

```tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DrawingCanvas from '../components/DrawingCanvas'
import MathRender from '../components/MathRender'
import Timer from '../components/Timer'

export default function ExerciceRedige() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  
  const [exercise, setExercise] = useState<any>(null)
  const [currentQIndex, setCurrentQIndex] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [hintUsed, setHintUsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [startTime] = useState(Date.now())
  
  useEffect(() => {
    fetch(`/api/exercices/${exerciseId}`)
      .then(r => r.json())
      .then(setExercise)
  }, [exerciseId])
  
  if (!exercise) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>
  
  const questions = exercise.sous_questions || []
  const currentQ = questions[currentQIndex]
  
  if (!currentQ) return <div>Aucune question trouvée.</div>

  const handleSubmit = async (imageBase64: string) => {
    setLoading(true)
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    
    try {
      const res = await fetch('/api/correction/redige', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: exerciseId,
          sub_question_id: currentQ.id,
          image_base64: imageBase64,
          indice_utilise: hintUsed ? 1 : 0,
          temps_reponse_sec: elapsed
        })
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setResult({
        est_correct: 0,
        feedback: "Erreur de connexion au serveur de correction.",
        reponse_attendue: currentQ.reponse_attendue,
        cours_rappel: currentQ.cours_associe
      })
    }
    setLoading(false)
  }
  
  const handleNext = () => {
    setResult(null)
    setShowHint(false)
    setHintUsed(false)
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(currentQIndex + 1)
    } else {
      navigate('/dashboard')
    }
  }
  
  const handleHint = () => {
    setShowHint(true)
    setHintUsed(true)
  }

  // Couleur feedback
  const feedbackStyle = (level: number): React.CSSProperties => ({
    padding: '20px',
    borderRadius: 'var(--radius)',
    marginTop: '20px',
    border: '2px solid',
    borderColor: level === 2 ? 'var(--correct-border)' : level === 1 ? 'var(--partial-border)' : 'var(--incorrect-border)',
    background: level === 2 ? 'var(--correct-bg)' : level === 1 ? 'var(--partial-bg)' : 'var(--incorrect-bg)'
  })

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>{exercise.titre}</h2>
          <span style={{ color: 'var(--text-secondary)' }}>
            Question {currentQIndex + 1}/{questions.length} — {currentQ.points} pts
          </span>
        </div>
        <Timer />
      </div>
      
      {/* Énoncé */}
      <div style={{
        background: '#F0F4FF',
        padding: '16px 20px',
        borderRadius: 'var(--radius)',
        borderLeft: '4px solid var(--accent-blue)',
        marginBottom: '20px',
        fontSize: '1.05rem',
        lineHeight: 1.7
      }}>
        <strong style={{ color: 'var(--accent-blue)' }}>{currentQ.id}</strong>
        <span style={{ marginLeft: 12 }}>{currentQ.enonce_court}</span>
      </div>
      
      {/* Indice */}
      {!result && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={handleHint}
            disabled={hintUsed}
            style={{
              padding: '10px 20px',
              borderRadius: 'var(--radius)',
              border: '1px solid #D1D5DB',
              background: hintUsed ? '#F3F4F6' : 'white',
              cursor: hintUsed ? 'default' : 'pointer',
              color: hintUsed ? 'var(--text-light)' : 'var(--accent-blue)',
              fontWeight: 500
            }}
          >
            💡 {hintUsed ? 'Indice affiché' : 'Voir l\'indice'}
          </button>
          
          {showHint && (
            <div style={{
              marginTop: 8,
              padding: '12px 16px',
              background: '#FFFBEB',
              borderRadius: 8,
              borderLeft: '4px solid var(--accent-orange)',
              color: '#92400E'
            }}>
              💡 {currentQ.indice}
            </div>
          )}
        </div>
      )}
      
      {/* Canvas OU Résultat */}
      {!result ? (
        <>
          {loading ? (
            <div style={{
              padding: 60,
              textAlign: 'center',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                Correction en cours... Gemini analyse ta réponse.
              </p>
            </div>
          ) : (
            <DrawingCanvas onExport={handleSubmit} width={1000} height={350} />
          )}
        </>
      ) : (
        <div>
          {/* Feedback */}
          <div style={feedbackStyle(result.est_correct)}>
            {result.est_correct === 2 && <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>🎉</div>}
            {result.est_correct === 1 && <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>👍</div>}
            {result.est_correct === 0 && <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📚</div>}
            
            {/* Transcription */}
            {result.transcription && (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 8 }}>
                Ta réponse lue : {result.transcription}
              </p>
            )}
            
            {/* Feedback principal */}
            <p style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>{result.feedback}</p>
            
            {/* Rappel de cours */}
            {result.cours_rappel && (
              <div style={{
                marginTop: 12,
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.7)',
                borderRadius: 8
              }}>
                <strong>📚 Rappel de cours :</strong>
                <p style={{ marginTop: 4 }}>{result.cours_rappel}</p>
              </div>
            )}
            
            {/* Réponse attendue */}
            <div style={{
              marginTop: 12,
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.7)',
              borderRadius: 8
            }}>
              <strong>✅ Réponse attendue :</strong>
              <p style={{ marginTop: 4 }}>
                <MathRender latex={result.reponse_attendue || ''} />
              </p>
            </div>
          </div>
          
          {/* Bouton suivant */}
          <div style={{ marginTop: 20, textAlign: 'right' }}>
            <button
              onClick={handleNext}
              style={{
                padding: '14px 32px',
                borderRadius: 'var(--radius)',
                background: 'var(--accent-blue)',
                color: 'white',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {currentQIndex < questions.length - 1 ? 'Question suivante →' : 'Terminer →'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 3.4 Ajouter la route

Dans `App.tsx`, ajouter :
```tsx
import ExerciceRedige from './pages/ExerciceRedige'

// Dans <Routes> :
<Route path="/exercice/:exerciseId" element={<ExerciceRedige />} />
```

### 3.5 Mettre à jour `RevisionPlan.tsx`

Les blocs "Maths Spé" et "PC" ne doivent plus être grisés. Le bouton "Lancer" doit pointer vers `/exercice/{exerciseId}` (pas `/qcm/`).

Logique de détection :
- Si l'exercice a un champ `questions` → QCM → `/qcm/{id}`
- Si l'exercice a un champ `sous_questions` → rédigé → `/exercice/{id}`

### 3.6 Mettre à jour `api.ts`

Ajouter :
```typescript
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
```

---

## 4. Gestion du canvas sur tablette

### Points critiques

1. **`touchAction: 'none'`** sur le canvas — empêche le scroll pendant le dessin
2. **Taille dynamique** — adapter le canvas à la largeur de l'écran :
```tsx
const canvasWidth = Math.min(window.innerWidth - 40, 1000)
```
3. **Pression du stylet** — fabric.js supporte nativement la pression via les événements Pointer. Pas de config supplémentaire.
4. **Performance** — ne pas exporter le canvas à chaque trait, seulement au clic "Valider"
5. **Poids de l'image** — le PNG exporté fait ~50-200Ko en base64, c'est acceptable pour l'API Gemini

---

## 5. Gestion d'erreur Gemini

### Cas à gérer

| Cas | Comportement |
|-----|-------------|
| Clé API absente | Message d'erreur clair : "Clé API Gemini non configurée" |
| Timeout (>30s) | Retry 1 fois, puis fallback avec réponse attendue affichée |
| Réponse Gemini mal formée | Fallback : afficher la réponse attendue + cours |
| Canvas vide soumis | Détection côté frontend : alerter "Tu n'as rien écrit !" |
| Image trop grosse (>5Mo) | Réduire la qualité d'export (quality: 0.7) |

### Détection canvas vide (frontend)

Avant d'appeler `onExport`, vérifier :
```tsx
const objects = fabricRef.current.getObjects()
if (objects.length === 0) {
  alert("Tu n'as encore rien écrit ! Utilise le stylet pour répondre.")
  return
}
```

---

## 6. Tests de validation Run 3

| # | Test | Action | Attendu |
|---|------|--------|---------|
| 1 | Page exercice rédigé | Naviguer vers `/exercice/MSPE2025-I` | Énoncé affiché, canvas visible |
| 2 | Dessin | Écrire au doigt/souris sur le canvas | Trait visible, couleur correcte |
| 3 | Outils | Tester gomme, annuler, effacer tout | Fonctionnels |
| 4 | Indice | Cliquer "Voir l'indice" | Indice affiché, bouton grisé |
| 5 | Soumission | Écrire "2x²" et cliquer Valider | Chargement puis feedback |
| 6 | Feedback correct | Écrire la bonne réponse | Message vert encourageant |
| 7 | Feedback incorrect | Écrire n'importe quoi | Message avec cours + correction |
| 8 | Canvas vide | Cliquer Valider sans rien écrire | Alerte "Tu n'as rien écrit" |
| 9 | Question suivante | Cliquer "Question suivante" après correction | Nouvelle question, canvas vierge |
| 10 | Plan mis à jour | Retour au plan de révision | Blocs Maths Spé et PC cliquables |
| 11 | Tablette | Tester sur iPad ou en 1024×768 | Canvas utilisable, pas de scroll parasite |

**Test critique** : le test 5 — la correction LLM de bout en bout doit fonctionner (dépend de la clé API Gemini).

---

## 7. Git

```bash
git add .
git commit -m "Run 3: handwriting canvas + Gemini OCR correction for written exercises"
git push origin main
git tag -a run3-ok -m "Run 3 stable - canvas + OCR + LLM correction"
git push origin run3-ok
```

DEVLOG.md et CHANGELOG.md à jour.

---

## 8. Rappels Léo

- La clé API Gemini DOIT être dans `.env` sinon rien ne marche
- Le modèle Gemini est `gemini-2.0-flash` (le plus rapide). Si ça ne marche pas, essayer `gemini-2.0-flash-lite` ou `gemini-1.5-flash`. Vérifier la doc Google pour le nom exact du modèle disponible avec la clé de JB.
- fabric.js v5 utilise `new fabric.Canvas()`, v6 a changé l'API. Vérifier quelle version est installée avec `npm ls fabric`
- Le canvas DOIT avoir `touchAction: 'none'` en CSS sinon le scroll de la page interfère avec le dessin
- Les images PNG en base64 sont envoyées SANS le préfixe `data:image/png;base64,`
- Tester d'abord avec un appel curl direct pour vérifier que l'API Gemini répond :
```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=VOTRE_CLE" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Dis bonjour"}]}]}'
```
- Rollback si nécessaire : `git checkout run2-ok`
