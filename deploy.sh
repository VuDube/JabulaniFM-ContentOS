#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo '[1/5] Installing dependencies'
npm ci
npm --prefix frontend ci
echo '[2/5] Building frontend assets'
npm --prefix frontend run build
echo '[3/5] Generating Worker types'
npx wrangler types
echo '[4/5] Running typecheck and tests'
npx tsc --noEmit -p aegis-agent/tsconfig.json
npm --prefix aegis-agent test
echo '[5/5] Deploying single Worker'
npx wrangler deploy --config wrangler.toml
echo 'JabulaniFM Worker deployment complete.'
