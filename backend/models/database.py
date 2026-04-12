import aiosqlite
import os
from config import settings

DB_PATH = settings.DB_PATH

async def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(SCHEMA)
        await db.commit()

SCHEMA = """
CREATE TABLE IF NOT EXISTS utilisateur (
    id INTEGER PRIMARY KEY,
    prenom TEXT NOT NULL,
    date_creation TEXT DEFAULT (datetime('now')),
    nb_etapes_revision INTEGER DEFAULT 5,
    etape_courante INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS resultats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER REFERENCES utilisateur(id),
    question_id TEXT NOT NULL,
    matiere TEXT NOT NULL,
    chapitre TEXT NOT NULL,
    date_reponse TEXT DEFAULT (datetime('now')),
    reponse_donnee TEXT,
    est_correct INTEGER DEFAULT 0,
    score_obtenu REAL DEFAULT 0,
    score_max REAL DEFAULT 0,
    indice_utilise INTEGER DEFAULT 0,
    temps_reponse_sec INTEGER DEFAULT 0,
    image_reponse_path TEXT
);

CREATE TABLE IF NOT EXISTS progression (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER REFERENCES utilisateur(id),
    matiere TEXT NOT NULL,
    chapitre TEXT NOT NULL,
    niveau TEXT DEFAULT 'non_vu'
        CHECK(niveau IN ('non_vu','en_cours','fragile','acquis','maitrise')),
    score_moyen REAL DEFAULT 0,
    nb_questions_faites INTEGER DEFAULT 0,
    nb_correct INTEGER DEFAULT 0,
    derniere_activite TEXT,
    UNIQUE(utilisateur_id, matiere, chapitre)
);

CREATE TABLE IF NOT EXISTS simulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utilisateur_id INTEGER REFERENCES utilisateur(id),
    date_simulation TEXT DEFAULT (datetime('now')),
    duree_totale_sec INTEGER,
    score_qcm REAL,
    score_maths_spe REAL,
    score_pc REAL,
    score_total REAL,
    note_sur_20 REAL
);

-- Seed : créer Garance
INSERT OR IGNORE INTO utilisateur (id, prenom) VALUES (1, 'Garance');
"""