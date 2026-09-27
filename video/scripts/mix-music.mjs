// Full s hudbou (kolo 37): poskladá Full z klipov out/mp4/<ID>.mp4 v poradí SCENE_LIST a podmaže hudbu
// public/music/bed.wav (Lyria, scripts/music.py) so stíšením pod hlasom (sidechain), -16 LUFS.
//
// Použitie: node scripts/mix-music.mjs [--music public/music/bed.wav] [--tempo auto|0.983] [--gain -6] [--range 0] [--no-music]
//           [--list src/scenesList.ts:SCENE_LIST] [--clips out/mp4] [--out out/mp4/Full_1080p.mp4] [--cfg src/copy/music.json] [--variant K]
//   experiment kratkej verzie: --list src/kratkaList.ts:K_LIST --clips out/kratka --out out/kratka/K_1080p.mp4 --cfg src/copy/music_kratka.json --variant K
//   --range  vyrovnanie skladby (scripts/music_level.py): tiché časti najviac o toľko dB pod plnou (kolo 39: 0)
//   --tempo  atempo hudby; auto (predvolene) = koniec skladby ("end" v src/copy/music.json) padne 0,4 s pred koniec filmu (±3 % tempo nepočuť)
//   --gain   hlasitosť hudby v dB pred stíšením; -6 dB + stíšenie (prah 0,02, pomer 3): pod hlasom ~14 dB pod rečou, v pauzách ~7 dB
// Výstup: out/mp4/Full_1080p.mp4, out/mp4/Full_preview_540p.mp4; vypíše dĺžky, časy predelov a hlasitosť.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const MUSIC = opt('--music', 'public/music/bed.wav');
const TEMPO_ARG = opt('--tempo', 'auto');
const GAIN = Number(opt('--gain', '-7')); // kolo 43: o 1 dB tichsie (Samuel: velmi jemne stisit)
const withMusic = !args.includes('--no-music');
const [LIST_FILE, LIST_NAME] = opt('--list', 'src/scenesList.ts:SCENE_LIST').split(':');
const CLIPS = opt('--clips', 'out/mp4');
const OUT = opt('--out', 'out/mp4/Full_1080p.mp4');
const PREVIEW = OUT.replace(/_1080p\.mp4$/, '_preview_540p.mp4');
const CFG = opt('--cfg', 'src/copy/music.json');
const VARIANT = opt('--variant', null);
const TAG = OUT.split('/').pop().replace(/_1080p\.mp4$/, ''); // docasne subory podla vystupu (Full, K, T)
const FF = process.env.FFMPEG ?? execFileSync('python3', ['-c', 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())']).toString().trim();
const TMP = 'out/tmp';
mkdirSync(TMP, { recursive: true });

const stderr = (a) => spawnSync(FF, a, { encoding: 'utf8', maxBuffer: 1 << 28 }).stderr;
const probe = (f) => {
  const m = stderr(['-i', f]).match(/Duration: (\d+):(\d+):([\d.]+)/);
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : NaN;
};

// --video: hotove video s hlasom (experiment: LinkedIn 4:5 z jedneho renderu), bez skladania klipov
const VIDEO = opt('--video', null);
const joinClips = () => {
  // poradie klipov ako v render.sh (SCENE_LIST v src/scenesList.ts, pri experimente K_LIST / T_LIST v src/kratkaList.ts)
  const list = readFileSync(LIST_FILE, 'utf8').split(`${LIST_NAME}: [`)[1].split('\n];')[0];
  const ids = [...list.matchAll(/^ {2}(?:\[|paced\()'([A-Za-z0-9-]+)'/gm)].map((m) => m[1]);

  // klip bez zvuku (C1, v kratkej verzii K-F1): ticha stopa, inak concat zahodi zvuk. Ticha stopa ma rozlozenie kanalov
  // ako ostatne klipy (Remotion: stereo); mono ticho uprostred filmu rozbilo v concat zvuk vsetkych dalsich klipov.
  const files = ids.map((id) => `${CLIPS}/${id}.mp4`);
  const layout = files.map((f) => stderr(['-i', f]).match(/Audio:.*?Hz, (mono|stereo)/)?.[1]).find(Boolean) ?? 'stereo';
  files.forEach((f, i) => {
    if (/Audio:/.test(stderr(['-i', f]))) return;
    const silent = `${TMP}/${ids[i]}-silent.mp4`;
    execFileSync(FF, ['-v', 'error', '-y', '-i', f, '-f', 'lavfi', '-i', `anullsrc=r=48000:cl=${layout}`, '-shortest', '-c:v', 'copy', '-c:a', 'aac', silent]);
    files[i] = silent;
  });
  writeFileSync(`${TMP}/${TAG}_list.txt`, files.map((f) => `file '${process.cwd()}/${f}'`).join('\n') + '\n');
  const voice = `${TMP}/${TAG}_voice.mp4`;
  execFileSync(FF, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${TMP}/${TAG}_list.txt`, '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', voice]);

  let t = 0;
  console.log('Predely:');
  ids.forEach((id, i) => {
    const d = probe(files[i]);
    console.log(`  ${String(Math.floor(t / 60))}:${(t % 60).toFixed(1).padStart(4, '0')}  ${id} (${d.toFixed(2)} s)`);
    t += d;
  });
  return voice;
};
const voice = VIDEO ?? joinClips();
const total = probe(voice);
console.log(`${TAG} ${total.toFixed(2)} s`);

/** Filter: [1:a] bez usekov cuts ([od, do] s), spojene prelinackou xf -> [mc]. */
const musicCuts = (cuts, xf) => {
  if (!cuts.length) return ['[1:a]anull[mc]'];
  const bounds = [0, ...cuts.flat(), 1e9];
  const n = cuts.length + 1;
  const parts = [`[1:a]asplit=${n}${Array.from({ length: n }, (_, i) => `[s${i}]`).join('')}`];
  for (let i = 0; i < n; i++) parts.push(`[s${i}]atrim=${bounds[2 * i]}:${bounds[2 * i + 1] === 1e9 ? '' : bounds[2 * i + 1]},asetpts=PTS-STARTPTS[p${i}]`.replace(':,', ','));
  let prev = 'p0';
  for (let i = 1; i < n; i++) {
    const outName = i === n - 1 ? 'mc' : `j${i}`;
    parts.push(`[${prev}][p${i}]acrossfade=d=${xf}[${outName}]`);
    prev = outName;
  }
  return parts;
};

const out = OUT;
if (!withMusic) {
  execFileSync(FF, ['-v', 'error', '-y', '-i', voice, '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', out]);
} else {
  const T = total.toFixed(3);
  // kolo 39: vyrovnanie hlasitosti skladby (tichy uvod Lyria bol pod hlasom nepocut), vysledok float WAV
  const LEVEL = MUSIC.replace(/\.wav$/, '_level.wav');
  execFileSync('python3', ['scripts/music_level.py', MUSIC, LEVEL, '--range', opt('--range', '0')], { stdio: 'inherit' });
  const cfg = JSON.parse(readFileSync(CFG, 'utf8'));
  const mcfg = VARIANT ? { ...cfg, ...cfg[VARIANT] } : cfg; // experiment: vlastne strihy hudby pre K a T
  // kolo 41: vystrihnute useky skladby (music.json "cuts", na dobu), prelinacka XF; koniec skladby sa posunie o ich dlzku
  const cuts = mcfg.cuts ?? [];
  const XF = 0.06;
  const cutLen = cuts.reduce((s, [a, b]) => s + (b - a) + XF, 0);
  const musicEnd = (mcfg.end ?? probe(MUSIC)) - cutLen;
  const TEMPO = TEMPO_ARG === 'auto' ? Math.min(1.03, Math.max(0.97, musicEnd / (total - 0.4))) : Number(TEMPO_ARG);
  console.log(`hudba: tempo ${TEMPO.toFixed(4)} (koniec skladby ${musicEnd} s -> ${(musicEnd / TEMPO).toFixed(2)} s)`);
  const fc = [
    // hlas: stereo, jedna vetva do mixu, druha ako kluc stisenia
    `[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v][key]`,
    // hudba: tempo na dlzku filmu, jemny zarez 1-3 kHz (plucky vs. rec), zaciatok a koniec
    ...musicCuts(cuts, XF),
    `[mc]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,atempo=${TEMPO},atrim=0:${T},asetpts=PTS-STARTPTS,equalizer=f=2000:t=q:w=1.2:g=-3,volume=${GAIN}dB,alimiter=limit=0.9:level=disabled,afade=t=in:st=0:d=0.4,afade=t=out:st=${(total - 1.2).toFixed(3)}:d=1.2[m]`,
    // stisenie pod hlasom
    `[m][key]sidechaincompress=threshold=0.02:ratio=3:attack=40:release=600:knee=4[md]`,
    `[v][md]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]`,
  ].join(';');
  execFileSync(FF, ['-v', 'error', '-y', '-i', voice, '-i', LEVEL, '-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', out]);
}
execFileSync(FF, ['-v', 'error', '-y', '-i', out, '-vf', 'scale=-2:540', '-c:v', 'libx264', '-crf', '24', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', PREVIEW]);
const meter = stderr(['-nostats', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
const summary = meter.split('Summary:')[1] ?? '';
console.log(`${out}: ${probe(out).toFixed(2)} s, ${summary.match(/I:\s+[-\d.]+ LUFS/)?.[0] ?? '?'}, true peak ${summary.match(/Peak:\s+[-\d.]+ dBFS/)?.[0] ?? '?'}`);
