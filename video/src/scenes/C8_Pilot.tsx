import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { ArchiveBox } from '../components/ArchiveBox';
import { pop, settle, tween } from '../lib/anim';
import { offer } from '../copy/sk';
import { BRAND, FONT, INK } from '../theme';

/**
 * C8 - Ako zacat (kolo 42, predtym "Pilot"): dve ponuky vedla seba.
 * Vlavo hlavna "Sluzba na kluc" (zelena, archiv spracujeme za vas; obhliadka skladu a pilot na jednej krabici),
 * vpravo "Softver" (katalogizuju vlastni ludia v aplikacii; priradenie licencie).
 * Nahovor: 400 "Archiv vam spracujeme na kluc. Zacneme obhliadkou skladu a pilotom na jednej krabici."
 * a 6800 "Alebo ho mozete katalogizovat sami v nasej aplikacii. Staci priradit licenciu." (casy slov + 400 / 6800).
 *
 * ms: 400 karta sluzby · 3300 obhliadka · 4640 pilot · 6800 karta softveru (sluzba stlmena) · 10440 licencia ·
 * 12000 obe karty rovnako. 13 s.
 */
const CARD = { w: 700, h: 560, top: 180, gap: 40 };
const LEFT = 960 - CARD.gap / 2 - CARD.w;
const RIGHT = 960 + CARD.gap / 2;

const Chip: React.FC<{ n: number; label: string; t: number }> = ({ n, label, t }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: Math.min(1, t * 1.4), transform: `translateY(${(1 - Math.min(1, t)) * 14}px)` }}>
    <div style={{ width: 40, height: 40, borderRadius: 20, background: BRAND[600], color: '#fff', fontFamily: FONT.display, fontWeight: 800, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{n}</div>
    <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 28, color: INK[900], whiteSpace: 'nowrap' }}>{label}</div>
  </div>
);

/** Mala aplikacia: okno s vyhladavanim a riadkami zaznamov. */
const AppMini: React.FC = () => (
  <div style={{ width: 360, height: 220, borderRadius: 14, background: '#fff', border: `2px solid ${INK[200]}`, boxShadow: '0 12px 30px rgba(15,23,42,0.08)', overflow: 'hidden' }}>
    <div style={{ height: 32, background: INK[50], borderBottom: `1px solid ${INK[200]}`, display: 'flex', alignItems: 'center', gap: 7, paddingLeft: 12 }}>
      {[INK[300], INK[300], BRAND[400]].map((c, i) => (
        <div key={i} style={{ width: 10, height: 10, borderRadius: 5, background: c }} />
      ))}
    </div>
    <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ height: 30, borderRadius: 8, border: `2px solid ${BRAND[400]}`, display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={BRAND[600]} strokeWidth={3} strokeLinecap="round">
          <circle cx={10.5} cy={10.5} r={6.5} />
          <path d="M15.5 15.5 L21 21" />
        </svg>
      </div>
      {[0.9, 0.7, 0.8].map((w, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, background: INK[200] }} />
          <div style={{ height: 10, borderRadius: 5, background: INK[200], width: `${w * 100}%` }} />
        </div>
      ))}
    </div>
  </div>
);

const Card: React.FC<{ x: number; t: number; dim: number; main?: boolean; title: string; desc: string; art: React.ReactNode; children: React.ReactNode }> = ({ x, t, dim, main, title, desc, art, children }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: CARD.top,
      width: CARD.w,
      height: CARD.h,
      borderRadius: 24,
      background: '#fff',
      border: `${main ? 4 : 2}px solid ${main ? BRAND[500] : INK[200]}`,
      boxShadow: main ? '0 18px 44px rgba(31,122,51,0.16)' : '0 12px 32px rgba(15,23,42,0.06)',
      opacity: t * (1 - 0.45 * dim),
      transform: `translateY(${(1 - t) * 30}px)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '26px 48px 0',
      boxSizing: 'border-box',
    }}
  >
    <div style={{ height: 230, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{art}</div>
    <div style={{ marginTop: 14, fontFamily: FONT.display, fontWeight: 800, fontSize: 52, lineHeight: 1.05, color: main ? BRAND[700] : INK[900], letterSpacing: '-0.02em' }}>{title}</div>
    <div style={{ marginTop: 10, fontFamily: FONT.body, fontWeight: 400, fontSize: 28, lineHeight: 1.3, color: INK[500], textAlign: 'center' }}>{desc}</div>
    <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 }}>{children}</div>
  </div>
);

export const C8_Pilot: React.FC = () => {
  const frame = useCurrentFrame();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const kicker = settle(frame, 200);
  const service = settle(frame, 400);
  const software = settle(frame, 6800);
  const dimService = tw(6900, 400) * (1 - tw(11900, 500)); // pocas vety o softveri je sluzba stlmena
  return (
    <Scene mode="light" footer>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: 24, letterSpacing: '0.16em', textTransform: 'uppercase', color: BRAND[600], opacity: kicker }}>{offer.kicker}</div>
      <Card x={LEFT} t={service} dim={dimService} main title={offer.service.title} desc={offer.service.desc} art={<ArchiveBox state={{ lid: 0, binders: [0, 0, 0], qr: [0, 0, 0, 1] }} size={300} />}>
        <Chip n={1} label={offer.service.steps[0]} t={pop(frame, 3300)} />
        <Chip n={2} label={offer.service.steps[1]} t={pop(frame, 4640)} />
      </Card>
      <Card x={RIGHT} t={software} dim={0} title={offer.software.title} desc={offer.software.desc} art={<AppMini />}>
        <Chip n={1} label={offer.software.steps[0]} t={pop(frame, 10440)} />
      </Card>
    </Scene>
  );
};
