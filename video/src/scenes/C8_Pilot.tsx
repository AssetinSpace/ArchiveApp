import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { ArchiveBox } from '../components/ArchiveBox';
import { pop, settle, tween } from '../lib/anim';
import { offer } from '../copy/sk';
import { BRAND, FONT, INK } from '../theme';

/**
 * C8 - Ako zacat (kolo 42, predtym "Pilot"): dve ponuky vedla seba, kolo 43 pod nimi rozsah spracovania.
 * Vlavo hlavna "Sluzba na kluc" (zelena, archiv spracujeme za vas; obhliadka skladu a pilot na jednej krabici),
 * vpravo "Softver" (katalogizujete vlastnymi silami; licencia podla rozsahu). Kolo 43: obsah kariet zarovnany
 * vlavo na rovnakych vyskach (obrazok, nadpis, popis, kroky), pas "Rozsah: podla vas" s dvomi moznostami.
 * Nahovor: 400 "Archiv vam spracujeme na kluc. Zacneme obhliadkou skladu a pilotom na jednej krabici.",
 * 6700 "Alebo ho katalogizujete vlastnymi silami a licenciu zaobstarame podla rozsahu.",
 * 12100 "Rozsah je na vas: len identifikacne strany, alebo cele dokumenty s fulltextovym vyhladavanim."
 *
 * ms (casy slov): 400 karta sluzby · 3300 obhliadka · 4640 pilot · 6700 karta softveru (sluzba stlmena) ·
 * 9740 licencia · 12100 pas rozsahu (karty stlmene) · 13920 identifikacne strany · 15920 cele dokumenty ·
 * 18600 vsetko rovnako. 19,4 s.
 */
const CARD = { w: 700, h: 470, top: 140, gap: 40, pad: 48 };
const LEFT = 960 - CARD.gap / 2 - CARD.w;
const RIGHT = 960 + CARD.gap / 2;
const ART_H = 150;
const SCOPE = { top: 650, h: 150 };

const Chip: React.FC<{ n: number; label: string; t: number }> = ({ n, label, t }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, height: 40, opacity: Math.min(1, t * 1.4), transform: `translateY(${(1 - Math.min(1, t)) * 12}px)` }}>
    <div style={{ width: 40, height: 40, borderRadius: 20, background: BRAND[600], color: '#fff', fontFamily: FONT.display, fontWeight: 800, fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{n}</div>
    <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 28, color: INK[900], whiteSpace: 'nowrap' }}>{label}</div>
  </div>
);

