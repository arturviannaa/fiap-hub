#!/bin/sh
set -e

# Primeira subida (ou volume novo): usa o conteudo que veio na imagem ate o
# servico de sync trazer a versao mais recente do repo da professora.
if [ ! -f /app/content/python.json ]; then
  echo "[entrypoint] semeando conteudo inicial"
  cp -r /app/content-semente/. /app/content/
fi

exec node server.js
