#!/usr/bin/env node
/**
 * Export pre web: zapise out/web/manifest.json, podla ktoreho si produktova
 * stranka na assetin.sk (repo Assetin.sk, `npm run sync:archives`) stiahne
 * video, klipy, stills, texty krokov a prepis nahovoru.
 *
 * Pouzitie (po `npm run render` a `npm run stills`):
 *   npm run export:web
 *
 * Manifest neobsahuje kopie suborov, len cesty (relativne k video/), velkost
 * a SHA-256. Web tak vie overit, ze stiahol presne to, co manifest popisuje,
 * a ze manifest nie je starsi ako render (sha nesedi -> treba znova exportovat).
 *
 * Zdroje pravdy:
 *   src/scenesList.ts  poradie a dlzky klipov, frame-y stills
 *   src/copy/steps.ts  texty krokov v obraze
 *   VOICEOVER.md       nahovor (citaty v uvodzovkach „...“)
 *   src/theme.ts       rozmery a fps
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'out/web/manifest.json');
const SCHEMA = 1;

const fail = (msg) => {
  console.error(`export-web: ${msg}`);
  process.exit(1);
};

// --- rozmery a fps (src/theme.ts) ---
const theme = readFileSync(join(ROOT, 'src/theme.ts'), 'utf8');
const num = (name) => {
  const m = theme.match(new RegExp(`export const ${name} = (\\d+)`));
  if (!m) fail(`v src/theme.ts chyba ${name}`);
  return Number(m[1]);
};
const W = num('W');
const H = num('H');
const FPS = num('FPS');

// --- klipy (src/scenesList.ts, len SCENE_LIST = jadro videa) ---
const list = readFileSync(join(ROOT, 'src/scenesList.ts'), 'utf8').split('V1_LIST')[0];
const re = /\['([A-Za-z0-9-]+)', \{[^}]*seconds: ([0-9.]+), stills: \[([0-9, ]+)\]/g;
const scenes = [];
for (let m; (m = re.exec(list)); ) {
  scenes.push({ id: m[1], seconds: Number(m[2]), stillCount: m[3].split(',').length });
}
if (scenes.length === 0) fail('v src/scenesList.ts sa nenasiel ziaden klip');

// --- texty krokov (src/copy/steps.ts, cisty TS bez importov) ---
let STEPS_BY_CLIP;
try {
  ({ STEPS_BY_CLIP } = await import(pathToFileURL(join(ROOT, 'src/copy/steps.ts')).href));
} catch (e) {
  fail(`src/copy/steps.ts sa nedal nacitat (treba Node 22.6+ s --experimental-strip-types): ${e.message}`);
}
for (const id of Object.keys(STEPS_BY_CLIP)) {
  if (!scenes.some((s) => s.id === id)) fail(`steps.ts ma kroky pre ${id}, ale klip nie je v SCENE_LIST`);
}

// --- subory ---
/** Datum posledneho commitu suboru; necommitnuta zmena = dnes. */
const changed = (rel) => {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const dirty = execFileSync('git', ['status', '--porcelain', '--', rel], { cwd: ROOT, encoding: 'utf8' }).trim();
    if (dirty) return today;
    const d = execFileSync('git', ['log', '-1', '--format=%cs', '--', rel], { cwd: ROOT, encoding: 'utf8' }).trim();
    return d || today;
  } catch {
    return today;
  }
};

const file = (rel, { optional = false } = {}) => {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) {
    if (optional) return null;
    fail(`chyba subor ${rel} (spusti npm run render / npm run stills)`);
  }
  const buf = readFileSync(abs);
  return {
    path: rel,
    bytes: buf.length,
    sha256: createHash('sha256').update(buf).digest('hex'),
    changed: changed(rel),
  };
};

// --- nahovor (VOICEOVER.md) ---
/**
 * Sekcie `## C2 · Hladanie (10,5 s) ...` a v nich citaty „...“ v poradi textu.
 * Citat hned za "(" je poznamka k strihu, nie nahovor - preskakuje sa.
 */
