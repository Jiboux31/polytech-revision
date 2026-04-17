#!/bin/bash
# Status rapide de l'application
echo "=== PolytechRevision Status ==="
echo ""

echo "Backend:"
systemctl is-active polytech-backend 2>/dev/null || echo "  Service non configuré"
curl -s http://localhost:8042/health 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print('  Health:', d.get('status','FAIL'))" 2>/dev/null || echo "  UNREACHABLE"

echo ""
echo "Nginx (polytech):"
ls /etc/nginx/sites-enabled/polytech >/dev/null 2>&1 && echo "  Config active" || echo "  Config ABSENTE"
curl -s -o /dev/null -w "  HTTP %{http_code}" http://localhost:8080/ 2>/dev/null
echo ""

echo ""
echo "BDD:"
ls -lh /root/.openclaw/workspace-coder/projects/polytech-revision/backend/data/polytech.db 2>/dev/null || echo "  PAS DE BDD"

echo ""
echo "Disk:"
df -h / | tail -1

echo ""
echo "RAM:"
free -h | head -2

echo ""
echo "Last backup:"
ls -t /root/backups/polytech-revision/polytech-*.db 2>/dev/null | head -1 || echo "  Aucun backup"
