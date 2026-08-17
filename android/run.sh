#!/usr/bin/env bash
# Sobe o emulador Pixel_7, builda e roda o app: ./run.sh
set -euo pipefail
cd "$(dirname "$0")"

SDK="$HOME/Library/Android/sdk"
AVD="${AVD:-Pixel_7}"
export JAVA_HOME="${JAVA_HOME:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"

if ! "$SDK/platform-tools/adb" get-state 2>/dev/null; then
  "$SDK/emulator/emulator" -avd "$AVD" -gpu host &
  "$SDK/platform-tools/adb" wait-for-device
  "$SDK/platform-tools/adb" shell 'while [ "$(getprop sys.boot_completed)" != "1" ]; do sleep 1; done'
fi

# gradle.properties do repo é conservador (mantido pra máquina mais fraca do time);
# aqui destrava recurso só nesta invocação, sem tocar no arquivo versionado.
./gradlew installDebug --parallel --max-workers=6 \
  -Dorg.gradle.jvmargs="-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8" \
  -Dkotlin.daemon.jvmargs="-Xmx2048m"
"$SDK/platform-tools/adb" shell am start -n tech.pervian.fiapestudante/.MainActivity
