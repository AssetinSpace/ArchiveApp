// Nahovor: z src/copy/vo.json vyrobi public/vo/<klip>.wav (jedna stopa na klip, vety
// na svojich casoch) a do vo.json dopise namerane trvanie viet (dur, ms) pre titulky.
// Hlas: espeak-ng (sk) = docasny robot na doladenie tempa. Kvalitny hlas sa dosadi tak,
// ze sa vety vygeneruju inde do public/vo/lines/<klip>-<i>.wav a spusti sa `--reuse`.
// Pouzitie: node scripts/vo.mjs [--reuse] [--speed 150]
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const FF = process.env.FFMPEG ?? execFileSync('python3', ['-c', 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())']).toString().trim();
const args = process.argv.slice(2);
const reuse = args.includes('--reuse');
const speed = args.includes('--speed') ? args[args.indexOf('--speed') + 1] : '150';
const vo = JSON.parse(readFileSync('src/copy/vo.json', 'utf8'));
mkdirSync('public/vo/lines', { recursive: true });

const duration = (file) => {
  const out = spawnSync(FF, ['-i', file, '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const m = out.match(/time=(\d+):(\d+):([\d.]+)/g);
  const last = m[m.length - 1].match(/time=(\d+):(\d+):([\d.]+)/);
  return Math.round((Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3])) * 1000);
};

console.log('klip | veta | od (s) | trva (s) | do (s) | slov');
let overlaps = 0;
for (const [clip, lines] of Object.entries(vo)) {
  if (!Array.isArray(lines)) continue;
  const inputs = [];
  const delays = [];
  lines.forEach((l, i) => {
    const file = `public/vo/lines/${clip}-${i}.wav`;
    if (!reuse || !existsSync(file)) {
      execFileSync('espeak-ng', ['-v', 'sk', '-s', speed, '-p', '40', '-a', '170', '-w', file, l.text]);
    }
    l.dur = duration(file);
    inputs.push('-i', file);
    delays.push(`[${i}]adelay=${l.at}|${l.at}[d${i}]`);
    const prev = lines[i - 1];
    const over = prev && prev.at + prev.dur + 150 > l.at; // vety sa nesmu prekryvat (min. 150 ms medzera)
    if (over) overlaps++;
    console.log(`${clip} | ${i + 1} | ${(l.at / 1000).toFixed(1)} | ${(l.dur / 1000).toFixed(1)} | ${((l.at + l.dur) / 1000).toFixed(1)} | ${l.text.split(/\s+/).length}${over ? '  <-- PREKRYV s predchadzajucou vetou' : ''}`);
  });
  const mix = `${delays.join(';')};${lines.map((_, i) => `[d${i}]`).join('')}amix=inputs=${lines.length}:normalize=0:dropout_transition=0,aresample=48000`;
  execFileSync(FF, ['-v', 'error', '-y', ...inputs, '-filter_complex', mix, '-ac', '1', `public/vo/${clip}.wav`]);
}
writeFileSync('src/copy/vo.json', JSON.stringify(vo, null, 2) + '\n');
if (overlaps) console.log(`\n${overlaps} veta/vety sa prekryvaju, posun 'at' vo vo.json.`);