const parseVoiceover = (md) => {
  const sections = [];
  let cur = null;
  for (const raw of md.split('\n')) {
    const h = raw.match(/^## ([A-Z]\d+) · ([^(]+?)\s*\(/);
    if (h) {
      cur = { clip: h[1], title: h[2].trim(), lines: [], tail: [] };
      sections.push(cur);
    }
    if (!cur) continue;
    // Nahovor v nadpise patri footage, ktora ide po klipe (C6 -> F4 Kontrola),
    // preto ide az na koniec sekcie.
    const into = h ? cur.tail : cur.lines;
    for (const q of raw.matchAll(/„([^“]+)“/g)) {
      if (raw[q.index - 1] === '(') continue;
      into.push(q[1].trim());
    }
  }
  return sections
    .map(({ tail, ...s }) => ({ ...s, lines: [...s.lines, ...tail] }))
    .filter((s) => s.lines.length > 0)
    .map((s) => ({ ...s, text: joinLines(s.lines) }));
};
/**
 * Citaty su useky jednej vety rozdelenej casom ("...za uskladnenie…" +
 * "…hladanie trva hodiny"). Pri spajani sa z "… …" stane ciarka a osamotene
 * "…" na zaciatku vety zmizne.
 */
const joinLines = (lines) =>
  lines
    .join(' ')
    .replace(/…\s+…\s*(a|aj|alebo|ani|i)\s/g, ' $1 ')
    .replace(/…\s+…/g, ', ')
    .replace(/([.!?])\s+…\s*(\p{L})/gu, (_, end, ch) => `${end} ${ch.toUpperCase()}`)
    .replace(/\s+/g, ' ')
    .trim();

const voiceover = parseVoiceover(readFileSync(join(ROOT, 'VOICEOVER.md'), 'utf8'));
const titleOf = (id) => voiceover.find((v) => id.startsWith(`${v.clip}-`))?.title ?? null;

// --- manifest ---
const frames = (s) => Math.round(s * FPS);
const clips = scenes.map((s, i) => ({
  id: s.id,
  order: i + 1,
  title: titleOf(s.id),
  seconds: frames(s.seconds) / FPS,
  file: file(`out/mp4/${s.id}.mp4`),
  stills: Array.from({ length: s.stillCount }, (_, k) => file(`out/stills/${s.id}_${k + 1}.png`)),
  steps: (STEPS_BY_CLIP[s.id] ?? []).map(({ title, line }) => ({ title, line })),
}));

const fullFrames = scenes.reduce((a, s) => a + frames(s.seconds), 0);
const full = {
  seconds: fullFrames / FPS,
  files: {
    '1080p': file('out/mp4/Full_1080p.mp4'),
    '540p': file('out/mp4/Full_preview_540p.mp4', { optional: true }),
  },
};
if (!full.files['540p']) delete full.files['540p'];

// Bez casu generovania: rovnaky vstup = rovnaky manifest (ziadny sum v diffe).
const allFiles = [...Object.values(full.files), ...clips.flatMap((c) => [c.file, ...c.stills])];
const updated = allFiles.map((f) => f.changed).sort().at(-1);

const manifest = {
  schema: SCHEMA,
  updated,
  source: { repo: 'AssetinSpace/ArchiveApp', dir: 'video' },
  video: { width: W, height: H, fps: FPS },
  full,
  clips,
  transcript: voiceover,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`);

const mb = (b) => (b / 1024 / 1024).toFixed(1);
console.log(`export-web: ${clips.length} klipov, plne video ${full.seconds.toFixed(1)} s (${mb(full.files['1080p'].bytes)} MB)`);
console.log(`export-web: kroky pre ${Object.keys(STEPS_BY_CLIP).join(', ')}`);
console.log(`export-web: nahovor ${voiceover.length} sekcii -> ${OUT.replace(`${ROOT}/`, '')}`);
