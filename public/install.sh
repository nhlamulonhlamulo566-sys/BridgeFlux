#!/usr/bin/env bash
set -e

if [ -n "$SUDO_USER" ]; then
  USER_HOME=$(eval echo "~$SUDO_USER")
else
  USER_HOME="$HOME"
fi

INSTALL_BASE="$1"
if [ -z "$INSTALL_BASE" ]; then
  echo "Usage: curl -sL <host>/install.sh | sudo bash -s -- <host>"
  exit 1
fi

INSTALL_DIR="$USER_HOME/.bridgeflux"
BIN_PATH="/usr/local/bin/bridgeflux"

mkdir -p "$INSTALL_DIR"

curl -fsSL "$INSTALL_BASE/bridgeflux.js" -o "$INSTALL_DIR/bridgeflux.js"
cat > "$INSTALL_DIR/bridgeflux" <<'EOF'
#!/usr/bin/env node
require("$INSTALL_DIR/bridgeflux.js");
EOF
chmod +x "$INSTALL_DIR/bridgeflux"

if [ -w "$(dirname "$BIN_PATH")" ]; then
  ln -sf "$INSTALL_DIR/bridgeflux" "$BIN_PATH"
else
  sudo ln -sf "$INSTALL_DIR/bridgeflux" "$BIN_PATH"
fi

echo "Installed BridgeFlux CLI stub to $BIN_PATH"
