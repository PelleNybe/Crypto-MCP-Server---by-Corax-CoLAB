#!/bin/bash

# Setup script for Crypto MCP GUI - systemd based
# Follows instructions from README.md

echo "==> Setting up Crypto MCP Server..."

# Variables
USER_NAME=$(whoami)
PROJECT_DIR=$(pwd)
BACKEND_DIR="$PROJECT_DIR/gui/backend"
FRONTEND_DIR="$PROJECT_DIR/gui/frontend"

echo "==> Checking system dependencies..."
sudo apt update
sudo apt install -y curl build-essential ca-certificates git jq sqlite3

if ! command -v node >/dev/null 2>&1; then
  echo "==> Node.js not found. Installing Node.js 20.x..."
  curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
else
  echo "==> Node.js is already installed. Version: $(node -v)"
fi

echo "==> Setting up Backend..."
if [ ! -d "$BACKEND_DIR" ]; then
  mkdir -p "$BACKEND_DIR"
fi
cd "$BACKEND_DIR"

if [ ! -f "package.json" ]; then
  echo "Warning: package.json missing in backend. Skipping npm install."
else
  npm install
fi

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "==> Created .env from .env.example"
  else
    echo "MCP_CCXT=http://127.0.0.1:7001/mcp" > .env
    echo "MCP_PORTFOLIO=http://127.0.0.1:7004/mcp" >> .env
    echo "PORT=4000" >> .env
    GEN_PASS=$(openssl rand -hex 16 2>/dev/null || head -c 16 /dev/urandom | od -An -tx1 | tr -d ' \n')
    echo "DASHBOARD_PASSWORD=$GEN_PASS" >> .env
    echo "==> Generated default .env with random DASHBOARD_PASSWORD"
  fi
fi

# Initialize SQLite Database if missing
if [ ! -f "orders.db" ]; then
  echo "==> Initializing orders.db SQLite database..."
  sqlite3 orders.db "CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT, exchange TEXT, symbol TEXT, side TEXT, amount REAL, price REAL, status TEXT);"
fi

echo "==> Setting up Frontend..."
if [ ! -d "$FRONTEND_DIR" ]; then
  mkdir -p "$FRONTEND_DIR"
fi
cd "$FRONTEND_DIR"

if [ ! -f "package.json" ]; then
  echo "Warning: package.json missing in frontend. Skipping npm install and build."
else
  npm install --legacy-peer-deps
  echo "==> Building frontend for production..."
  npm run build
fi

echo "==> Freeing port 4000 if occupied..."
if sudo lsof -i :4000 > /dev/null; then
  sudo kill -9 $(sudo lsof -t -i :4000)
  echo "Killed process on port 4000."
fi

echo "==> Setting up systemd service..."
SERVICE_FILE="/etc/systemd/system/crypto-mcp-gui.service"
sudo bash -c "cat > $SERVICE_FILE" <<EOL
[Unit]
Description=Crypto MCP GUI Backend - Crypto MCP Server
After=network.target

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$BACKEND_DIR
Environment=NODE_ENV=production
Environment=PORT=4000
ExecStart=$(command -v node) $BACKEND_DIR/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOL

sudo systemctl daemon-reload
sudo systemctl enable crypto-mcp-gui.service
sudo systemctl restart crypto-mcp-gui.service

echo "==> Setup finished!"
echo "Service status: $(systemctl is-active crypto-mcp-gui.service)"
echo "Backend API should be running on http://127.0.0.1:4000"
echo "Check logs with: sudo journalctl -u crypto-mcp-gui.service -f"
echo "Frontend dev mode can be run with: cd $FRONTEND_DIR && npm run dev"
