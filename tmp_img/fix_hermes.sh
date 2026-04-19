#!/bin/bash
export PATH="$HOME/.local/bin:$PATH"
source ~/.bashrc 2>/dev/null

echo "=== Checking uv ==="
uv --version

echo "=== Running Hermes install ==="
cd ~
./install.sh
