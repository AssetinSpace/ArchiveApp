import React from 'react';
import { interpolate } from 'remotion';
import { BRAND, H, INK, W } from '../theme';

/**
 * Ramiky zariadeni v palete videa. `fill` 0..1: 0 = zariadenie v
 * ilustracii na pozicii `at` (lavy horny roh + rozmer), 1 = displej
 * vyplni cely frame (strihovy bod pre footage). Medzi tym sa
 * interpoluje pozicia aj velkost, ramik postupne zmizne.
 */
export type Rect = { x: number; y: number; w: number; h: number };

/** Mobil vlavo pre footage z aplikacie (F1): pomer displeja = pomer orezaneho zaznamu (884 x 1628). */
export const FOOTAGE_PHONE: Rect = { x: 285, y: 60, w: 530, h: 960 };
export const PHONE_BEZEL = 0.07;

const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: interpolate(t, [0, 1], [a.x, b.x]),
  y: interpolate(t, [0, 1], [a.y, b.y]),
  w: interpolate(t, [0, 1], [a.w, b.w]),
  h: interpolate(t, [0, 1], [a.h, b.h]),
});

/** Mobil: telo + displej. Displej je `children` (footage alebo placeholder). */
export const PhoneFrame: React.FC<{ at: Rect; fill?: number; rotate?: number; children?: React.ReactNode; opacity?: number }> = ({
  at,
  fill = 0,
  rotate = 0,
  children,
  opacity = 1,
}) => {
  // pri fill=1 displej (nie telo) vyplni frame: telo je o okraje vacsie
  const bezel = 0.07;
  const screenTarget: Rect = { x: 0, y: 0, w: W, h: H };
  const bodyTarget: Rect = { x: -W * bezel, y: -H * bezel * 1.5, w: W * (1 + 2 * bezel), h: H * (1 + 3 * bezel) };
  const body = lerpRect(at, bodyTarget, fill);
  const screen0: Rect = { x: at.x + at.w * bezel, y: at.y + at.h * bezel * 0.9, w: at.w * (1 - 2 * bezel), h: at.h * (1 - 2 * bezel * 0.9) };
  const screen = lerpRect(screen0, screenTarget, fill);
  const r = interpolate(fill, [0, 1], [at.w * 0.14, 0]);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity, transform: `rotate(${rotate * (1 - fill)}deg)`, transformOrigin: `${at.x + at.w / 2}px ${at.y + at.h / 2}px`, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: body.x, top: body.y, width: body.w, height: body.h, borderRadius: r * 1.5, background: INK[900] }} />
      <div style={{ position: 'absolute', left: screen.x, top: screen.y, width: screen.w, height: screen.h, borderRadius: r, background: '#fff', overflow: 'hidden' }}>
        {children}
      </div>
      {/* notch */}
      <div style={{ position: 'absolute', left: at.x + at.w * 0.35, top: at.y + at.h * 0.03, width: at.w * 0.3, height: at.h * 0.02, borderRadius: 99, background: INK[600], opacity: 1 - fill }} />
    </div>
  );
};

/** Okno aplikacie: lista s tromi bodkami + obsah. */
export const WindowFrame: React.FC<{ at: Rect; fill?: number; children?: React.ReactNode; opacity?: number; chrome?: number; title?: string }> = ({
  at,
  fill = 0,
  children,
  opacity = 1,
  chrome = 1,
  title = 'archiveapp.assetin.space',
}) => {
  const target: Rect = { x: -4, y: -60, w: W + 8, h: H + 64 };
  const box = lerpRect(at, target, fill);
  const bar = 44;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: box.x,
          top: box.y,
          width: box.w,
          height: box.h,
          borderRadius: interpolate(fill, [0, 1], [14, 0]),
          background: `rgba(255,255,255,${Math.max(chrome, fill)})`,
          border: `2px solid rgba(226,232,240,${chrome})`,
          boxShadow: `0 ${20 * (1 - fill)}px ${60 * (1 - fill)}px rgba(15,23,42,${0.12 * (1 - fill) * chrome})`,
          overflow: 'hidden',
        }}
      >
        <div style={{ height: bar, background: INK[50], borderBottom: `1px solid ${INK[200]}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', opacity: chrome }}>
          {[INK[300], INK[300], BRAND[400]].map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
          ))}
          <div style={{ marginLeft: 16, flex: 1, height: 24, borderRadius: 6, background: '#fff', border: `1px solid ${INK[200]}`, fontFamily: 'Inter', fontSize: 15, color: INK[500], padding: '2px 10px' }}>{title}</div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: bar, bottom: 0 }}>{children}</div>
      </div>
    </div>
  );
};
