#!/bin/bash
# Restart propre des services
echo "Restarting backend..."
systemctl restart polytech-backend
sleep 3
# Test backend
curl -s http://localhost:8042/api/health | python3 -c "import sys,json; d=json.load(sys.stdin); print('Backend:', d.get('status','FAIL'))" 2>/dev/null || echo "Backend: UNREACHABLE"

echo "Rebuilding frontend..."
cd /root/.openclaw/workspace-coder/projects/polytech-revision/frontend
npm run build
mkdir -p /var/www/polytech
cp -r dist/* /var/www/polytech/
chown -R www-data:www-data /var/www/polytech/
systemctl reload nginx
sleep 2
echo "Frontend: OK (Nginx reloaded)"
