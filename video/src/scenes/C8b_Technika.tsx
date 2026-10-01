import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { StepLabel } from '../components/Frame16';
import { OfferIcon, OfferIconKind } from '../components/ArchivesIcons';
import { voAt } from '../components/Subtitles';
import { settle } from '../lib/anim';
import { BRAND, FONT, INK } from '../theme';

/**
 * C8b - Technicke riesenie (kolo 52, Samuel: slide z kratkej LinkedIn verzie aj do dlhej). Za ponukou (C8), pred zaverom.
 * Ako v kratkej (kola 9, 11, 13 a 24 tam): hore zeleny pas "Bezpecne" (V sulade s vasimi bezpecnostnymi poziadavkami),
 * pod nim v sivom ramci dve moznosti prevadzky, Online u nas alebo Na vasej infrastrukture; karta, o ktorej sa prave
 * hovori, ma zeleny okraj. Na 16:9 su moznosti vedla seba (sirka ramca 120 az 1800 px ako C8).
 * Hlas: veta krátkej verzie "Aplikacia funguje v sulade s vasimi bezpecnostnymi poziadavkami, online u nas alebo na vasej
 * infrastrukture." vyrezana z hotovej nahravky (vo.json `src`), casy slov z public/vo/lines/C8b-Technika-0.words.json.
 */
const LEFT = 120,
  W = 1680;
const W_SAFE = 1360, // "v sulade"
  W_ONLINE = 4000, // "online"
  W_YOURS = 5440; // "na vasej"
export const C8B_SECONDS = 8.6;
const OPT_W = 770; // dve moznosti vedla seba v sivom ramci, medzi nimi "alebo"

const Banner: React.FC<{ t: number; on: boolean }> = ({ t, on }) => (
  <div style={{ position: 'absolute', left: LEFT, top: 168, width: W, height: 196, boxSizing: 'border-box', borderRadius: 26, background: on ? BRAND[100] : BRAND[50], border: `2px solid ${on ? BRAND[500] : BRAND[200]}`, boxShadow: on ? `0 0 0 2px ${BRAND[500]}, 0 18px 44px rgba(31,122,51,0.16)` : 'none', display: 'flex', alignItems: 'center', gap: 36, padding: '0 48px', opacity: t, transform: `translateY(${(1 - t) * 24}px)` }}>
    <OfferIcon kind="shield" on size={124} />
    <div>
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 60, lineHeight: 1.05, letterSpacing: '-0.02em', color: BRAND[700] }}>Bezpečne</div>
      <div style={{ marginTop: 10, fontFamily: FONT.body, fontSize: 34, lineHeight: 1.2, color: INK[600], whiteSpace: 'nowrap' }}>V súlade s vašimi bezpečnostnými požiadavkami</div>
    </div>
  </div>
);

const Option: React.FC<{ x: number; icon: OfferIconKind; title: string; desc: string; t: number; on: boolean }> = ({ x, icon, title, desc, t, on }) => (
  <div style={{ position: 'absolute', left: x, top: 444, width: OPT_W, height: 268, boxSizing: 'border-box', borderRadius: 26, background: '#fff', border: `2px solid ${on ? BRAND[500] : INK[200]}`, boxShadow: on ? `0 0 0 2px ${BRAND[500]}, 0 18px 44px rgba(31,122,51,0.14)` : '0 12px 30px rgba(15,23,42,0.06)', opacity: t, transform: `translateY(${(1 - t) * 24}px)`, display: 'flex', alignItems: 'center', gap: 28, padding: '0 38px' }}>
    <OfferIcon kind={icon} on={on} size={110} />
    <div style={{ minWidth: 0 }}>
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 50, lineHeight: 1.05, letterSpacing: '-0.02em', color: on ? BRAND[700] : INK[900], whiteSpace: 'nowrap' }}>{title}</div>
      <div style={{ marginTop: 12, fontFamily: FONT.body, fontSize: 34, lineHeight: 1.2, color: INK[500], whiteSpace: 'nowrap' }}>{desc}</div>
    </div>
  </div>
);

export const C8b_Technika: React.FC = () => {
  const frame = useCurrentFrame();
  const ms = (frame / 30) * 1000;
  const L = voAt('C8b-Technika', 0);
  const safeAt = L + W_SAFE - 250,
    onlineAt = L + W_ONLINE - 250,
    yoursAt = L + W_YOURS - 250;
  const banner = settle(frame, 0);
  const opts = settle(frame, onlineAt);
  return (
    <Scene mode="light">
      <StepLabel frame={frame} steps={[{ from: 0, title: 'Technické riešenie' }]} />
      <div style={{ position: 'absolute', inset: 0 }}>
        <Banner t={banner} on={ms >= safeAt && ms < onlineAt} />
        <div style={{ position: 'absolute', left: LEFT, top: 414, width: W, height: 328, boxSizing: 'border-box', borderRadius: 30, background: INK[50], border: `1px solid ${INK[100]}`, opacity: opts }} />
        <Option x={LEFT + 30} icon="cloud" title="Online u nás" desc="Bez vlastných serverov" t={opts} on={ms >= onlineAt && ms < yoursAt} />
        <div style={{ position: 'absolute', left: 960 - 45, top: 444 + 134 - 25, width: 90, height: 50, borderRadius: 25, background: '#fff', border: `2px solid ${INK[200]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: 26, color: INK[500], opacity: opts }}>alebo</div>
        <Option x={LEFT + W - 30 - OPT_W} icon="server" title="Na vašej infraštruktúre" desc="Na vašich serveroch" t={opts} on={ms >= yoursAt} />
      </div>
    </Scene>
  );
};
