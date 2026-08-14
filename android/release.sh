#!/usr/bin/env bash
# Publica uma nova versão do app: ./release.sh "novidade 1" "novidade 2" ...
# Builda a APK, envia pra VPS e atualiza o version.json — quem estiver com uma
# versão antiga é avisado ao abrir o app.
set -euo pipefail

# Alvo do deploy fica em ../.deploy-target (nao versionado)
[ -f ../.deploy-target ] && . ../.deploy-target
VPS="${VPS:?defina VPS em .deploy-target}"
DIR="${DIR:-/opt/fiap-hub}"
APP_DIR="${APP_DIR:-/var/www/fiap-app}"
URL="${URL:?defina URL em .deploy-target}"
cd "$(dirname "$0")"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"

VC=$(grep -oP 'versionCode = \K[0-9]+' app/build.gradle.kts)
VN=$(grep -oP 'versionName = "\K[^"]+' app/build.gradle.kts)
OBRIGATORIO="${OBRIGATORIO:-false}"

echo "== build v$VN (code $VC) =="
./gradlew :app:assembleDebug --console=plain
./gradlew --stop >/dev/null 2>&1 || true

APK=app/build/outputs/apk/debug/app-debug.apk
NOV=$(printf '%s\n' "$@" | python3 -c 'import sys,json;print(json.dumps([l.strip() for l in sys.stdin if l.strip()]))')

cat > /tmp/fiap-version.json <<EOF
{"versionCode":$VC,"versionName":"$VN","apkUrl":"$URL/app/FIAP-Estudante.apk","obrigatorio":$OBRIGATORIO,"novidades":$NOV}
EOF

echo "== enviando pra VPS =="
scp "$APK" "$VPS:$APP_DIR/FIAP-Estudante.apk"
scp /tmp/fiap-version.json "$VPS:$APP_DIR/version.json"
scp landing/index.html landing/icon.png "$VPS:$APP_DIR/"

echo "publicado: $URL/app/FIAP-Estudante.apk (v$VN, code $VC)"

# Avisa por push todo mundo que tem o app: saiu versão nova.
SECRET=$(ssh "$VPS" "grep '^INTERNO_SECRET=' $DIR/.env | cut -d= -f2-" 2>/dev/null || true)
if [ -n "$SECRET" ]; then
  curl -s -o /dev/null -w 'push nova versão: %{http_code}\n' $URL/api/interno/broadcast \
    -H 'Content-Type: application/json' \
    -d "{\"secret\":\"$SECRET\",\"titulo\":\"Nova versão disponível 🚀\",\"corpo\":\"Atualize o FIAP Estudante para a v$VN — toque para abrir e atualizar.\"}"
fi
