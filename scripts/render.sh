#!/usr/bin/env bash
# Vyrenderuje MP4 (1920x1080, 30 fps, H.264) pre vsetky klipy alebo vybrane ID.
# Pouzitie: npm run render                    # vsetky klipy s textom -> out/mp4/
#           npm run render -- C5-Teren        # jeden klip
#           NOCAP=1 npm run render            # bez textu v obraze -> out/mp4/nocap/
#           PREVIEW=1 npm run render -- Full  # polovicne rozlisenie -> out/preview/
set -euo pipefail
cd "$(dirname "$0")/.."
ids=("$@")
if [ ${#ids[@]} -eq 0 ]; then
  mapfile -t ids < <(sed -n '/SCENE_LIST/,/^];/p' src/scenesList.ts | grep -o "^  \['[A-Za-z0-9-]*'" | tr -d "[' ")
fi
for id in "${ids[@]}"; do
  if [ "${PREVIEW:-}" = "1" ]; then
    mkdir -p out/preview
    npx remotion render "$id" "out/preview/${id}.mp4" --scale=0.5 --image-format=jpeg --log=error
  elif [ "${NOCAP:-}" = "1" ]; then
    mkdir -p out/mp4/nocap
    npx remotion render "$id" "out/mp4/nocap/${id}.mp4" --props='{"captions":false}' --log=error
  else
    mkdir -p out/mp4
    npx remotion render "$id" "out/mp4/${id}.mp4" --log=error
  fi
done
