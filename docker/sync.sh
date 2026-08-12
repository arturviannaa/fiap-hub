#!/bin/sh
# Mantem o conteudo da plataforma igual ao repo da professora. O app le o JSON
# por mtime, entao aula nova aparece sem reiniciar nada.
set -e

REPO="${REPO_CONTEUDO:-https://github.com/mariacmartins/computational_thinking_with_python}"
INTERVALO="${INTERVALO_SYNC:-1800}"
FONTE=/app/repo

export CONTENT_SRC="$FONTE"
export CONTENT_OUT=/app/content

while true; do
  if [ -d "$FONTE/.git" ]; then
    git -C "$FONTE" fetch --depth 1 origin HEAD 2>&1 && git -C "$FONTE" reset --hard FETCH_HEAD 2>&1
  else
    # $FONTE e o mountpoint do volume: da para esvaziar, nao para remover.
    mkdir -p "$FONTE"
    find "$FONTE" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
    git clone --depth 1 "$REPO" "$FONTE" 2>&1
  fi

  ANTES=$(git -C "$FONTE" rev-parse --short HEAD 2>/dev/null || echo '?')
  if node /app/scripts/build-content.mjs; then
    echo "[sync] ok em $(date -Iseconds) — commit $ANTES"
  else
    echo "[sync] FALHOU em $(date -Iseconds); conteudo anterior mantido"
  fi

  sleep "$INTERVALO"
done
