# Tests E2E PolytechRevision

## Outil
Script Playwright (Firefox headless).

## Lancer les tests
```bash
# Tous les tests
python3 tests/e2e/polytech_e2e.py --all

# Par domaine
python3 tests/e2e/polytech_e2e.py --tag qcm

# Relancer uniquement les échecs
python3 tests/e2e/polytech_e2e.py --rerun-fails
```

## Structure
- `polytech_e2e.py` : Runner principal
- `scenarios.py` : Définition des tests
- `fixtures/` : Images pour tests manuscrits
- `reports/` : Comptes-rendus Markdown
- `screenshots/` : Captures d'écran en cas d'erreur
