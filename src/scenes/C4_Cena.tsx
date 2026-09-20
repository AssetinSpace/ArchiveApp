import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { Camera } from '../lib/camera';
import { Carton, ShelfFrame, iso } from '../lib/iso';
import { PriceTag, QuestionMark, Sheet } from '../components/Illustrations';
import { drawProps, pop, settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { BRAND, CM, FONT, NAVY, SAFE } from '../theme';
import { CAM_END, SV, TARGET_SHELF, VB } from './C3_Sklad';

/**
 * C4 - Cena. Zacina rovnakym zaberom ako koniec C3. Regal sa odsunie
 * dolava; nad nim vyskoci vela otaznikov; uprostred tikaju hodiny (hladanie
 * trva); sipka doprava -> vykres "nove vyhotovenie" (rychlejsie spravit
 * nanovo); cenovky; "2x". 9 s.
 *
 * ms: 800 odsun · 1400+i*220 "?" · 2600 hodiny · 2600-4200 rucicka ·
 * 3400 sipka · 3600 vykres · 4200 cenovka B · 4600 cenovka A · 5400 "2x" ·
 * 5800 caption.
 */
export const C4_Cena: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const qms = [0, 1, 2, 3, 4].map((i) => pop(frame, 1400 + i * 220));
  const clock = settle(frame, 2600);
  const hand = tw(2600, 1600) * 720;
  const arrow = tw(3400, 500);
  const sheet = settle(frame, 3600);
  const tagB = pop(frame, 4200);
  const tagA = pop(frame, 4600);
  const big = pop(frame, 5400, { damping: 12 });
  const s = TARGET_SHELF;
  const qPos: [number, number, number][] = [
    [s.x + 20, s.y + 20, 2 * CM.shelf.level + 14],
    [s.x + 60, s.y + 10, 2 * CM.shelf.level + 36],
    [s.x + 100, s.y + 26, 2 * CM.shelf.level + 18],
    [s.x + 40, s.y + 40, 2 * CM.shelf.level + 50],
    [s.x + 85, s.y + 45, 2 * CM.shelf.level + 40],
  ];
  return (
    <Scene mode="dark">
      <Camera keys={[{ ms: 0, ...CAM_END }, { ms: 1700, x: CAM_END.x + 380 / CAM_END.scale, y: CAM_END.y - 20 / CAM_END.scale, scale: 1.7 }]}>
        <svg width={1920} height={1080} viewBox={`${VB.x} ${VB.y} ${1920 / SV} ${1080 / SV}`} style={{ position: 'absolute', left: 0, top: 0 }}>
          <ShelfFrame x={s.x} y={s.y} w={CM.shelf.w} d={CM.shelf.d} levels={2} levelH={CM.shelf.level} />
          {[0, 1].map((lvl) => [0, 1].map((k) => <Carton key={`${lvl}${k}`} x={s.x + 8 + k * 60} y={s.y + 12} z={lvl * CM.shelf.level + 5} />))}
          {(() => {
            const [qx, qy] = iso(s.x + 65, s.y + 30, 2 * CM.shelf.level + 14);
            return <QuestionMark x={qx} y={qy} s={0.4 * (1 - tw(800, 500))} />;
          })()}
          {qPos.map(([x, y, z], i) => {
            const [qx, qy] = iso(x, y, z);
            return <QuestionMark key={i} x={qx} y={qy} s={qms[i] * 0.45} />;
          })}
        </svg>
      </Camera>

      {/* hodiny uprostred */}
      <svg width={220} height={220} viewBox="-110 -110 220 220" style={{ position: 'absolute', left: 850, top: 330, opacity: clock, transform: `scale(${0.6 + 0.4 * clock})` }}>
        <circle r={86} fill="none" stroke={NAVY[200]} strokeWidth={8} />
        {[0, 90, 180, 270].map((a) => (
          <line key={a} x1={0} y1={-86} x2={0} y2={-70} stroke={NAVY[200]} strokeWidth={8} strokeLinecap="round" transform={`rotate(${a})`} />
        ))}
        <line x1={0} y1={0} x2={0} y2={-58} stroke="#fff" strokeWidth={9} strokeLinecap="round" transform={`rotate(${hand})`} />
        <line x1={0} y1={0} x2={0} y2={-40} stroke="#fff" strokeWidth={9} strokeLinecap="round" transform={`rotate(${hand / 12 + 60})`} />
        <circle r={7} fill="#fff" />
      </svg>
      {/* sipka hodiny -> vykres */}
      <svg width={260} height={80} viewBox="0 0 260 80" style={{ position: 'absolute', left: 1000, top: 400, opacity: arrow > 0 ? 1 : 0 }}>
        <path d="M10 40 H230" fill="none" stroke={BRAND[400]} strokeWidth={8} strokeLinecap="round" {...drawProps(arrow, 220)} />
        <path d="M200 12 L236 40 L200 68" fill="none" stroke={BRAND[400]} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={arrow > 0.85 ? 1 : 0} />
      </svg>

      <div style={{ position: 'absolute', left: 330, top: 760 }}>
        <PriceTag text="skladovanie" s={tagA} color={BRAND[700]} />
      </div>
      <div style={{ position: 'absolute', left: 1290, top: 250, opacity: sheet, transform: `translateY(${(1 - sheet) * 30}px) rotate(-4deg)` }}>
        <Sheet w={280} h={390} lines={7} stamp />
      </div>
      <div style={{ position: 'absolute', left: 1290, top: 700 }}>
        <PriceTag text="nové vyhotovenie" s={tagB} color={BRAND[700]} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 20, textAlign: 'center', opacity: big, transform: `scale(${0.6 + 0.4 * big})`, paddingLeft: 120 }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 170, lineHeight: 0.9, color: BRAND[400], letterSpacing: '-0.04em' }}>2×</span>
      </div>
      {showCap ? <Caption text={captions.C4} mode="dark" t={settle(frame, 5800)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
