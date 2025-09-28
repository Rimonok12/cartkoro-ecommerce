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


##################################


# #!/usr/bin/env bash
# set -euo pipefail

# # ===== Config =====
# # Override this in Render → Environment if you want a specific version.
# # Good, known tag: v1.10.0
# MEILI_VERSION="${MEILI_VERSION:-v1.10.0}"
# MEILI_BIN="./meilisearch"
# MEILI_DATA="./.meili_data"
# MEILI_ADDR="127.0.0.1:7700"

# # ===== Helper: download a URL to a file (returns nonzero on HTTP error) =====
# dl() {
#   url="$1"; out="$2"
#   echo "Downloading: $url"
#   curl -fsSL "$url" -o "$out"
# }

# # ===== 1) Ensure Meilisearch binary exists =====
# if [ ! -x "$MEILI_BIN" ]; then
#   echo "Bootstrapping Meilisearch ${MEILI_VERSION}…"

#   tarball="meili.tgz"
#   extracted="meili_extracted"

#   # Try both common asset names
#   a1="https://github.com/meilisearch/meilisearch/releases/download/${MEILI_VERSION}/meilisearch-linux-amd64.tar.gz"
#   a2="https://github.com/meilisearch/meilisearch/releases/download/${MEILI_VERSION}/meilisearch-linux-x86_64.tar.gz"

#   if dl "$a1" "$tarball" || dl "$a2" "$tarball"; then
#     mkdir -p "$extracted"
#     tar -xzf "$tarball" -C "$extracted"
#     # Find the binary inside the tar (name is usually 'meilisearch')
#     found="$(find "$extracted" -type f -name 'meilisearch' | head -n1 || true)"
#     if [ -z "$found" ]; then
#       echo "Could not find 'meilisearch' in tarball; falling back to installer…"
#       rm -rf "$tarball" "$extracted"
#       curl -fsSL https://install.meilisearch.com | sh
#     else
#       mv "$found" "$MEILI_BIN"
#       chmod +x "$MEILI_BIN"
#       rm -rf "$tarball" "$extracted"
#     fi
#   else
#     echo "Direct download failed; falling back to official installer…"
#     curl -fsSL https://install.meilisearch.com | sh
#   fi
# fi

# # ===== 2) Start Meilisearch (private) =====
# "$MEILI_BIN" \
#   --master-key "${MEILI_MASTER_KEY:?MEILI_MASTER_KEY missing}" \
#   --http-addr "$MEILI_ADDR" \
#   --db-path "$MEILI_DATA" \
#   >/dev/null 2>&1 &

# # ===== 3) Wait until healthy =====
# echo "Waiting for Meilisearch to start…"
# for i in {1..60}; do
#   if curl -fsS "http://${MEILI_ADDR}/health" | grep -q '"available"'; then
#     echo "Meilisearch is up."
#     break
#   fi
#   sleep 1
# done

# # # ===== 4) Optional: seed only if index is empty =====
# # INDEX_UID="${MEILI_INDEX:-products_prod}"
# # DOCS=$(curl -fsS -H "Authorization: Bearer ${MEILI_MASTER_KEY}" \
# #   "http://${MEILI_ADDR}/indexes/${INDEX_UID}/stats" \
# #   | grep -o '"numberOfDocuments":[0-9]*' | grep -o '[0-9]\+' || true)

# # if [ -z "$DOCS" ] || [ "$DOCS" = "0" ]; then
# #   echo "Index ${INDEX_UID} empty → seeding…"
# #   npm run index:seed || true
# # else
# #   echo "Index ${INDEX_UID} has ${DOCS} docs → skip seeding."
# # fi

# # ===== 5) Start your Node server =====
# node ./server.js
