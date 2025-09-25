#!/usr/bin/env bash
set -euo pipefail

# 1) Download Meilisearch binary if not present
if [ ! -f ./meilisearch ]; then
  curl -L https://install.meilisearch.com | sh
fi

# 2) Start Meilisearch on localhost (private)
./meilisearch \
  --master-key "${MEILI_MASTER_KEY}" \
  --http-addr "127.0.0.1:7700" \
  --db-path "./.meili_data" \
  &

# 3) Wait for Meili to be healthy
echo "Waiting for Meilisearch to start..."
for i in {1..45}; do
  if curl -s http://127.0.0.1:7700/health | grep -q '"available"'; then
    echo "Meilisearch is up."
    break
  fi
  sleep 1
done

# 4) Optional: auto-index on boot if index is missing/empty
node -r dotenv/config ./config/meili.js || true

# 5) Start your Node server on $PORT (Render sets this)
#    CHANGE THIS PATH IF YOUR ENTRY IS ./src/index.js
node ./server.js
