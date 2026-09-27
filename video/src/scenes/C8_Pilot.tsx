import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { pop, settle, tween } from '../lib/anim';
import { offer } from '../copy/sk';
import { BRAND, FONT, INK } from '../theme';

/**
 * C8 - Ako zacat: dve ponuky vedla seba a pod nimi rozsah, ktory plati pre obe.
 * Kolo 44 (Samuel: karty rozhadzane, rozsah treba stanovit aj pri sluzbe): obe karty maju rovnaku stavbu
 * na stred (ikona v kruhu, nazov, popis, jeden krok ako stitok) na rovnakych vyskach; z oboch kariet ide
 * ciara do pasu "V oboch pripadoch - Rozsah podla vas" s dvomi moznostami.
 * Nahovor: 400 "Archiv vam spracujeme na kluc. Zacneme obhliadkou skladu a pilotom na jednej krabici.",
 * 6700 "Alebo ho katalogizujete vlastnymi silami a licenciu zaobstarame podla rozsahu.",
 * 12100 "V oboch pripadoch urcite rozsah: len identifikacne strany, alebo cele dokumenty s fulltextovym vyhladavanim."
 *
 * ms (casy slov): 400 karta sluzby · 3300 krok sluzby · 6700 karta softveru (sluzba stlmena) · 9740 krok softveru ·
 * 12100 ciary a pas rozsahu (karty stlmene) · 14600 identifikacne strany · 16640 cele dokumenty · 19100 vsetko rovnako. 19,9 s.
 */
const CARD = { w: 680, h: 420, top: 130, gap: 60 };
const LEFT = 960 - CARD.gap / 2 - CARD.w;
const RIGHT = 960 + CARD.gap / 2;
const BAND = { top: 640, h: 150, left: LEFT, w: 2 * CARD.w + CARD.gap };

