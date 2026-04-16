# generate_fixtures.py
from PIL import Image, ImageDraw, ImageFont
import os
import requests

FIXTURES_DIR = os.path.dirname(os.path.abspath(__file__))
WIDTH, HEIGHT = 800, 400
BG_COLOR = (255, 255, 255)
TEXT_COLOR = (20, 20, 40)
FONT_PATH = os.path.join(FIXTURES_DIR, "caveat.ttf")
FONT_SIZE = 42

def download_font():
    if not os.path.exists(FONT_PATH):
        print("Téléchargement de la police Caveat...")
        url = "https://github.com/google/fonts/raw/main/ofl/caveat/Caveat-Regular.ttf"
        r = requests.get(url)
        with open(FONT_PATH, 'wb') as f:
            f.write(r.content)
        print("Police téléchargée.")

def create_fixture(text_lines, filename):
    img = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype(FONT_PATH, FONT_SIZE)
    except Exception as e:
        print(f"WARN: police manuscrit non trouvée ({e}), utilisation défaut")
        font = ImageFont.load_default()
    
    y_offset = 30
    for line in text_lines:
        draw.text((40, y_offset), line, fill=TEXT_COLOR, font=font)
        y_offset += FONT_SIZE + 15
    
    filepath = os.path.join(FIXTURES_DIR, filename)
    img.save(filepath, "PNG")
    print(f"Fixture créée : {filepath}")

if __name__ == "__main__":
    download_font()
    
    create_fixture(
        ["g'(x) = 6x² + 1/x"],
        "fixture_correct.png"
    )

    create_fixture(
        ["g'(x) = 6x² + 1", "(dérivée de ln(x) = 1 je crois)"],
        "fixture_partielle.png"
    )

    create_fixture(
        ["g'(x) = 2x² + x"],
        "fixture_fausse.png"
    )

    create_fixture(
        [],  # Image blanche
        "fixture_vide.png"
    )
