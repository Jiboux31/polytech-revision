# HOTFIX_ENONCES_PDF.md — Afficher les énoncés complets avec schémas

> **Problème** : Les exercices rédigés (PC, Maths Spé) n'affichent que le `enonce_court` (une phrase).
> Il manque les schémas, données numériques, graphiques, formules — tout ce qui est dans le PDF original.
> **Solution** : Servir les pages PDF comme images PNG et les afficher dans le frontend.

---

## 1. Backend — Servir les pages PDF comme images

### 1.1 Installer les dépendances

```bash
apt-get install -y poppler-utils    # pour pdftoppm
```

`pdftoppm` convertit une page PDF en image. C'est léger, rapide, déjà disponible sur la plupart des Ubuntu.

### 1.2 Créer `backend/services/pdf_service.py`

```python
import os
import subprocess
from config import settings

ANNALES_DIR = os.path.join(settings.DATA_DIR, "annales")
CACHE_DIR = os.path.join(settings.DATA_DIR, "page_cache")

def get_pdf_page_image(pdf_filename: str, page_number: int) -> str | None:
    """Convertit une page PDF en PNG et retourne le chemin du fichier.
    
    Utilise un cache : si l'image existe déjà, on ne reconvertit pas.
    """
    os.makedirs(CACHE_DIR, exist_ok=True)
    
    # Nom du fichier cache
    base_name = pdf_filename.replace(".pdf", "")
    cache_path = os.path.join(CACHE_DIR, f"{base_name}_page{page_number}.png")
    
    # Si déjà en cache, retourner directement
    if os.path.exists(cache_path):
        return cache_path
    
    # Sinon, convertir
    pdf_path = os.path.join(ANNALES_DIR, pdf_filename)
    if not os.path.exists(pdf_path):
        return None
    
    # pdftoppm : -f = first page, -l = last page, -png = format, -r = resolution
    output_prefix = os.path.join(CACHE_DIR, f"{base_name}_page{page_number}")
    try:
        subprocess.run([
            "pdftoppm",
            "-f", str(page_number),
            "-l", str(page_number),
            "-png",
            "-r", "200",          # 200 DPI : bon compromis lisibilité / poids
            "-singlefile",
            pdf_path,
            output_prefix
        ], check=True, capture_output=True)
        
        # pdftoppm avec -singlefile produit output_prefix.png
        result_path = f"{output_prefix}.png"
        if os.path.exists(result_path):
            return result_path
    except subprocess.CalledProcessError:
        pass
    
    return None
```

### 1.3 Ajouter l'endpoint dans `backend/routers/exercices.py`

```python
from fastapi.responses import FileResponse
from services.pdf_service import get_pdf_page_image

@router.get("/pdf-page/{pdf_filename}/{page_number}")
async def get_page_image(pdf_filename: str, page_number: int):
    """Retourne une page de PDF comme image PNG."""
    image_path = get_pdf_page_image(pdf_filename, page_number)
    if not image_path:
        raise HTTPException(404, f"Page {page_number} de {pdf_filename} introuvable")
    return FileResponse(image_path, media_type="image/png")
```

### 1.4 Déposer les PDFs

Les PDFs des annales doivent être dans :
```
backend/data/annales/
├── EnonceGP2025VF.pdf
├── Sujetcomplet2024.pdf
├── corrigemaths2025.pdf
├── corrigePC2025.pdf
├── corrigemaths2024.pdf
└── corrigePC2024.pdf
```

JB doit les copier sur le VPS si ce n'est pas déjà fait.

---

## 2. Frontend — Afficher l'image de l'énoncé

### 2.1 Modifier `ExerciceRedige.tsx`

Ajouter au-dessus du canvas, après le header de l'exercice :

```tsx
{/* Énoncé complet depuis le PDF */}
{exercise.source_pdf && exercise.pages_enonce && (
  <div style={{
    marginBottom: 20,
    background: 'white',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    overflow: 'hidden'
  }}>
    <div style={{
      padding: '8px 16px',
      background: '#F0F4FF',
      borderBottom: '1px solid #E5E7EB',
      fontSize: '0.85rem',
      color: 'var(--accent-blue)',
      fontWeight: 600
    }}>
      📄 Énoncé complet — Concours Geipi Polytech {exercise.annee}
    </div>
    {exercise.pages_enonce.map((page: number) => (
      <img
        key={page}
        src={`/api/exercices/pdf-page/${exercise.source_pdf}/${page}`}
        alt={`Énoncé page ${page}`}
        style={{
          width: '100%',
          display: 'block'
        }}
        loading="lazy"
      />
    ))}
  </div>
)}

{/* Puis le enonce_court de la sous-question courante */}
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
```

### 2.2 L'image de l'énoncé est chargée à la demande

Le premier chargement prend 1-2s (conversion PDF → PNG). Ensuite c'est en cache et quasi instantané.

Pour éviter un écran blanc pendant le chargement, ajouter un state de chargement :

```tsx
const [imageLoaded, setImageLoaded] = useState(false)

// Dans le <img> :
onLoad={() => setImageLoaded(true)}
style={{
  width: '100%',
  display: 'block',
  opacity: imageLoaded ? 1 : 0,
  transition: 'opacity 0.3s'
}}

// Placeholder pendant le chargement :
{!imageLoaded && (
  <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
    Chargement de l'énoncé...
  </div>
)}
```

---

## 3. Vérification du JSON existant

Les fichiers JSON des exercices rédigés doivent avoir ces champs au niveau exercice :

```json
{
  "source_pdf": "EnonceGP2025VF.pdf",
  "pages_enonce": [6],
  ...
}
```

Vérifier dans :
- `maths_spe_2025.json` : pages 4 et 5
- `pc_2025.json` : pages 6, 7, 8
- `maths_spe_2024.json` : pages 4 et 5
- `pc_2024.json` : pages 6, 7, 8

Les numéros de page correspondent au PDF original (EnonceGP2025VF.pdf et Sujetcomplet2024.pdf).

**Attention** : `pdftoppm` utilise la numérotation à partir de 1 (pas 0). Vérifier que les `pages_enonce` dans le JSON correspondent bien.

---

## 4. Pages spécifiques par sous-question (optionnel mais recommandé)

Certains exercices s'étalent sur 2 pages. Pour afficher la bonne page selon la question :

Ajouter un champ optionnel `page_enonce` au niveau de chaque sous-question :

```json
{
  "id": "PC2025-III-8",
  "enonce_court": "τ₂ lors de la décharge",
  "page_enonce": 8,
  ...
}
```

Si ce champ existe, afficher cette page spécifique. Sinon, afficher toutes les `pages_enonce` de l'exercice parent.

---

## 5. Git

```bash
git add .
git commit -m "Hotfix: serve PDF pages as images for complete exercise display with diagrams"
git push origin main
```
