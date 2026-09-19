#!/usr/bin/env bash
# Vyrenderuje MP4 (1920x1080, 30 fps, H.264) pre vsetky sceny alebo vybrane ID.
# Pouzitie: npm run render                    # vsetky sceny
#           npm run render -- S05-Teren       # jedna scena
#           PREVIEW=1 npm run render -- Full  # polovicne rozlisenie do out/preview
set -euo pipefail
cd "$(dirname "$0")/.."
ids=("$@")
if [ ${#ids[@]} -eq 0 ]; then
  mapfile -t ids < <(grep -o "^  \['[A-Za-z0-9-]*'" src/scenesList.ts | tr -d "[' ")
fi
for id in "${ids[@]}"; do
  if [ "${PREVIEW:-}" = "1" ]; then
    mkdir -p out/preview
    npx remotion render "$id" "out/preview/${id}.mp4" --scale=0.5 --log=error
  else
    mkdir -p out/mp4
    npx remotion render "$id" "out/mp4/${id}.mp4" --log=error
  fi
done
