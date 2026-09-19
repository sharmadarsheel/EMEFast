#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$ROOT/frontend-v2"
EXTERNAL_NM="/c/Users/GITANSH-PC/Desktop/EMEFast_Modules/node_modules"
[ -f "$EXTERNAL_NM/next/dist/bin/next" ] || { echo "Shared EMEFast_Modules/node_modules not found"; exit 1; }
(cd "$ROOT/backend" && node mock-server.mjs) &
cd "$FRONTEND"
export NODE_PATH="$EXTERNAL_NM"
export PATH="$EXTERNAL_NM/.bin:$PATH"
node "$EXTERNAL_NM/next/dist/bin/next" dev -p 3001
