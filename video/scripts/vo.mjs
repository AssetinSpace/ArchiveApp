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
// titulok ukazuje `text`. Gemini `say` nedostava, cita cisty `text` (vyslovnost riesi pokyn v `_style`).
// Kolo 33: zaznam = jedno generovanie (cela veta alebo viac viet, nikdy nie kus vety), `parts` = titulky
// po castiach; skript najde zaciatky casti podla pauz v nahravke (partAt, ms od zaciatku zaznamu).
// --engine gemini: Gemini TTS cez scripts/gemini_tts.py (GEMINI_API_KEY v prostredi alebo z proxy), hlas "Velvet 1"
// = prompted hlas voice_7ws1j8pd39cu (v ucte je "Velvet 1" viackrat, toto je najnovsi z 25. 9.; nazvom neprejde),
// styl z vo.json `_style` (speech_metadata). --header posle "## Transcript:" pred text; vypnute, lebo model ho
// obcas precita nahlas ("Transkript.", kolo 32).
// Pouzitie: node scripts/vo.mjs [--reuse] [--engine espeak|edge|piper|gemini] [--speed 150] [--voice ...] [--rate -5%]
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';

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

/** Pauzy v nahravke (s): [[zaciatok, koniec], ...] */
const silences = (file, minDur = 0.05) => {
  const out = spawnSync(FF, ['-i', file, '-af', `silencedetect=n=-40dB:d=${minDur}`, '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const st = [...out.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  const en = [...out.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  return st.map((s, i) => [Math.max(0, s), en[i] ?? Infinity]);
};

/** Zaciatky casti titulkov (ms od zaciatku zaznamu): koniec pauzy najblizsej k odhadu podla poctu znakov. */
const partStarts = (file, parts, durMs) => {
  const sil = silences(file);
  const dur = durMs / 1000;
  const lead = sil.length && sil[0][0] < 0.02 ? sil[0][1] : 0;
  const tail = sil.length && sil[sil.length - 1][1] >= dur - 0.02 ? sil[sil.length - 1][0] : dur;
  const inner = sil.filter(([a, b]) => a > lead + 0.05 && b < tail - 0.05);
  const total = parts.join(' ').length;
  const out = [0];
  let chars = 0;
  for (let k = 1; k < parts.length; k++) {
    chars += parts[k - 1].length + 1;
    const guess = lead + (tail - lead) * (chars / total);
    // kandidat = koniec pauzy do 0,8 s od odhadu; po konci vety (. ? !) vyhravaju dlhsie pauzy
    const w = /[.?!]$/.test(parts[k - 1]) ? 3 : 1.5;
    const cands = inner.filter(([a, b]) => b * 1000 > out[k - 1] + 300 && Math.abs(b - guess) < 0.8);
    const best = cands.sort(([a1, b1], [a2, b2]) => (w * (b2 - a2) - Math.abs(b2 - guess)) - (w * (b1 - a1) - Math.abs(b1 - guess)))[0];
    const t = best ? best[1] : guess;
    out.push(Math.round(t * 1000) - 60); // titulok o chlp skor ako zaznie slovo
  }
  return out;
};

const duration = (file) => {
  const out = spawnSync(FF, ['-i', file, '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  const m = out.match(/time=(\d+):(\d+):([\d.]+)/g);
  const last = m[m.length - 1].match(/time=(\d+):(\d+):([\d.]+)/);
  return Math.round((Number(last[1]) * 3600 + Number(last[2]) * 60 + Number(last[3])) * 1000);
};

/** Zaciatky casti titulkov podla casov slov (whisper); null, ak sa pocet slov nezhoduje. */
const partsFromWords = (parts, ws) => {
  if (!ws) return null;
  const counts = parts.map((p) => p.split(/\s+/).filter(Boolean).length);
  if (counts.reduce((a, b) => a + b, 0) !== ws.length) return null;
  const out = [0];
  let idx = 0;
  for (let k = 1; k < parts.length; k++) {
    idx += counts[k - 1];
    out.push(Math.max(out[k - 1] + 300, Math.round(ws[idx][1] * 1000) - 80)); // titulok o chlp skor ako zaznie slovo
  }
  return out;
};

// 1) generovanie a dlzky viet
for (const [clip, lines] of Object.entries(vo)) {
  if (!Array.isArray(lines)) continue;
  lines.forEach((l, i) => {
    const file = `public/vo/lines/${clip}-${i}.wav`;
    if (!reuse || !existsSync(file)) {
      const say = engine === 'gemini' ? l.text : (l.say ?? l.text);
      if (engine === 'gemini') {
        const gv = args.includes('--voice') ? voice : 'voice_7ws1j8pd39cu';
        const style = vo._style ? ['--style', vo._style] : [];
        const header = args.includes('--header') ? ['--header'] : [];
        execFileSync('python3', ['scripts/gemini_tts.py', '--text', say, '--out', file + '.raw.wav', '--voice', gv, ...style, ...header], { stdio: ['ignore', 'inherit', 'inherit'] });
        execFileSync(FF, ['-v', 'error', '-y', '-i', file + '.raw.wav', '-af', 'loudnorm=I=-18:TP=-2', '-ar', '48000', '-ac', '1', file]);
      } else if (engine === 'piper') {
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
  });
}

// 2) casti titulkov: casy slov cez scripts/vo_words.py (faster-whisper, cache <veta>.words.json), inak pauzy v nahravke
const todo = [];
const cached = {};
for (const [clip, lines] of Object.entries(vo)) {
  if (!Array.isArray(lines)) continue;
  lines.forEach((l, i) => {
    if (!l.parts) return;
    const file = `public/vo/lines/${clip}-${i}.wav`;
    const cache = file.replace(/\.wav$/, '.words.json');
    const size = statSync(file).size;
    const c = existsSync(cache) ? JSON.parse(readFileSync(cache, 'utf8')) : null;
    if (c && c.text === l.text && c.size === size) cached[file] = c.words;
    else todo.push({ file, text: l.text, cache, size });
  });
}
if (todo.length) {
  try {
    writeFileSync('public/vo/lines/_words.json', JSON.stringify(todo));
    const out = JSON.parse(execFileSync('python3', ['scripts/vo_words.py', 'public/vo/lines/_words.json'], { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 26 }).toString());
    for (const t of todo) {
      cached[t.file] = out[t.file];
      writeFileSync(t.cache, JSON.stringify({ text: t.text, size: t.size, words: out[t.file] }));
    }
  } catch {
    console.log('scripts/vo_words.py nebezi (pip install faster-whisper), casti titulkov podla pauz v nahravke');
  }
}

// 3) tabulka, kontrola prekryvov, mix stopy klipu
console.log('klip | veta | od (s) | trva (s) | do (s) | slov');
let overlaps = 0;
for (const [clip, lines] of Object.entries(vo)) {
  if (!Array.isArray(lines)) continue;
  const inputs = [];
  const delays = [];
  lines.forEach((l, i) => {
    const file = `public/vo/lines/${clip}-${i}.wav`;
    if (l.parts) l.partAt = partsFromWords(l.parts, cached[file]) ?? partStarts(file, l.parts, l.dur);
    else delete l.partAt;
    inputs.push('-i', file);
    delays.push(`[${i}]adelay=${l.at}|${l.at}[d${i}]`);
    const prev = lines[i - 1];
    const over = prev && prev.at + prev.dur + 150 > l.at; // vety sa nesmu prekryvat (min. 150 ms medzera)
    if (over) overlaps++;
    console.log(`${clip} | ${i + 1} | ${(l.at / 1000).toFixed(1)} | ${(l.dur / 1000).toFixed(1)} | ${((l.at + l.dur) / 1000).toFixed(1)} | ${l.text.split(/\s+/).length}${over ? '  <-- PREKRYV s predchadzajucou vetou' : ''}`);
    if (l.partAt) l.parts.forEach((p, k) => console.log(`      ${((l.at + l.partAt[k]) / 1000).toFixed(2)} s  ${p}`));
  });
  const mix = `${delays.join(';')};${lines.map((_, i) => `[d${i}]`).join('')}amix=inputs=${lines.length}:normalize=0:dropout_transition=0,aresample=48000`;
  execFileSync(FF, ['-v', 'error', '-y', ...inputs, '-filter_complex', mix, '-ac', '1', `public/vo/${clip}.wav`]);
}
writeFileSync('src/copy/vo.json', JSON.stringify(vo, null, 2) + '\n');
if (overlaps) console.log(`\n${overlaps} veta/vety sa prekryvaju, posun 'at' vo vo.json.`);
