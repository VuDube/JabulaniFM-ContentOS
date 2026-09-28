#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm install
npm --prefix frontend install
npm --prefix frontend run build
npx wrangler types
npx wrangler deploy
echo "JabulaniFM Worker deployment complete."
