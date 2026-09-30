import React from 'react';
import { getInputProps, useCurrentFrame } from 'remotion';
import vo from '../copy/vo.json';
import voKratka from '../copy/vo_kratka.json';
import { FONT, INK } from '../theme';

type Line = { at: number; text: string; dur?: number; parts?: string[]; partAt?: number[] };
/** Hlavny scenar + experiment kratkej verzie (klipy K-*, T-*; ID sa neprekryvaju). */
const script = { ...(voKratka as object), ...(vo as object) } as unknown as Record<string, Line[] | string>;

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
 * Titulky nahovoru (kolo 50: 50 px, Manrope 700, y 900): jedna veta dole v strede (predtym y 926, jeden riadok), biela na tmavych
 * klipoch, ink na svetlych. Casy a trvanie z vo.json (dur dopise scripts/vo.mjs),
 * takze titulok drzi presne pokial znie veta (+ 250 ms), min. 1,2 s.
 * `darkUntil`: klip je tmavy do daneho ms (C4 prechadza do bielej), potom svetly. `left`: posun titulku doprava (F1).
 * Kolo 33: zaznam s `parts` sa ukazuje po castiach (jeden riadok), casy casti `partAt` (ms od `at`) dopise vo.mjs.
 */
export const Subtitles: React.FC<{ clip: string; dark?: boolean; darkUntil?: number; left?: number }> = ({ clip, dark = false, darkUntil, left = 120 }) => {
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
        right: left > 120 ? 360 : 120, // kolo 50: okraj ramca (FRAME.side); posunuty titulok (F1) ma dva riadky, konci pred stlpcom loga v rohu (od x 1578)
        top: 900, // kolo 50: pod oknom aplikacie (APP_WIN konci na 880), nad logom v rohu (od 988)
        textAlign: 'center',
        fontFamily: FONT.display,
        fontWeight: 700, // kolo 50: ako velke titulky kratkej verzie (Manrope 700), vacsie
        fontSize: 50,
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
