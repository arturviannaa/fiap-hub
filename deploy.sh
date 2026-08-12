#!/usr/bin/env bash
# Deploy da máquina local para a VPS: ./deploy.sh [mensagem-do-commit]
# Faz commit do que estiver pendente, empurra pro GitHub e reconstrói lá.
set -euo pipefail

VPS="${VPS:-caixas7-vps}"
DIR="${DIR:-/opt/fiap-hub}"
URL="${URL:-https://fiap.pervian.tech}"

cd "$(dirname "$0")"

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "${1:-atualiza plataforma}"
fi
git push origin main

echo "== build na VPS =="
ssh "$VPS" "cd $DIR && git pull --ff-only && docker compose build && docker compose up -d --remove-orphans"

echo "== esperando ficar saudável =="
for i in $(seq 1 30); do
  if curl -fsS "$URL/api/saude" > /dev/null 2>&1; then
    echo "no ar: $(curl -s "$URL/api/saude")"
    exit 0
  fi
  sleep 3
done

echo "não respondeu a tempo — veja os logs:" >&2
ssh "$VPS" "cd $DIR && docker compose logs app --tail 40"
exit 1
