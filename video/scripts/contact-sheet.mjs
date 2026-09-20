// Kontaktny harok: stredny still (_2) kazdeho klipu v mriezke 3x3,
// zmensene na 1/4. Vystup: out/stills/contact-sheet.png
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const dir = 'out/stills';
const files = readdirSync(dir)
  .filter((n) => /^C\d-.*_\d\.png$/.test(n))
  .sort();
const byClip = new Map();
for (const f of files) {
  const id = f.replace(/_\d\.png$/, '');
  if (f.endsWith("_2.png")) byClip.set(id, f);
}
const ids = [...byClip.keys()];
const cols = 3,
  scale = 4;
const cw = 1920 / scale,
  ch = 1080 / scale,
  gap = 12;
const rows = Math.ceil(ids.length / cols);
const out = new PNG({ width: cols * cw + (cols + 1) * gap, height: rows * ch + (rows + 1) * gap });
out.data.fill(255);
ids.forEach((id, i) => {
  const src = PNG.sync.read(readFileSync(`${dir}/${byClip.get(id)}`));
  const ox = gap + (i % cols) * (cw + gap),
    oy = gap + Math.floor(i / cols) * (ch + gap);
  for (let y = 0; y < ch; y++)
    for (let x = 0; x < cw; x++) {
      // priemer 4x4 bloku
      let r = 0,
        g = 0,
        b = 0;
      for (let dy = 0; dy < scale; dy++)
        for (let dx = 0; dx < scale; dx++) {
          const si = ((y * scale + dy) * src.width + x * scale + dx) * 4;
          r += src.data[si];
          g += src.data[si + 1];
          b += src.data[si + 2];
        }
      const n = scale * scale;
      const oi = ((oy + y) * out.width + ox + x) * 4;
      out.data[oi] = r / n;
      out.data[oi + 1] = g / n;
      out.data[oi + 2] = b / n;
      out.data[oi + 3] = 255;
    }
});
writeFileSync(`${dir}/contact-sheet.png`, PNG.sync.write(out));
console.log(`contact-sheet.png: ${ids.length} klipov`);
