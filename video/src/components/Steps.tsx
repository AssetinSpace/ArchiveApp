import React from 'react';
import { settle } from '../lib/anim';
import { BRAND, FONT, INK } from '../theme';

export type Step = { from: number; title: string; line?: string }; // from v ms; line uz nepouzivame (kolo 29: jeden textovy prud, vetu nesie nahovor)

/**
 * Sprievodne kroky vpravo (nazov fazy, nazov kroku, riadok, body postupu) - rovnaky
 * jazyk v C5 aj pri footage. `frame` = aktualny frame klipu.
 */
export const StepsPanel: React.FC<{ frame: number; steps: Step[]; phase?: string; left?: number; width?: number; top?: number; opacity?: number }> = ({ frame, steps, phase, left = 1380, width = 500, top = 320, opacity = 1 }) => {
  const ms = (frame / 30) * 1000;
  const idx = Math.max(0, steps.findIndex((s, i) => ms >= s.from && (i === steps.length - 1 || ms < steps[i + 1].from)));
  return (
    <div style={{ position: 'absolute', left, top: 0, width, height: 1080, opacity }}>
      {steps.map((s, i) => {
        const on = i === idx ? 1 : 0;
        const inT = settle(frame, s.from);
        return (
          <div key={i} style={{ position: 'absolute', left: 0, right: 0, top, opacity: on * inT, transform: `translateY(${(1 - inT) * 16}px)` }}>
            <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 22, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND[600], marginBottom: 14 }}>
              {phase ?? `Krok ${i + 1} / ${steps.length}`}
            </div>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 56, lineHeight: 1.05, color: INK[900], letterSpacing: '-0.02em', marginBottom: 14 }}>{s.title}</div>
            {s.line ? <div style={{ fontFamily: FONT.body, fontWeight: 400, fontSize: 30, lineHeight: 1.35, color: INK[500] }}>{s.line}</div> : null}
            <div style={{ display: steps.length > 1 ? 'flex' : 'none', gap: 10, marginTop: 28 }}>
              {steps.map((_, k) => (
                <div key={k} style={{ width: k <= i ? 34 : 12, height: 12, borderRadius: 6, background: k <= i ? BRAND[500] : INK[200] }} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
