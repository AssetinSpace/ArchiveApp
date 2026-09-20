/**
 * Vizualne tokeny prevzate z assetin.sk (tailwind.config.mjs) a z dlazdic
 * QuickStart.astro. Paleta ikon: 5 sedych + jeden akcent. Akcent patri len
 * tomu, co sa hybe alebo je vysledkom (QR nalepky, potvrdene udaje).
 */
export const W = 1920;
export const H = 1080;
export const FPS = 30;

/** milisekundy -> frame-y (dlazdice na webe su casovane v ms) */
export const ms = (m: number) => Math.round((m / 1000) * FPS);

export const ISO = {
  top: '#e5e7eb',
  left: '#d1d5db',
  right: '#9ca3af',
  edge: '#6b7280',
  ink: '#1f2937',
  accent: '#1f7a33',
};

export const BRAND = {
  50: '#F1F7F0',
  100: '#DCEEDB',
  200: '#B6DDB4',
  300: '#84C68C',
  400: '#4FA85A',
  500: '#2E8B3A',
  600: '#1F7A33',
  700: '#166526',
  800: '#0F4E1B',
  900: '#0A3712',
};

export const INK = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
};

export const NAVY = {
  900: '#08111F',
  800: '#131F31',
  700: '#263246',
  300: '#9EADC2',
  200: '#C9D3E1',
  100: '#E6EBF2',
};

export const FONT = {
  display: 'Manrope, Inter, system-ui, sans-serif',
  body: 'Inter, system-ui, sans-serif',
};

/** Rozlozenie: text vlavo ako v brozure (okraj 120 px, stlpec ~ 860 px). */
export const LAYOUT = {
  margin: 120,
  textCol: 860,
};

export type Mode = 'light' | 'dark';

export const modeColors = (mode: Mode) =>
  mode === 'dark'
    ? {
        bg: NAVY[900],
        bg2: INK[900],
        headline: '#ffffff',
        body: NAVY[200],
        muted: NAVY[300],
        kicker: BRAND[300],
        rule: NAVY[700],
      }
    : {
        bg: '#ffffff',
        bg2: INK[50],
        headline: INK[900],
        body: INK[700],
        muted: INK[500],
        kicker: BRAND[700],
        rule: INK[200],
      };

/** Bezpecne zony: ilustracia nesmie pod illoBottom, caption sedi na captionY. */
export const SAFE = { illoTop: 60, illoBottom: 800, captionY: 880 };

/**
 * Mierka: 1 jednotka iso sveta = 1 cm. Kazdy klip si zvoli jedno PX_PER_CM
 * a cela ilustracia sa nim skaluje - 2D prvky (list, mobil) sa odvodzuju
 * z tej istej hodnoty, nie odhadom.
 */
export const CM = {
  carton: { w: 52, d: 36, h: 36 },
  binder: { w: 32, d: 8, h: 44 },
  pallet: { w: 120, d: 80, h: 14 },
  shelf: { w: 130, d: 60, level: 60 },
  cabinet: { w: 100, d: 45, h: 200 },
  desk: { w: 160, d: 80, h: 75 },
  roll: { dia: 8, len: 90 },
  sheet: { w: 21, h: 30 },
  phone: { w: 7, h: 15 },
  person: 170,
};
