// Experiment kratkej verzie: kontrolne stills klipov K-* a T-* jednym bundlom (rychlejsie ako npx remotion still po jednom).
// Pouzitie: node scripts/kratka-stills.mjs [ID ...]   -> out/kratka/stills/<ID>_<n>.png (frame-y zo `stills` v src/kratkaList.ts)
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const want = process.argv.slice(2);
const src = readFileSync('src/kratkaList.ts', 'utf8');
const items = [...src.matchAll(/paced\('([A-Za-z0-9-]+)', \{[^\n]*?stills: \[([0-9, ]+)\]/g)].map((m) => ({ id: m[1], frames: m[2].split(',').map((x) => Number(x.trim())) }));
const out = 'out/kratka/stills';
mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const browserExecutable = process.env.REMOTION_CHROME ?? null;
for (const { id, frames } of items) {
  if (want.length && !want.includes(id)) continue;
  const composition = await selectComposition({ serveUrl, id, browserExecutable });
  for (const [i, frame] of frames.entries()) {
    await renderStill({ serveUrl, composition, frame, output: `${out}/${id}_${i + 1}.png`, browserExecutable, overwrite: true });
  }
  console.log(`${id}: ${frames.length} stills`);
}
