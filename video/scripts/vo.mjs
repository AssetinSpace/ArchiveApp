// Nahovor: z src/copy/vo.json vyrobi public/vo/<klip>.wav (jedna stopa na klip, vety
// na svojich casoch) a do vo.json dopise namerane trvanie viet (dur, ms) pre titulky.
// Hlas: espeak-ng (sk) = docasny robot na doladenie tempa. Kvalitny hlas sa dosadi tak,
// ze sa vety vygeneruju inde do public/vo/lines/<klip>-<i>.wav a spusti sa `--reuse`.
// Kvalitny hlas zadarmo: --engine edge (Microsoft neural sk-SK-LukasNeural cez pip edge-tts; potrebuje
// v sieti prostredia povoleny host speech.platform.bing.com a CA proxy pridanu do certifi), --voice sk-SK-ViktoriaNeural pre zensky hlas,
// --rate -10% pre pomalsie tempo.
// --engine piper: Piper sk_SK-lili-medium (offline, model v PIPER_MODEL alebo /root/piper/sk_SK-lili-medium.onnx,
// z huggingface.co/rhasspy/piper-voices), --rate ako length_scale (1.0 = normal, 1.1 = pomalsie).
// Veta moze mat `say` = text pre hlas (foneticky prepis: "Archives" -> "Arkajvs", "PL_01" -> "pe el nula jedna"),
// titulok ukazuje `text`.
// Pouzitie: node scripts/vo.mjs [--reuse] [--engine espeak|edge|piper] [--speed 150] [--voice ...] [--rate -5%]
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const FF = process.env.FFMPEG ?? execFileSync('python3', ['-c', 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())']).toString().trim();
const args = process.argv.slice(2);
const reuse = args.includes('--reuse');
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const speed = opt('--speed', '150');
const engine = opt('--engine', 'espeak');
const voice = opt('--voice', 'sk-SK-LukasNeural');
const rate = opt('--rate', '-5%');
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
      const say = l.say ?? l.text;
      if (engine === 'piper') {
        const model = process.env.PIPER_MODEL ?? '/root/piper/sk_SK-lili-medium.onnx';
        const ls = args.includes('--rate') ? rate : '1.05';
        execFileSync('piper', ['-m', model, '-f', file + '.raw.wav', '--length_scale', ls, '--sentence_silence', '0.15'], { input: say });
        execFileSync(FF, ['-v', 'error', '-y', '-i', file + '.raw.wav', '-af', 'loudnorm=I=-18:TP=-2', '-ar', '48000', '-ac', '1', file]);
      } else if (engine === 'edge') {
        // edge-tts pise mp3; prevod na wav, aby mal mix rovnaky format. CA proxy: SSL_CERT_FILE.
        const proxy = process.env.HTTPS_PROXY ? ['--proxy', process.env.HTTPS_PROXY] : []; // websocket cez proxy prostredia (trust_env nestaci)
        execFileSync('edge-tts', [...proxy, '--voice', voice, `--rate=${rate}`, '--text', say, '--write-media', file + '.mp3']);
        execFileSync(FF, ['-v', 'error', '-y', '-i', file + '.mp3', '-ar', '48000', '-ac', '1', file]);
      } else {
        execFileSync('espeak-ng', ['-v', 'sk', '-s', speed, '-p', '40', '-a', '170', '-w', file, say]);
      }
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
