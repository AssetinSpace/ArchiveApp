#!/usr/bin/env bash
# Vyrenderuje schvalovacie PNG stills pre vsetky klipy (alebo vybrane ID).
# Pouzitie: npm run stills            # vsetky
#           npm run stills -- C4-Teren C5-Spracovanie
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out/stills
node -e '
const list = require("fs").readFileSync("src/scenesList.ts","utf8").split("OPTIONAL_LIST")[0];
const re = /\[\x27([A-Za-z0-9-]+)\x27, \{[^}]*stills: \[([0-9, ]+)\]/g;
let m; const out=[]; while ((m = re.exec(list))) out.push(`${m[1]} ${m[2].replace(/,/g," ")}`);
console.log(out.join("\n"));
' | while read -r id frames; do
  if [ $# -gt 0 ] && ! printf '%s\n' "$@" | grep -qx "$id"; then continue; fi
  echo "== $id (frames $frames)"
  i=1
  for f in $frames; do
    npx remotion still "$id" "out/stills/${id}_${i}.png" --frame="$f" --log=error
    i=$((i+1))
  done
done
node scripts/check-stills.mjs
