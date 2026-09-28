import React from 'react';
import { getInputProps, useCurrentFrame } from 'remotion';
import vo from '../copy/vo.json';
import { FONT, INK } from '../theme';

type Line = { at: number; text: string; dur?: number; parts?: string[]; partAt?: number[] };
const script = vo as unknown as Record<string, Line[] | string>;

export const voLines = (clip: string): Line[] => {
  const v = script[clip];
  return Array.isArray(v) ? v : [];
};

/** Cas (ms od zaciatku klipu), kde zacina veta `i` klipu, pripadne jej cast `k` (partAt). */
export const voAt = (clip: string, i: number, k = 0) => {
  const l = voLines(clip)[i];
  return l.at + (k && l.partAt ? l.partAt[k] : 0);
};

/** Prop subtitles: false vypne titulky (verzia na prezentaciu so zivym komentarom). */
export const useSubtitles = () => {
  const p = getInputProps() as { subtitles?: boolean };
  return p.subtitles !== false;
};

/**
 * Titulky nahovoru: jedna veta dole v strede (y 926, jeden riadok), biela na tmavych
 * klipoch, ink na svetlych. Casy a trvanie z vo.json (dur dopise scripts/vo.mjs),
 * takze titulok drzi presne pokial znie veta (+ 250 ms), min. 1,2 s.
 * `darkUntil`: klip je tmavy do daneho ms (C4 prechadza do bielej), potom svetly. `left`: posun titulku doprava (F1).
 * Kolo 33: zaznam s `parts` sa ukazuje po castiach (jeden riadok), casy casti `partAt` (ms od `at`) dopise vo.mjs.
 */
export const Subtitles: React.FC<{ clip: string; dark?: boolean; darkUntil?: number; left?: number }> = ({ clip, dark = false, darkUntil, left = 200 }) => {
  const frame = useCurrentFrame();
  const ms = (frame / 30) * 1000;
  const lines = voLines(clip);
  const cur = lines.find((l) => ms >= l.at && ms < l.at + Math.max(1200, (l.dur ?? 1500) + 250));
  if (!cur) return null;
  const isDark = darkUntil !== undefined ? ms < darkUntil : dark;
  const k = cur.parts && cur.partAt ? Math.max(0, cur.partAt.filter((p) => ms - cur.at >= p).length - 1) : -1;
  const text = k >= 0 ? cur.parts![k] : cur.text;
  const start = cur.at + (k >= 0 ? cur.partAt![k] : 0);
  const t = Math.min(1, (ms - start) / 180);
  return (
    <div
      style={{
        position: 'absolute',
        left, // F1: 900 (mobil vlavo siaha az dole, titulok je v pravom stlpci)
        right: 200 - Math.max(0, left - 200) / 4,
        top: 926, // pod oknom footage (konci na 898) a nad patickou (od ~990)
        textAlign: 'center',
        fontFamily: FONT.display,
        fontWeight: 600,
        fontSize: 44,
        lineHeight: 1.25,
        letterSpacing: '-0.01em',
        color: isDark ? '#fff' : INK[900],
        opacity: t,
        transform: `translateY(${(1 - t) * 10}px)`,
        textShadow: isDark ? '0 2px 12px rgba(0,0,0,0.35)' : 'none',
      }}
    >
      {text}
    </div>
  );
};
