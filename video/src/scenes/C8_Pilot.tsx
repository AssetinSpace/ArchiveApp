import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { pop, settle, tween } from '../lib/anim';
import { offer } from '../copy/sk';
import { BRAND, FONT, INK } from '../theme';

/**
 * C8 - Ako zacat: dva riadky s rovnakymi kartami v tych istych stlpcoch.
 * Hore "Ako zacat": Sluzba na kluc (hlavna, zelena) a Softver. Dole "Rozsah nasadenia (v oboch pripadoch)":
 * Identifikacne strany a Cele dokumenty (skenovanie, fulltext).
 * Kolo 45 (Samuel, screenshot): namiesto pasu s ciarami druhy riadok kariet; karta = ikona v kruhu vlavo,
 * vpravo nazov, popis a jeden stitok, vsetko na rovnakych vyskach.
 * Nahovor: 400 "Archiv vam spracujeme na kluc. Zacneme obhliadkou skladu a pilotom na jednej krabici.",
 * 6700 "Alebo ho katalogizujete vlastnymi silami a licenciu zaobstarame podla rozsahu.",
 * 12100 "V oboch pripadoch urcite rozsah nasadenia: len identifikacne strany, alebo skenovanie celych dokumentov s fulltextovym vyhladavanim."
 *
 * ms (casy slov): 400 sluzba · 3300 jej stitok · 6700 softver (sluzba stlmena) · 9740 jeho stitok · 12100 riadok rozsahu
 * (horny riadok stlmeny) · 15040 identifikacne strany · 17080 cele dokumenty · 20200 vsetko rovnako. 21 s.
 */
const COL = { w: 680, gap: 60 };
const LEFT = 960 - COL.gap / 2 - COL.w;
const RIGHT = 960 + COL.gap / 2;
const CARD_H = 236;
const ROW1 = { kicker: 112, top: 156 };
const ROW2 = { kicker: 448, top: 492 };

type IconKind = 'box' | 'app' | 'id' | 'scan';

