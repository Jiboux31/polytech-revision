# Journal de développement — PolytechRevision

## 2026-04-12 — Run 0

### Décisions
- Port backend : 8042
- Port frontend : 5173
- BDD : SQLite (fichier unique dans backend/data/)
- Pas de Docker pour le MVP (trop lourd pour 4Go RAM)

### Notes
- Python 3.10 via /usr/local/bin/python3.10
- pip via python3.10 -m pip (pip/pip3 cassé sur Ubuntu 20.04)
- La dépendance httpx a été mise à jour à `httpx>=0.28.1` pour assurer la compatibilité avec `google-genai==1.14.0`.
- **Firewall** : Ouverture des ports 5173 (TCP) et 8042 (TCP) via UFW sur le VPS pour permettre l'accès réseau à l'application.