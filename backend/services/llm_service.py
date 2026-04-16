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
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
    
    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r"^```(?:json)?\n", "", text)
            text = re.sub(r"\n```$", "", text)
        return json.loads(text)
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        raw = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
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
1. Analyse l'image fournie (texte, calculs ou schéma).
2. Transcris précisément ce que tu vois.
3. Compare avec la réponse attendue.
4. Évalue : 2 = correct, 1 = partiellement correct, 0 = incorrect.
5. Rédige un feedback LaTeX-friendly.

Réponds UNIQUEMENT en JSON avec cette structure :
{{
  "transcription": "...",
  "est_correct": 0|1|2,
  "parties_correctes": "...",
  "erreurs": "...",
  "feedback": "...",
  "cours_rappel": "..."
}}"""
    return await call_gemini_vision(image_base64, prompt)


async def call_gemini_text(prompt: str, model: str = None, is_json: bool = False) -> str:
    """Appelle Gemini avec un prompt texte uniquement."""
    model = model or settings.GEMINI_MODEL_FAST
    url = f"{settings.GEMINI_API_URL}/{model}:generateContent?key={settings.GEMINI_API_KEY}"

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 8192
        }
    }
    
    if is_json:
        payload["generationConfig"]["responseMimeType"] = "application/json"

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return text.strip()
    except (KeyError, IndexError):
        return ""
