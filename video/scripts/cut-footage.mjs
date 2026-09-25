// Zostrih desktop footage podla src/footage/cuts.json: orez 1520x882, zrychlenie,
// zmrazeny prvy/posledny obraz segmentu, spojenie. Zdroj: public/footage/src/*.mp4.
// Pouzitie: node scripts/cut-footage.mjs [f2-metadata f3-search f4-review]
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const FF = process.env.FFMPEG ?? execFileSync('python3', ['-c', 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())']).toString().trim();
const cuts = JSON.parse(readFileSync('src/footage/cuts.json', 'utf8'));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(cuts).filter((k) => typeof cuts[k] === 'object');
for (const id of ids) {
  const { src, segs } = cuts[id]; // vf: vlastny filter (mobil: scale=884:1920), inak orez desktopu
  const tmp = mkdtempSync(join(tmpdir(), 'cut-'));
  const parts = [];
  segs.forEach((s, i) => {
    const out = join(tmp, `${i}.mp4`);
    const speed = s.speed ?? 1;
    // fps pred tpad: po setpts nema stream snimkovu frekvenciu a tpad by zmrazenie ticho vynechal (ffmpeg 7, kolo 32)
    const vf = [cuts[id].vf ?? `crop=${cuts.crop}`, `setpts=PTS/${speed}`, 'fps=30', `tpad=start_duration=${s.before ?? 0}:start_mode=clone:stop_duration=${s.after ?? 0}:stop_mode=clone`].join(',');
    execFileSync(FF, ['-v', 'error', '-y', '-ss', String(s.from), '-to', String(s.to), '-i', `public/footage/${src}`, '-vf', vf, '-an', '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', '-pix_fmt', 'yuv420p', out], { stdio: 'inherit' });
    parts.push(`file '${out}'`);
  });
  writeFileSync(join(tmp, 'list.txt'), parts.join('\n'));
  execFileSync(FF, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt'), '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-an', `public/footage/${id}.mp4`], { stdio: 'inherit' });
  rmSync(tmp, { recursive: true, force: true });
  const dur = segs.reduce((a, s) => a + (s.before ?? 0) + (s.to - s.from) / (s.speed ?? 1) + (s.after ?? 0), 0);
  const probe = spawnSync(FF, ['-i', `public/footage/${id}.mp4`, '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const t = [...probe.matchAll(/time=(\d+):(\d+):([\d.]+)/g)].pop();
  const real = t ? Number(t[1]) * 3600 + Number(t[2]) * 60 + Number(t[3]) : 0;
  const warn = Math.abs(real - dur) > 0.3 ? `  <-- POZOR: namerane ${real.toFixed(2)} s` : '';
  console.log(`${id}: ${segs.length} segmentov, ${dur.toFixed(2)} s -> public/footage/${id}.mp4${warn}`);
}
