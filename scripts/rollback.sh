#!/bin/bash
# Rollback vers un tag Git stable
TAG=${1:-"run4-ok"}
PROJ="/root/.openclaw/workspace-coder/projects/polytech-revision"

echo "=== ROLLBACK vers $TAG ==="

# 1. Backup de sécurité
$PROJ/scripts/backup.sh

# 2. Git rollback
cd $PROJ
git stash
git checkout $TAG

# 3. Réinstaller les dépendances
cd backend
/usr/local/bin/python3.10 -m pip install -r requirements.txt

cd ../frontend
npm install
npm run build

# 4. Restart
systemctl restart polytech-backend
systemctl reload nginx

sleep 3
echo "=== ROLLBACK TERMINÉ ==="
curl -s http://localhost:8042/api/health 2>/dev/null || echo "Backend: UNREACHABLE"
