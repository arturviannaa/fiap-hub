# syntax=docker/dockerfile:1

# ---- dependencias ----------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build -----------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Clona os repos das disciplinas para gerar o conteudo-semente da imagem. Em
# runtime o servico de sync mantem isso atualizado no volume.
RUN rm -rf repos && mkdir -p repos \
 && git clone https://github.com/mariacmartins/computational_thinking_with_python repos/python \
 && git clone https://github.com/gsalati/Edge-Computing-Computer-Systems repos/edge \
 && npm run build

# ---- servico de sync do conteudo ------------------------------------------
FROM node:22-alpine AS sync
WORKDIR /app
RUN apk add --no-cache git
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY scripts ./scripts
COPY docker/sync.sh /usr/local/bin/sync.sh
RUN chmod +x /usr/local/bin/sync.sh
CMD ["/usr/local/bin/sync.sh"]

# ---- app -------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
RUN apk add --no-cache curl && addgroup -g 1001 app && adduser -u 1001 -G app -D app

COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/db ./db
# Semente: se o volume de conteudo estiver vazio na primeira subida, o app ja
# tem as aulas para servir antes do primeiro sync terminar.
COPY --from=builder --chown=app:app /app/content ./content-semente
COPY --chown=app:app docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh && mkdir -p /app/content /app/uploads && chown app:app /app/content /app/uploads

USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD curl -fsS http://127.0.0.1:3000/api/saude || exit 1
ENTRYPOINT ["./entrypoint.sh"]
