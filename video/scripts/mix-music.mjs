// Full s hudbou (kolo 37): poskladá Full z klipov out/mp4/<ID>.mp4 v poradí SCENE_LIST a podmaže hudbu
// public/music/bed.wav (Lyria, scripts/music.py) so stíšením pod hlasom (sidechain), -16 LUFS.
//
// Použitie: node scripts/mix-music.mjs [--music public/music/bed.wav] [--tempo auto|0.983] [--gain -6] [--range 0] [--no-music]
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
const GAIN = Number(opt('--gain', '-6'));
const withMusic = !args.includes('--no-music');
const FF = process.env.FFMPEG ?? execFileSync('python3', ['-c', 'import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())']).toString().trim();
const TMP = 'out/tmp';
mkdirSync(TMP, { recursive: true });

const stderr = (a) => spawnSync(FF, a, { encoding: 'utf8', maxBuffer: 1 << 28 }).stderr;
const probe = (f) => {
  const m = stderr(['-i', f]).match(/Duration: (\d+):(\d+):([\d.]+)/);
  return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : NaN;
};

// poradie klipov ako v render.sh (SCENE_LIST v src/scenesList.ts)
const list = readFileSync('src/scenesList.ts', 'utf8').split('SCENE_LIST')[1].split('\n];')[0];
const ids = [...list.matchAll(/^ {2}(?:\[|paced\()'([A-Za-z0-9-]+)'/gm)].map((m) => m[1]);

// C1 nemá zvuk: tichá stopa, inak concat zahodí zvuk
const files = ids.map((id) => `out/mp4/${id}.mp4`);
const silent = `${TMP}/C1-silent.mp4`;
execFileSync(FF, ['-v', 'error', '-y', '-i', files[0], '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-shortest', '-c:v', 'copy', '-c:a', 'aac', silent]);
files[0] = silent;
writeFileSync(`${TMP}/list.txt`, files.map((f) => `file '${process.cwd()}/${f}'`).join('\n') + '\n');
const voice = `${TMP}/Full_voice.mp4`;
execFileSync(FF, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${TMP}/list.txt`, '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', voice]);
const total = probe(voice);

let t = 0;
console.log('Predely:');
ids.forEach((id, i) => {
  const d = probe(files[i]);
  console.log(`  ${String(Math.floor(t / 60))}:${(t % 60).toFixed(1).padStart(4, '0')}  ${id} (${d.toFixed(2)} s)`);
  t += d;
});
console.log(`Full ${total.toFixed(2)} s`);

const out = 'out/mp4/Full_1080p.mp4';
if (!withMusic) {
  execFileSync(FF, ['-v', 'error', '-y', '-i', voice, '-c:v', 'copy', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', out]);
} else {
  const T = total.toFixed(3);
  // kolo 39: vyrovnanie hlasitosti skladby (tichy uvod Lyria bol pod hlasom nepocut), vysledok float WAV
  const LEVEL = MUSIC.replace(/\.wav$/, '_level.wav');
  execFileSync('python3', ['scripts/music_level.py', MUSIC, LEVEL, '--range', opt('--range', '0')], { stdio: 'inherit' });
  const musicEnd = JSON.parse(readFileSync('src/copy/music.json', 'utf8')).end ?? probe(MUSIC);
  const TEMPO = TEMPO_ARG === 'auto' ? Math.min(1.03, Math.max(0.97, musicEnd / (total - 0.4))) : Number(TEMPO_ARG);
  console.log(`hudba: tempo ${TEMPO.toFixed(4)} (koniec skladby ${musicEnd} s -> ${(musicEnd / TEMPO).toFixed(2)} s)`);
  const fc = [
    // hlas: stereo, jedna vetva do mixu, druha ako kluc stisenia
    `[0:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v][key]`,
    // hudba: tempo na dlzku filmu, jemny zarez 1-3 kHz (plucky vs. rec), zaciatok a koniec
    `[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,atempo=${TEMPO},atrim=0:${T},asetpts=PTS-STARTPTS,equalizer=f=2000:t=q:w=1.2:g=-3,volume=${GAIN}dB,alimiter=limit=0.9:level=disabled,afade=t=in:st=0:d=0.4,afade=t=out:st=${(total - 1.2).toFixed(3)}:d=1.2[m]`,
    // stisenie pod hlasom
    `[m][key]sidechaincompress=threshold=0.02:ratio=3:attack=40:release=600:knee=4[md]`,
    `[v][md]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]`,
  ].join(';');
  execFileSync(FF, ['-v', 'error', '-y', '-i', voice, '-i', LEVEL, '-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', out]);
}
execFileSync(FF, ['-v', 'error', '-y', '-i', out, '-vf', 'scale=960:540', '-c:v', 'libx264', '-crf', '24', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', 'out/mp4/Full_preview_540p.mp4']);
const meter = stderr(['-nostats', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-']);
const summary = meter.split('Summary:')[1] ?? '';
console.log(`${out}: ${probe(out).toFixed(2)} s, ${summary.match(/I:\s+[-\d.]+ LUFS/)?.[0] ?? '?'}, true peak ${summary.match(/Peak:\s+[-\d.]+ dBFS/)?.[0] ?? '?'}`);
