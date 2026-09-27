import cuts from '../footage/cuts.json';

/**
 * Seg: usek zdroja (s). speed = zrychlenie, before/after = zmrazeny prvy/posledny obraz (s),
 * fade = prelinacka z predosleho segmentu (s, kolo 33): segment zacina o `fade` skor a prekryva koniec predosleho.
 */
type Seg = { from: number; to: number; speed?: number; before?: number; after?: number; fade?: number; note?: string };
type Cut = { src: string; vf?: string; segs: Seg[] };
const table = cuts as unknown as Record<string, Cut | string>;

const segs = (id: string) => (table[id] as Cut).segs;
const play = (s: Seg) => (s.to - s.from) / (s.speed ?? 1);
const len = (s: Seg) => (s.before ?? 0) + play(s) + (s.after ?? 0);

/** Cas v zostrihu (s), kde zacina segment i (vratane zmrazeneho zaciatku a prelinacky). */
export const segStart = (id: string, i: number) => {
  const list = segs(id);
  let t = 0;
  for (let j = 0; j < i; j++) t += len(list[j]) - (list[j + 1]?.fade ?? 0);
  return t;
};
/** Cas v zostrihu (s), kde sa segment i rozbehne (po zmrazenom zaciatku). */
export const segPlay = (id: string, i: number) => segStart(id, i) + (segs(id)[i].before ?? 0);
/** Cas zdroja (s) -> cas v zostrihu (s). Mimo segmentov hodi chybu (chyba v tabulke). */
export const cutTime = (id: string, src: number) => {
  const list = segs(id);
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    if (src >= s.from && src <= s.to) return segPlay(id, i) + (src - s.from) / (s.speed ?? 1);
  }
  throw new Error(`cutTime: ${src} s nie je v ziadnom segmente ${id}`);
};
export const cutDuration = (id: string) => segStart(id, segs(id).length);

/** Orez zaznamu (px zdroja) z `vf` klipu alebo spolocneho `crop` ("w:h:x:y"). */
export const cropOf = (id: string) => {
  const vf = (table[id] as Cut).vf;
  const spec = vf?.match(/crop=(\d+):(\d+):(\d+):(\d+)/)?.slice(1) ?? String(table.crop).split(':');
  const [w, h, x, y] = spec.map(Number);
  return { w, h, x, y };
};
/** Bod alebo obdlznik v px zdroja -> podiely orezaneho zaznamu (pre kliky a zvyraznenia). */
export const srcFrac = (id: string, x: number, y: number, w = 0, h = 0) => {
  const c = cropOf(id);
  return { x: (x - c.x) / c.w, y: (y - c.y) / c.h, w: w / c.w, h: h / c.h };
};
