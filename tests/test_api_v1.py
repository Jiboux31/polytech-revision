import httpx
import pytest
import base64

BASE_URL = "http://127.0.0.1:8042"

@pytest.mark.asyncio
async def test_health():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

@pytest.mark.asyncio
async def test_get_plan():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/exercices/plan")
        assert response.status_code == 200
        data = response.json()
        assert "jours" in data
        assert len(data["jours"]) == 5

@pytest.mark.asyncio
async def test_get_chapter_exercises():
    async with httpx.AsyncClient() as client:
        # On teste un chapitre connu (probabilites en minuscules)
        response = await client.get(f"{BASE_URL}/api/exercices/chapitre/maths_qcm/probabilites")
        assert response.status_code == 200
        data = response.json()
        assert data["matiere"] == "maths_qcm"
        assert len(data["exercices"]) > 0

@pytest.mark.asyncio
async def test_correction_qcm():
    async with httpx.AsyncClient() as client:
        payload = {
            "exercise_id": "QCM2025-I",
            "reponses": {
                "QCM2025-I-1": True,
                "QCM2025-I-2": False
            }
        }
        response = await client.post(f"{BASE_URL}/api/correction/qcm", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "nb_correct" in data
        assert "feedback" in data

@pytest.mark.asyncio
async def test_get_redige_exercises():
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/exercices/redige/maths_specialite/analyse_fonctions")
        assert response.status_code == 200
        data = response.json()
        assert data["matiere"] == "maths_specialite"
        assert len(data["exercices"]) > 0
        assert "sous_questions" in data["exercices"][0]

@pytest.mark.asyncio
async def test_correction_redige():
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Image 1x1 pixel PNG blanche en base64
        dummy_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII="
        payload = {
            "exercise_id": "MSPE2025-I",
            "sub_question_id": "MSPE2025-I-1",
            "image_base64": dummy_image,
            "indice_utilise": 0,
            "temps_reponse_sec": 10
        }
        response = await client.post(f"{BASE_URL}/api/correction/redige", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "est_correct" in data
        assert "feedback" in data
        assert "points_obtenus" in data
