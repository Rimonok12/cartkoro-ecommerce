# #!/usr/bin/env bash
# set -euo pipefail

# # 1) Download Meilisearch binary if not present
# if [ ! -f ./meilisearch ]; then
#   curl -L https://install.meilisearch.com | sh
# fi

# # 2) Start Meilisearch on localhost (private)
# ./meilisearch \
#   --master-key "${MEILI_MASTER_KEY}" \
#   --http-addr "127.0.0.1:7700" \
#   --db-path "./.meili_data" \
#   &

# # 3) Wait for Meili to be healthy
# echo "Waiting for Meilisearch to start..."
# for i in {1..45}; do
#   if curl -s http://127.0.0.1:7700/health | grep -q '"available"'; then
#     echo "Meilisearch is up."
#     break
#   fi
#   sleep 1
# done

# # 4) Optional: auto-index on boot if index is missing/empty
# node -r dotenv/config ./config/meili.js || true

# # 5) Start your Node server on $PORT (Render sets this)
# #    CHANGE THIS PATH IF YOUR ENTRY IS ./src/index.js
# node ./server.js


##################################


#!/usr/bin/env bash
set -euo pipefail

# --- Config ---
MEILI_VERSION="${MEILI_VERSION:-v1.21.0}"   # pin a specific version (override in Render env if you want)
ARCH="linux-amd64"                           # Render uses Linux x86_64
DB_PATH_DEFAULT="./data.ms"                  # falls back to local folder
DB_PATH="${RENDER_DISK_PATH:-$DB_PATH_DEFAULT}"  # if you attach a Render Disk, set RENDER_DISK_PATH=/var/data
HOST_ADDR="${MEILI_HOST_ADDR:-127.0.0.1:7700}"

echo "==> Bootstrapping Meilisearch ${MEILI_VERSION} (${ARCH})"
if [ ! -f ./meilisearch ]; then
  URL="https://github.com/meilisearch/meilisearch/releases/download/${MEILI_VERSION}/meilisearch-${ARCH}.tar.gz"
  echo "Downloading ${URL}"
  curl -fsSL --retry 3 --retry-connrefused -o meili.tgz "$URL"
  tar -xzf meili.tgz meilisearch
  rm meili.tgz
  chmod +x ./meilisearch
fi

# --- Start Meilisearch ---
echo "==> Starting Meilisearch on ${HOST_ADDR} with db path ${DB_PATH}"
mkdir -p "${DB_PATH}"
./meilisearch \
  --master-key "${MEILI_MASTER_KEY}" \
  --http-addr "${HOST_ADDR}" \
  --db-path "${DB_PATH}" \
  &

# --- Wait for health ---
echo "==> Waiting for Meilisearch to be healthy..."
for i in {1..60}; do
  if curl -fsS "http://${HOST_ADDR}/health" | grep -q '"available"'; then
    echo "Meilisearch is up."
    break
  fi
  sleep 1
done

# --- (optional) run any one-off setup, e.g. index settings seeder ---
# node -r dotenv/config ./scripts/indexer.js || true

# --- Start your Node server ---
echo "==> Starting Node server"
node ./server.js
