#!/usr/bin/env bash
# Publica uma nova versão do app: ./release.sh "novidade 1" "novidade 2" ...
# Builda a APK, envia pra VPS e atualiza o version.json — quem estiver com uma
# versão antiga é avisado ao abrir o app.
set -euo pipefail
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
{"versionCode":$VC,"versionName":"$VN","apkUrl":"https://fiap.pervian.tech/app/FIAP-Estudante.apk","obrigatorio":$OBRIGATORIO,"novidades":$NOV}
EOF

echo "== enviando pra VPS =="
scp "$APK" caixas7-vps:/var/www/fiap-app/FIAP-Estudante.apk
scp /tmp/fiap-version.json caixas7-vps:/var/www/fiap-app/version.json
scp landing/index.html landing/icon.png caixas7-vps:/var/www/fiap-app/

echo "publicado: https://fiap.pervian.tech/app/FIAP-Estudante.apk (v$VN, code $VC)"