/** Ikony v rovnakom stylovom jazyku (obrys, zelena) v kruhu. */
const Icon: React.FC<{ kind: IconKind }> = ({ kind }) => (
  <div style={{ width: 108, height: 108, borderRadius: 54, background: BRAND[50], border: `2px solid ${BRAND[200]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
    <svg width={58} height={58} viewBox="0 0 48 48" fill="none" stroke={BRAND[600]} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      {kind === 'box' ? (
        <>
          <rect x={6} y={10} width={36} height={9} rx={2} />
          <path d="M9 19 V38 a2 2 0 0 0 2 2 H37 a2 2 0 0 0 2 -2 V19" />
          <path d="M19 27 H29" />
        </>
      ) : kind === 'app' ? (
        <>
          <rect x={6} y={9} width={36} height={24} rx={3} />
          <path d="M3 39 H45" />
          <circle cx={22} cy={20} r={5} />
          <path d="M26 24 L30 28" />
        </>
      ) : kind === 'id' ? (
        <>
          <rect x={11} y={5} width={26} height={38} rx={3} />
          <rect x={16} y={11} width={16} height={6} rx={1} />
          <path d="M16 24 H32 M16 30 H27" />
          <rect x={25} y={33} width={7} height={5} rx={1} />
        </>
      ) : (
        <>
          <rect x={15} y={4} width={24} height={32} rx={3} />
          <rect x={9} y={10} width={24} height={32} rx={3} />
          <path d="M14 19 H28 M14 25 H28 M14 31 H23" />
          <circle cx={34} cy={35} r={6} />
          <path d="M38.5 39.5 L43 44" />
        </>
      )}
    </svg>
  </div>
);

const Card: React.FC<{ x: number; y: number; t: number; dim: number; main?: boolean; icon: IconKind; title: string; desc: string; step: string; stepT: number }> = ({ x, y, t, dim, main, icon, title, desc, step, stepT }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: COL.w,
      height: CARD_H,
      borderRadius: 24,
      background: '#fff',
      border: `2px solid ${main ? BRAND[500] : INK[200]}`, // rovnaka hrubka ramika = obsah na rovnakych vyskach; hrubsi zeleny okraj sluzby je tien
      boxShadow: main ? `0 0 0 2px ${BRAND[500]}, 0 18px 44px rgba(31,122,51,0.16)` : '0 12px 32px rgba(15,23,42,0.06)',
      opacity: t * (1 - dim),
      transform: `translateY(${(1 - t) * 30}px)`,
      boxSizing: 'border-box',
    }}
  >
    <div style={{ position: 'absolute', left: 44, top: (CARD_H - 4 - 108) / 2 }}>
      <Icon kind={icon} />
    </div>
    <div style={{ position: 'absolute', left: 44 + 108 + 36, top: 38, fontFamily: FONT.display, fontWeight: 800, fontSize: 46, lineHeight: 1, color: main ? BRAND[700] : INK[900], letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{title}</div>
    <div style={{ position: 'absolute', left: 44 + 108 + 36, top: 96, fontFamily: FONT.body, fontSize: 27, lineHeight: 1.2, color: INK[500], whiteSpace: 'nowrap' }}>{desc}</div>
    <div style={{ position: 'absolute', left: 44 + 108 + 36, top: 150, opacity: Math.min(1, stepT * 1.4), transform: `translateY(${(1 - Math.min(1, stepT)) * 10}px)` }}>
      <div style={{ height: 50, padding: '0 22px', borderRadius: 25, background: BRAND[50], border: `2px solid ${BRAND[200]}`, display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT.display, fontWeight: 700, fontSize: 25, color: INK[900], whiteSpace: 'nowrap' }}>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={BRAND[600]} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5 L10 17 L19 7" />
        </svg>
        {step}
      </div>
    </div>
  </div>
);

const Kicker: React.FC<{ y: number; t: number; text: string; note?: string }> = ({ y, t, text, note }) => (
  <div style={{ position: 'absolute', left: LEFT, width: 2 * COL.w + COL.gap, top: y, display: 'flex', alignItems: 'center', gap: 18, opacity: t }}>
    <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 24, letterSpacing: '0.16em', textTransform: 'uppercase', color: BRAND[600], whiteSpace: 'nowrap' }}>{text}</div>
    {note ? <div style={{ fontFamily: FONT.body, fontSize: 24, color: INK[400], whiteSpace: 'nowrap' }}>{note}</div> : null}
    <div style={{ flex: 1, height: 2, background: INK[200] }} />
  </div>
);

export const C8_Pilot: React.FC = () => {
  const frame = useCurrentFrame();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const k1 = settle(frame, 200);
  const service = settle(frame, 400);
  const software = settle(frame, 6700);
  const k2 = settle(frame, 12100);
  const restore = 1 - tw(20200, 500);
  const scopeFocus = tw(12200, 400) * restore; // pocas vety o rozsahu je horny riadok stlmeny
  const dimService = Math.max(0.45 * tw(6800, 400) * (1 - tw(12000, 300)), 0.35 * scopeFocus); // pocas vety o softveri je sluzba stlmena
  const dimSoftware = 0.35 * scopeFocus;
  const [o1, o2] = offer.scope.options;
  return (
    <Scene mode="light" footer>
      <Kicker y={ROW1.kicker} t={k1} text={offer.kicker} />
      <Card x={LEFT} y={ROW1.top} t={service} dim={dimService} main icon="box" title={offer.service.title} desc={offer.service.desc} step={offer.service.step} stepT={pop(frame, 3300)} />
      <Card x={RIGHT} y={ROW1.top} t={software} dim={dimSoftware} icon="app" title={offer.software.title} desc={offer.software.desc} step={offer.software.step} stepT={pop(frame, 9740)} />
      <Kicker y={ROW2.kicker} t={k2} text={offer.scope.kicker} note={offer.scope.note} />
      <Card x={LEFT} y={ROW2.top} t={settle(frame, 14900)} dim={0} icon="id" title={o1.title} desc={o1.desc} step={o1.step} stepT={pop(frame, 15500)} />
      <Card x={RIGHT} y={ROW2.top} t={settle(frame, 16950)} dim={0} icon="scan" title={o2.title} desc={o2.desc} step={o2.step} stepT={pop(frame, 18200)} />
    </Scene>
  );
};