/** Mala aplikacia: okno s vyhladavanim a riadkami zaznamov (rovnaka vyska ako krabica). */
const AppMini: React.FC = () => (
  <div style={{ width: 280, height: ART_H - 6, borderRadius: 14, background: '#fff', border: `2px solid ${INK[200]}`, boxShadow: '0 10px 26px rgba(15,23,42,0.08)', overflow: 'hidden' }}>
    <div style={{ height: 28, background: INK[50], borderBottom: `1px solid ${INK[200]}`, display: 'flex', alignItems: 'center', gap: 7, paddingLeft: 12 }}>
      {[INK[300], INK[300], BRAND[400]].map((c, i) => (
        <div key={i} style={{ width: 9, height: 9, borderRadius: 5, background: c }} />
      ))}
    </div>
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 11 }}>
      <div style={{ height: 26, borderRadius: 7, border: `2px solid ${BRAND[400]}`, display: 'flex', alignItems: 'center', paddingLeft: 9 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={BRAND[600]} strokeWidth={3} strokeLinecap="round">
          <circle cx={10.5} cy={10.5} r={6.5} />
          <path d="M15.5 15.5 L21 21" />
        </svg>
      </div>
      {[0.9, 0.65].map((w, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: INK[200] }} />
          <div style={{ height: 9, borderRadius: 5, background: INK[200], width: `${w * 100}%` }} />
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
      opacity: t * (1 - dim),
      transform: `translateY(${(1 - t) * 30}px)`,
      boxSizing: 'border-box',
    }}
  >
    {/* vsetko zarovnane vlavo na rovnakych vyskach v oboch kartach */}
    <div style={{ position: 'absolute', left: CARD.pad, top: 36, height: ART_H, display: 'flex', alignItems: 'center' }}>{art}</div>
    <div style={{ position: 'absolute', left: CARD.pad, top: 36 + ART_H + 22, fontFamily: FONT.display, fontWeight: 800, fontSize: 50, lineHeight: 1, color: main ? BRAND[700] : INK[900], letterSpacing: '-0.02em' }}>{title}</div>
    <div style={{ position: 'absolute', left: CARD.pad, top: 36 + ART_H + 86, fontFamily: FONT.body, fontWeight: 400, fontSize: 28, lineHeight: 1.2, color: INK[500] }}>{desc}</div>
    <div style={{ position: 'absolute', left: CARD.pad, top: 36 + ART_H + 146, display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
  </div>
);

const ScopeIcon: React.FC<{ full?: boolean }> = ({ full }) => (
  <svg width={64} height={64} viewBox="0 0 64 64" fill="none" strokeLinecap="round" strokeLinejoin="round">
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
  const scope = settle(frame, 12100);
  const restore = 1 - tw(18600, 500);
  const scopeFocus = tw(12200, 400) * restore; // pocas vety o rozsahu su karty stlmene
  const dimService = Math.max(0.45 * tw(6800, 400) * (1 - tw(12000, 300)), 0.35 * scopeFocus); // pocas vety o softveri je sluzba stlmena
  const dimSoftware = 0.35 * scopeFocus;
  return (
    <Scene mode="light" footer>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 78, textAlign: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: 24, letterSpacing: '0.16em', textTransform: 'uppercase', color: BRAND[600], opacity: kicker }}>{offer.kicker}</div>
      <Card x={LEFT} t={service} dim={dimService} main title={offer.service.title} desc={offer.service.desc} art={<div style={{ marginLeft: -22, marginTop: 6 }}><ArchiveBox state={{ lid: 0, binders: [0, 0, 0], qr: [0, 0, 0, 1] }} size={228} /></div>}>
        <Chip n={1} label={offer.service.steps[0]} t={pop(frame, 3300)} />
        <Chip n={2} label={offer.service.steps[1]} t={pop(frame, 4640)} />
      </Card>
      <Card x={RIGHT} t={software} dim={dimSoftware} title={offer.software.title} desc={offer.software.desc} art={<AppMini />}>
        <Chip n={1} label={offer.software.steps[0]} t={pop(frame, 9740)} />
      </Card>
      {/* kolo 43: rozsah spracovania pre obe ponuky */}
      <div style={{ position: 'absolute', left: LEFT, top: SCOPE.top, width: 2 * CARD.w + CARD.gap, height: SCOPE.h, borderRadius: 24, background: BRAND[50], border: `2px solid ${BRAND[200]}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', padding: `0 ${CARD.pad}px`, gap: 40, opacity: scope, transform: `translateY(${(1 - scope) * 24}px)` }}>
        <div style={{ width: 250, flex: 'none' }}>
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 22, letterSpacing: '0.14em', textTransform: 'uppercase', color: BRAND[600] }}>{offer.scope.kicker}</div>
          <div style={{ marginTop: 6, fontFamily: FONT.display, fontWeight: 800, fontSize: 44, lineHeight: 1, color: INK[900], letterSpacing: '-0.02em' }}>{offer.scope.title}</div>
        </div>
        {offer.scope.options.map((o, i) => {
          const t = pop(frame, i === 0 ? 13920 : 15920);
          return (
            <React.Fragment key={o.title}>
              {i > 0 ? <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 26, color: INK[400], opacity: Math.min(1, t * 1.4) }}>alebo</div> : null}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: Math.min(1, t * 1.4), transform: `translateY(${(1 - Math.min(1, t)) * 12}px)` }}>
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
