import React from 'react';
import { easeInOut, settle } from '../lib/anim';
import type { Rect } from './Device';
import { FONT, INK } from '../theme';

/**
 * Ramec obrazu dlhej verzie 16:9 (kolo 50, Samuel: system z kratkej LinkedIn verzie prenesený na 16:9).
 * V obraze je len nadpis kroku hore vlavo, obsah pod nim, titulky pod obsahom a logo v pravom dolnom rohu
 * (bez nazvu fazy a bodiek postupu, ako v kratkej od kola 8).
 *
 *   44 px    nadpis kroku (Manrope 800, 56 px), vlavo FRAME.side
 *   128 px   okno aplikacie APP_WIN (az po 880 px), zarovnane s nadpisom a s logom v rohu
 *   900 px   titulky (Subtitles, 50 px)
 *   988 px   logo v rohu (CornerBrand, vpravo FRAME.side)
 */
export const FRAME = { side: 120, titleTop: 44, subTop: 900 };
export const APP_WIN: Rect = { x: FRAME.side, y: 128, w: 1920 - 2 * FRAME.side, h: 752 };
export const WIN_CHROME = 44; // vyska listy okna (WindowFrame)

/** Nadpis kroku hore vlavo. `from` v ms klipu; `left` = ina lava hrana (F1 a C5: stlpec textu vpravo od mobilu). */
export const StepLabel: React.FC<{ steps: { from: number; title: string }[]; frame: number; left?: number; opacity?: number }> = ({ steps, frame, left = FRAME.side, opacity = 1 }) => {
  const ms = (frame / 30) * 1000;
  const idx = Math.max(0, steps.findIndex((s, i) => ms >= s.from && (i === steps.length - 1 || ms < steps[i + 1].from)));
  if (opacity <= 0) return null;
  return (
    <>
      {steps.map((s, i) => {
        const inT = settle(frame, s.from);
        return (
          <div key={i} style={{ position: 'absolute', left, right: FRAME.side, top: FRAME.titleTop, opacity: (i === idx ? 1 : 0) * inT * opacity, transform: `translateY(${(1 - inT) * 12}px)`, fontFamily: FONT.display, fontWeight: 800, fontSize: 56, lineHeight: 1.04, letterSpacing: '-0.02em', color: INK[900], whiteSpace: 'nowrap' }}>
            {s.title}
          </div>
        );
      })}
    </>
  );
};

/**
 * Vyrez zaznamu v okne (ako `LiFootage` v kratkej verzii, kolo 13 tam): lavy horny roh a sirka vyrezu v px zdroja,
 * vyska vyplyva z pomeru obsahu okna. `t` v s klipu. Medzi klucmi ease-in-out, priblizenie rovnomerne v mierke.
 */
export type FootView = { t: number; x: number; y: number; w: number };
export const footViewAt = (keys: FootView[], t: number): FootView => {
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1],
      b = keys[i];
    if (t < b.t) {
      const e = easeInOut((t - a.t) / (b.t - a.t));
      const w = a.w * Math.pow(b.w / a.w, e);
      const g = a.w === b.w ? e : (a.w - w) / (a.w - b.w);
      return { t, x: a.x + (b.x - a.x) * g, y: a.y + (b.y - a.y) * g, w };
    }
  }
  return keys[keys.length - 1];
};

/** Podiel oblasti zdroja (0 az 1) -> pre automaticke vyrezy. */
type Region = { from: number; to: number; x: number; y: number; w: number; h: number };
/**
 * Automaticke vyrezy podla zvyrazneni (kolo 50): celkovy pohlad na cely zaznam (na sirku okna), pri kazdom zvyrazneni
 * priblizenie na jeho oblast (najviac na `minW` px zdroja, cca 1,7x) a po nom spat na celkovy pohlad, ak dalsie
 * zvyraznenie nepride hned. `winRatio` = vyska / sirka obsahu okna.
 */
export const autoViews = (marks: Region[], src: { w: number; h: number }, winRatio: number, opts: { minW?: number; overviewY?: number } = {}): FootView[] => {
  const minW = opts.minW ?? 1300; // kolo 53 (Samuel: rozmazane): najviac ~1,3x (predtym 1000 px = 1,7x)
  const vh = (w: number) => w * winRatio;
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  const ov = { x: 0, y: clamp(opts.overviewY ?? (src.h - vh(src.w)) / 2, 0, Math.max(0, src.h - vh(src.w))), w: src.w };
  const keys: FootView[] = [{ t: 0, ...ov }];
  const ms = [...marks].sort((a, b) => a.from - b.from);
  ms.forEach((m, i) => {
    const rx = m.x * src.w,
      ry = m.y * src.h,
      rw = m.w * src.w,
      rh = m.h * src.h;
    const w = clamp(Math.max(rw * 1.6, (rh * 1.8) / winRatio, minW), minW, src.w);
    const z = { x: clamp(rx + rw / 2 - w / 2, 0, src.w - w), y: clamp(ry + rh / 2 - vh(w) / 2, 0, Math.max(0, src.h - vh(w))), w };
    const last = keys[keys.length - 1];
    const tIn = Math.max(m.from - 0.5, last.t + 0.05);
    keys.push({ ...last, t: tIn });
    keys.push({ t: Math.max(m.from + 0.3, tIn + 0.5), ...z });
    keys.push({ t: Math.max(m.to, tIn + 0.6), ...z });
    const next = ms[i + 1];
    if (!next || next.from > m.to + 1.4) keys.push({ t: Math.max(m.to, tIn + 0.6) + 0.8, ...ov });
  });
  return keys;
};
