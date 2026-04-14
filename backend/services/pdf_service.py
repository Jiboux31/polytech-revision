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
