import cuts from '../footage/cuts.json';

type Seg = { from: number; to: number; speed?: number; before?: number; after?: number; note?: string };
type Cut = { src: string; segs: Seg[] };
const table = cuts as unknown as Record<string, Cut | string>;

const segs = (id: string) => (table[id] as Cut).segs;
const play = (s: Seg) => (s.to - s.from) / (s.speed ?? 1);

/** Cas v zostrihu (s), kde zacina segment i (vratane zmrazeneho zaciatku). */
export const segStart = (id: string, i: number) => segs(id).slice(0, i).reduce((a, s) => a + (s.before ?? 0) + play(s) + (s.after ?? 0), 0);
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
