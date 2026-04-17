#!/bin/bash
# Backup de la BDD et des images de réponses
PROJ="/root/.openclaw/workspace-coder/projects/polytech-revision"
BACKUP_DIR="/root/backups/polytech-revision"
DATE=$(date +%Y%m%d-%H%M)

mkdir -p $BACKUP_DIR

# BDD SQLite
cp $PROJ/backend/data/polytech.db $BACKUP_DIR/polytech-$DATE.db

# Images des réponses manuscrites
if [ -d "$PROJ/backend/data/reponses_images" ]; then
  tar czf $BACKUP_DIR/reponses-$DATE.tar.gz -C $PROJ/backend/data reponses_images/
fi

# Garder les 10 derniers backups
ls -t $BACKUP_DIR/polytech-*.db | tail -n +11 | xargs rm -f 2>/dev/null
ls -t $BACKUP_DIR/reponses-*.tar.gz | tail -n +11 | xargs rm -f 2>/dev/null

echo "Backup OK: $BACKUP_DIR/polytech-$DATE.db"