/** Ikony v rovnakom stylovom jazyku (obrys, zelena). */
const Icon: React.FC<{ kind: 'box' | 'app' }> = ({ kind }) => (
  <div style={{ width: 112, height: 112, borderRadius: 56, background: BRAND[50], border: `2px solid ${BRAND[200]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width={60} height={60} viewBox="0 0 48 48" fill="none" stroke={BRAND[600]} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      {kind === 'box' ? (
        <>
          <rect x={6} y={10} width={36} height={9} rx={2} />
          <path d="M9 19 V38 a2 2 0 0 0 2 2 H37 a2 2 0 0 0 2 -2 V19" />
          <path d="M19 27 H29" />
        </>
      ) : (
        <>
          <rect x={6} y={9} width={36} height={24} rx={3} />
          <path d="M3 39 H45" />
          <circle cx={22} cy={20} r={5} />
          <path d="M26 24 L30 28" />
        </>
      )}
    </svg>
  </div>
);

const Card: React.FC<{ x: number; t: number; dim: number; main?: boolean; kind: 'box' | 'app'; title: string; desc: string; step: string; stepT: number }> = ({ x, t, dim, main, kind, title, desc, step, stepT }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: CARD.top,
      width: CARD.w,
      height: CARD.h,
      borderRadius: 24,
      background: '#fff',
      border: `2px solid ${main ? BRAND[500] : INK[200]}`, // rovnaka hrubka ramika = obsah na rovnakych vyskach; hrubsi zeleny okraj sluzby je tien
      boxShadow: main ? `0 0 0 2px ${BRAND[500]}, 0 18px 44px rgba(31,122,51,0.16)` : '0 12px 32px rgba(15,23,42,0.06)',
      opacity: t * (1 - dim),
      transform: `translateY(${(1 - t) * 30}px)`,
      boxSizing: 'border-box',
    }}
  >
    {/* rovnaka stavba a vysky v oboch kartach, vsetko na stred */}
    <div style={{ position: 'absolute', left: 0, right: 0, top: 40, display: 'flex', justifyContent: 'center' }}>
      <Icon kind={kind} />
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 178, textAlign: 'center', fontFamily: FONT.display, fontWeight: 800, fontSize: 52, lineHeight: 1, color: main ? BRAND[700] : INK[900], letterSpacing: '-0.02em' }}>{title}</div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 246, textAlign: 'center', fontFamily: FONT.body, fontSize: 30, lineHeight: 1.2, color: INK[500] }}>{desc}</div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 318, display: 'flex', justifyContent: 'center', opacity: Math.min(1, stepT * 1.4), transform: `translateY(${(1 - Math.min(1, stepT)) * 12}px)` }}>
      <div style={{ height: 56, padding: '0 26px', borderRadius: 28, background: BRAND[50], border: `2px solid ${BRAND[200]}`, display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT.display, fontWeight: 700, fontSize: 28, color: INK[900], whiteSpace: 'nowrap' }}>
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={BRAND[600]} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5 L10 17 L19 7" />
        </svg>
        {step}
      </div>
    </div>
  </div>
);

const ScopeIcon: React.FC<{ full?: boolean }> = ({ full }) => (
  <svg width={60} height={60} viewBox="0 0 64 64" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {full ? (
      <>
        <rect x={16} y={6} width={34} height={44} rx={4} fill={INK[50]} stroke={INK[300]} strokeWidth={2} />
        <rect x={10} y={12} width={34} height={44} rx={4} fill="#fff" stroke={INK[400]} strokeWidth={2} />
        {[22, 29, 36].map((y) => (
          <path key={y} d={`M17 ${y} H37`} stroke={INK[300]} strokeWidth={3} />
        ))}
        <circle cx={44} cy={44} r={9} fill="#fff" stroke={BRAND[600]} strokeWidth={3.5} />
        <path d="M51 51 L58 58" stroke={BRAND[600]} strokeWidth={4} />
      </>
    ) : (
      <>
        <rect x={14} y={8} width={36} height={48} rx={4} fill="#fff" stroke={INK[400]} strokeWidth={2} />
        <rect x={20} y={15} width={24} height={9} rx={2} fill={BRAND[600]} />
        {[31, 38].map((y) => (
          <path key={y} d={`M20 ${y} H40`} stroke={INK[300]} strokeWidth={3} />
        ))}
        <rect x={33} y={42} width={11} height={9} rx={1.5} fill={INK[700]} />
      </>
    )}
  </svg>
);

export const C8_Pilot: React.FC = () => {
  const frame = useCurrentFrame();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const kicker = settle(frame, 200);
  const service = settle(frame, 400);
  const software = settle(frame, 6700);
  const scope = settle(frame, 12300);
  const lines = tw(12100, 500); // ciary z oboch kariet do pasu rozsahu
  const restore = 1 - tw(19100, 500);
  const scopeFocus = tw(12200, 400) * restore; // pocas vety o rozsahu su karty stlmene
  const dimService = Math.max(0.45 * tw(6800, 400) * (1 - tw(12000, 300)), 0.3 * scopeFocus); // pocas vety o softveri je sluzba stlmena
  const dimSoftware = 0.3 * scopeFocus;
  const cardBottom = CARD.top + CARD.h;
  return (
    <Scene mode="light" footer>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: 24, letterSpacing: '0.16em', textTransform: 'uppercase', color: BRAND[600], opacity: kicker }}>{offer.kicker}</div>
      <Card x={LEFT} t={service} dim={dimService} main kind="box" title={offer.service.title} desc={offer.service.desc} step={offer.service.step} stepT={pop(frame, 3300)} />
      <Card x={RIGHT} t={software} dim={dimSoftware} kind="app" title={offer.software.title} desc={offer.software.desc} step={offer.software.step} stepT={pop(frame, 9740)} />
      {/* rozsah plati pre obe ponuky: ciara zo stredu kazdej karty do pasu */}
      {[LEFT, RIGHT].map((x) => (
        <div key={x} style={{ position: 'absolute', left: x + CARD.w / 2 - 2, top: cardBottom, width: 4, height: (BAND.top - cardBottom) * lines, borderRadius: 2, background: BRAND[300] }} />
      ))}
      <div style={{ position: 'absolute', left: BAND.left, top: BAND.top, width: BAND.w, height: BAND.h, borderRadius: 24, background: BRAND[50], border: `2px solid ${BRAND[200]}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 56px', opacity: scope, transform: `translateY(${(1 - scope) * 20}px)` }}>
        <div style={{ flex: 'none' }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 22, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND[600] }}>{offer.scope.kicker}</div>
          <div style={{ marginTop: 6, fontFamily: FONT.display, fontWeight: 800, fontSize: 42, lineHeight: 1, color: INK[900], letterSpacing: '-0.02em' }}>{offer.scope.title}</div>
        </div>
        {offer.scope.options.map((o, i) => {
          const t = pop(frame, i === 0 ? 14600 : 16640);
          return (
            <React.Fragment key={o.title}>
              {i > 0 ? <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 26, color: INK[400], opacity: Math.min(1, t * 1.4) }}>alebo</div> : null}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: Math.min(1, t * 1.4), transform: `translateY(${(1 - Math.min(1, t)) * 12}px)` }}>
                <ScopeIcon full={i === 1} />
                <div>
                  <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 30, color: INK[900], whiteSpace: 'nowrap' }}>{o.title}</div>
                  <div style={{ marginTop: 4, fontFamily: FONT.body, fontSize: 22, color: INK[500], whiteSpace: 'nowrap' }}>{o.desc}</div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </Scene>
  );
};
