#!/bin/sh
# Mantém o conteúdo de TODAS as disciplinas igual aos repos dos professores.
# Um repo por disciplina, clonado em /app/repos/<slug>. O app lê os JSONs por
# mtime, então aula nova aparece sem reiniciar nada.
set -e

INTERVALO="${INTERVALO_SYNC:-1800}"
REPOS=/app/repos
export REPOS_DIR="$REPOS"
export CONTENT_OUT=/app/content

# slug|url — uma linha por disciplina.
DISCIPLINAS="python|https://github.com/mariacmartins/computational_thinking_with_python
edge|https://github.com/gsalati/Edge-Computing-Computer-Systems"

sincroniza_repo() {
  slug="$1"; url="$2"; dir="$REPOS/$slug"
  if [ -d "$dir/.git" ]; then
    git -C "$dir" fetch origin HEAD 2>&1 && git -C "$dir" reset --hard FETCH_HEAD 2>&1
  else
    mkdir -p "$dir"
    find "$dir" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true
    git clone "$url" "$dir" 2>&1
  fi
}

while true; do
  echo "$DISCIPLINAS" | while IFS='|' read -r slug url; do
    [ -n "$slug" ] && sincroniza_repo "$slug" "$url"
  done

  if node /app/scripts/build-content.mjs; then
    echo "[sync] ok em $(date -Iseconds)"
  else
    echo "[sync] FALHOU em $(date -Iseconds); conteudo anterior mantido"
  fi

  sleep "$INTERVALO"
done
