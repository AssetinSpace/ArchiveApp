// Experiment kratkej verzie: kontrolne stills LinkedIn 4:5 (kompozicia K-LinkedIn) jednym bundlom (rychlejsie ako
// npx remotion still po jednom). Kolo 3: klipy 16:9 vypadli, stills su casy vo filme.
// Pouzitie: node scripts/kratka-stills.mjs [s ...]   -> out/kratka/stills/K-LinkedIn_<s>.png (predvolene casy nizsie)
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const times = process.argv.slice(2).map(Number);
const at = times.length ? times : [2, 4.5, 8, 11, 14, 19, 26, 30, 36, 40, 46, 52, 55, 60, 66, 70];
const out = 'out/kratka/stills';
mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const browserExecutable = process.env.REMOTION_CHROME ?? null;
const composition = await selectComposition({ serveUrl, id: 'K-LinkedIn', browserExecutable });
for (const s of at) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(s * composition.fps));
  await renderStill({ serveUrl, composition, frame, output: `${out}/K-LinkedIn_${s}.png`, browserExecutable, overwrite: true });
}
console.log(`K-LinkedIn: ${at.length} stills, ${(composition.durationInFrames / composition.fps).toFixed(2)} s`);
