import React from 'react';
import { BRAND, FONT, LAYOUT, Mode, modeColors } from '../theme';
import { riseStyle } from '../lib/anim';

/** Zelena ciarka + verzalky s rozostupom, ako v brozure. */
export const Kicker: React.FC<{ text: string; mode?: Mode; t?: number }> = ({ text, mode = 'light', t = 1 }) => {
  const c = modeColors(mode);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, ...riseStyle(t, 12) }}>
      <div style={{ width: 36, height: 5, background: BRAND[600], borderRadius: 3 }} />
      <div
        style={{
          fontFamily: FONT.body,
          fontWeight: 600,
          fontSize: 26,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: c.kicker,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Nadpis Manrope 700, riadky nastupuju samostatne (t pole 0..1 per riadok). */
export const Headline: React.FC<{ lines: string[]; mode?: Mode; t?: number[]; size?: number }> = ({
  lines,
  mode = 'light',
  t,
  size = 68,
}) => {
  const c = modeColors(mode);
  return (
    <div
      style={{
        fontFamily: FONT.display,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.14,
        letterSpacing: '-0.015em',
        color: c.headline,
      }}
    >
      {lines.map((l, i) => (
        <div key={i} style={riseStyle(t ? t[i] ?? 1 : 1, 28)}>
          {l}
        </div>
      ))}
    </div>
  );
};

export const Body: React.FC<{ text: React.ReactNode; mode?: Mode; t?: number; size?: number; maxWidth?: number }> = ({
  text,
  mode = 'light',
  t = 1,
  size = 32,
  maxWidth = LAYOUT.textCol,
}) => {
  const c = modeColors(mode);
  return (
    <div
      style={{
        fontFamily: FONT.body,
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1.45,
        color: c.body,
        maxWidth,
        ...riseStyle(t, 20),
      }}
    >
      {text}
    </div>
  );
};

/** Textovy stlpec vlavo (kicker, nadpis, odsek) s rozostupmi ako v brozure. */
export const TextColumn: React.FC<{
  kicker?: string;
  lines: string[];
  body?: React.ReactNode;
  mode?: Mode;
  tKicker?: number;
  tLines?: number[];
  tBody?: number;
  top?: number;
  width?: number;
  headlineSize?: number;
}> = ({ kicker, lines, body, mode = 'light', tKicker = 1, tLines, tBody = 1, top = 150, width = LAYOUT.textCol, headlineSize }) => (
  <div style={{ position: 'absolute', left: LAYOUT.margin, top, width, display: 'flex', flexDirection: 'column', gap: 34 }}>
    {kicker ? <Kicker text={kicker} mode={mode} t={tKicker} /> : null}
    <Headline lines={lines} mode={mode} t={tLines} size={headlineSize} />
    {body ? <Body text={body} mode={mode} t={tBody} /> : null}
  </div>
);

/**
 * Caption: jediny text v obraze (max ~7 slov), dolna tretina, nastupuje
 * po akcii (`t` 0..1) a volitelne odchadza (`out` 0..1).
 */
export const Caption: React.FC<{ text: string; mode?: Mode; t?: number; out?: number; size?: number; y?: number }> = ({
  text,
  mode = 'light',
  t = 1,
  out = 0,
  size = 54,
  y = 880,
}) => {
  const c = modeColors(mode);
  const a = t * (1 - out);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: y,
        textAlign: 'center',
        fontFamily: FONT.display,
        fontWeight: 600,
        fontSize: size,
        letterSpacing: '-0.01em',
        lineHeight: 1.2,
        color: c.headline,
        opacity: a,
        transform: `translateY(${(1 - t) * 24 + out * -12}px)`,
        padding: '0 200px',
      }}
    >
      {text}
    </div>
  );
};
