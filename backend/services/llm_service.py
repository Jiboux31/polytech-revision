import os
import json
import base64
import httpx
import re
from config import settings

GEMINI_API_URL = settings.GEMINI_API_URL

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
    
    # Timeout augmenté à 60s pour les analyses d'images lourdes
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
    
    # Extraire le texte de la réponse Gemini
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        
        # Nettoyage si Gemini a entouré de blocs de code markdown
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\n", "", text)
            text = re.sub(r"\n```$", "", text)
            
        return json.loads(text)
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        # Fallback si le JSON est mal formé ou absent
        raw = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        print(f"DEBUG: Gemini raw output: {raw}")
        
        # Tenter une reconstruction minimale si on a du texte
        if raw:
            return {
                "transcription": "[Analyse visuelle]",
                "est_correct": 1,
                "feedback": raw, 
                "cours_rappel": ""
            }
            
        return {"transcription": "", "est_correct": 0, "feedback": "Erreur d'analyse de la réponse.", "cours_rappel": ""}


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
1. Analyse l'image fournie. Elle peut contenir du texte manuscrit, des calculs ou un SCHÉMA (bilan des forces, circuit, graphique).
2. Transcris ou décris précisément ce que tu vois (ex: "Schéma d'un solide sur une pente avec les forces P et R bien orientées").
3. Compare avec la réponse attendue. Pour un schéma de physique, vérifie l'orientation des vecteurs et la cohérence physique.
4. Évalue : 2 = correct, 1 = partiellement correct, 0 = incorrect ou vide.
5. Rédige un feedback pédagogique adapté.

RÈGLES DE FEEDBACK :
- Utilise TOUJOURS le format LaTeX entre des symboles $ pour les formules mathématiques (ex: $a_n = \\frac{{V^2}}{{R}}$, $x^2$, etc.).
- Si correct (2) : un message d'encouragement court et chaleureux. Pas besoin de rappel de cours.
- Si partiellement correct (1) : valorise ce qui est bon, puis explique l'erreur avec le rappel de cours suivant, et enfin donne la réponse complète.
- Si incorrect ou vide (0) : pas de jugement négatif, rappelle le cours ci-dessous, puis donne la réponse expliquée pas à pas.

COURS À RAPPELER (si nécessaire) :
{cours_associe}

Réponds UNIQUEMENT en JSON avec cette structure exacte :
{{
  "transcription": "description de ce que tu lis ou vois",
  "est_correct": 0 ou 1 ou 2,
  "parties_correctes": "ce qui est juste",
  "erreurs": "les erreurs identifiées",
  "feedback": "le message complet pour Garance",
  "cours_rappel": "le rappel de cours si nécessaire"
}}"""

    return await call_gemini_vision(image_base64, prompt)
