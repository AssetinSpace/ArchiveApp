// Kontrolne stills viacerych klipov jednym bundlom (rychlejsie ako scripts/stills.sh, ktory bundluje pre kazdy frame).
// Pouzitie: node scripts/stills-fast.mjs C4-Cena:300,420 C9-Outro:40 ...   -> out/stills/<ID>_f<frame>.png
// Bez argumentov: frame-y zo `stills` v src/scenesList.ts pre vsetky klipy SCENE_LIST.
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
let jobs = args.map((a) => {
  const [id, fr] = a.split(':');
  return { id, frames: (fr ?? '0').split(',').map(Number) };
});
if (!jobs.length) {
  const list = readFileSync('src/scenesList.ts', 'utf8').split('V1_LIST')[0];
  const re = /(?:\[|paced\()'([A-Za-z0-9-]+)', \{[^\n]*?stills: \[([0-9, ]+)\]/g;
  let m;
  while ((m = re.exec(list))) jobs.push({ id: m[1], frames: m[2].split(',').map((x) => Number(x.trim())) });
}
const out = 'out/stills';
mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
const browserExecutable = process.env.REMOTION_CHROME ?? null;
for (const { id, frames } of jobs) {
  const composition = await selectComposition({ serveUrl, id, browserExecutable });
  for (const f of frames) {
    const frame = Math.min(composition.durationInFrames - 1, f);
    await renderStill({ serveUrl, composition, frame, output: `${out}/${id}_f${frame}.png`, browserExecutable, overwrite: true });
  }
  console.log(`${id}: ${frames.join(', ')} (${(composition.durationInFrames / composition.fps).toFixed(2)} s)`);
}
