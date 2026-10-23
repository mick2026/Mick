#!/data/data/com.termux/files/usr/bin/bash
# Avvia Studio Amico in Termux e apre il browser.
cd "$(dirname "$0")/.."
termux-wake-lock 2>/dev/null || true   # evita che Android chiuda il server in background
(sleep 2 && termux-open-url http://localhost:8787) &
if grep -q "^ANTHROPIC_API_KEY=sk-" .env 2>/dev/null; then
  npm start
else
  echo "Nessuna chiave API: avvio in modalità DEMO."
  npm run demo
fi
