#!/usr/bin/env bash
# Vyrenderuje schvalovacie PNG stills pre vsetky sceny (alebo vybrane ID).
# Pouzitie: npm run stills            # vsetky
#           npm run stills -- S05-Teren S06-Spracovanie
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out/stills
node -e '
const list = require("fs").readFileSync("src/scenesList.ts","utf8");
const re = /\[\x27([A-Za-z0-9-]+)\x27, \{[^}]*stills: \[(\d+), (\d+)\]/g;
let m; const out=[]; while ((m = re.exec(list))) out.push(`${m[1]} ${m[2]} ${m[3]}`);
console.log(out.join("\n"));
' | while read -r id a b; do
  if [ $# -gt 0 ] && ! printf '%s\n' "$@" | grep -qx "$id"; then continue; fi
  echo "== $id (frames $a, $b)"
  npx remotion still "$id" "out/stills/${id}_a.png" --frame="$a" --log=error
  npx remotion still "$id" "out/stills/${id}_b.png" --frame="$b" --log=error
done
