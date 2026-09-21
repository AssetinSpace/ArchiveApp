// Kontrola bezpecnej zony: v pase y 830-860 nesmie byt nic okrem pozadia
// (caption zona zacina na 860). Spusta sa po `npm run stills`.
import { PNG } from 'pngjs';
import { readFileSync, readdirSync } from 'node:fs';

const dir = 'out/stills';
// klipy bez caption (intro, outro) sa nekontroluju
const EXEMPT = ['C1-', 'C9-', 'F1-', 'contact-'];
// tmave klipy s podlahou: hrana podlahy prechadza pasom, tolerancia vyssia
const FLOOR = ['C2-', 'C3-'];
let bad = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith('.png') && !EXEMPT.some((e) => n.startsWith(e))).sort()) {
  const png = PNG.sync.read(readFileSync(`${dir}/${f}`));
  const { width, data } = png;
  // "pozadie" = dominantna farba pasu (podlaha sa berie ako pozadie, objekty nie)
  const y0 = 830,
    y1 = 860;
  const hist = new Map();
  for (let y = y0; y < y1; y += 2)
    for (let x = 120; x < width - 120; x += 4) {
      const i = (y * width + x) * 4;
      const k = `${data[i] >> 3},${data[i + 1] >> 3},${data[i + 2] >> 3}`;
      hist.set(k, (hist.get(k) ?? 0) + 1);
    }
  const [dom] = [...hist.entries()].sort((a, b) => b[1] - a[1])[0];
  const [br, bg, bb] = dom.split(',').map((v) => (Number(v) << 3) + 4);
  let diff = 0,
    total = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = 120; x < width - 120; x++) {
      const i = (y * width + x) * 4;
      const d = Math.abs(data[i] - br) + Math.abs(data[i + 1] - bg) + Math.abs(data[i + 2] - bb);
      if (d > 40) diff++;
      total++;
    }
  }
  const pct = (diff / total) * 100;
  const ok = pct < (FLOOR.some((e) => f.startsWith(e)) ? 50 : 2);
  if (!ok) bad++;
  console.log(`${ok ? 'ok ' : 'BAD'} ${f}  ${pct.toFixed(1)} % pixelov mimo pozadia v pase 830-860`);
}
if (bad) {
  console.log(`\n${bad} still(s) zasahuje do caption zony.`);
  process.exitCode = 1;
}
