import os
import subprocess
from PIL import Image
from config import settings
from services.pdf_service import get_pdf_page_image

CACHE_DIR = os.path.join(settings.DATA_DIR, "page_cache")

def get_pdf_crop(pdf_filename: str, page: int, 
                 top: float, bottom: float, left: float, right: float) -> str | None:
    """Retourne un crop d'une page PDF comme image PNG.
    
    top, bottom, left, right : fractions de la page (0.0 à 1.0).
    Ex: top=0.05, bottom=0.45 = la moitié haute de la page.
    """
    os.makedirs(CACHE_DIR, exist_ok=True)
    
    crop_id = f"{pdf_filename.replace('.pdf','')}_{page}_{int(top*100)}_{int(bottom*100)}_{int(left*100)}_{int(right*100)}"
    cache_path = os.path.join(CACHE_DIR, f"{crop_id}.png")
    
    if os.path.exists(cache_path):
        return cache_path
    
    # D'abord, obtenir la page complète
    full_page = get_pdf_page_image(pdf_filename, page)
    if not full_page:
        return None
    
    # Cropper avec Pillow
    img = Image.open(full_page)
    w, h = img.size
    box = (int(left * w), int(top * h), int(right * w), int(bottom * h))
    cropped = img.crop(box)
    cropped.save(cache_path, "PNG")
    
    return cache_path
