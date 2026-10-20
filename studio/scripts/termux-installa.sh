#!/data/data/com.termux/files/usr/bin/bash
# Installa (o aggiorna) Studio Amico su Android con Termux.
# Uso: curl -fsSL https://raw.githubusercontent.com/mick2026/Mick/ccr-321e0190-s2n9kq/studio/scripts/termux-installa.sh | bash
set -e
BRANCH=ccr-321e0190-s2n9kq
DIR="$HOME/Mick"

echo "🦉 Installo Studio Amico (qualche minuto)..."
pkg update -y
pkg install -y nodejs-lts git

if [ -d "$DIR/.git" ]; then
  git -C "$DIR" pull --ff-only
else
  git clone -b "$BRANCH" https://github.com/mick2026/Mick "$DIR"
fi
cd "$DIR/studio"
npm install --omit=dev --no-fund --no-audit

if [ ! -f .env ]; then
  echo
  read -rp "Incolla la chiave API (sk-ant-...) oppure premi Invio per provare solo la demo: " KEY </dev/tty
  if [ -n "$KEY" ]; then
    echo "ANTHROPIC_API_KEY=$KEY" > .env
    chmod 600 .env
  fi
fi

chmod +x scripts/termux-avvia.sh
grep -q "alias studio=" "$HOME/.bashrc" 2>/dev/null || echo "alias studio='$DIR/studio/scripts/termux-avvia.sh'" >> "$HOME/.bashrc"

echo
echo "✅ Fatto! Chiudi e riapri Termux, poi scrivi:  studio"
