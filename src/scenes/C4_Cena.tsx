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
  const qms = [0, 1, 2, 3, 4, 5].map((i) => pop(frame, 1400 + i * 180));
  const clock = settle(frame, 2600);
  const hand = tw(2600, 1600) * 720;
  const arrow = tw(3400, 500);
  const sheet = settle(frame, 3600);
  const tagB = pop(frame, 4200);
  const tagA = pop(frame, 4600);
  const big = pop(frame, 5400, { damping: 12 });
  const s = TARGET_SHELF;
  // otazniky presne nad stlpcami krabic (2 stlpce x 3), tesne nad vrchnou doskou
  const top = 2 * CM.shelf.level + 4;
  const qPos: [number, number, number][] = [0, 1].flatMap((k) => {
    const cx = s.x + 34 + k * 60,
      cy = s.y + 30;
    return [
      [cx, cy, top + 14],
      [cx - 12, cy + 4, top + 34],
      [cx + 10, cy - 6, top + 52],
    ] as [number, number, number][];
  });
  return (
    <Scene mode="dark">
      <Camera keys={[{ ms: 0, ...CAM_END }, { ms: 1700, x: CAM_END.x + 400 / CAM_END.scale, y: CAM_END.y + 70 / CAM_END.scale, scale: 1.5 }]}>
        <svg width={1920} height={1080} viewBox={`${VB.x} ${VB.y} ${1920 / SV} ${1080 / SV}`} style={{ position: 'absolute', left: 0, top: 0 }}>
          <ShelfFrame x={s.x} y={s.y} w={CM.shelf.w} d={CM.shelf.d} levels={2} levelH={CM.shelf.level} topBoard={false}>
            {(lvl) => [0, 1].map((k) => <Carton key={`${lvl}${k}`} x={s.x + 8 + k * 60} y={s.y + 12} z={lvl * CM.shelf.level + 4} />)}
          </ShelfFrame>
          {(() => {
            const [qx, qy] = iso(s.x + 65, s.y + 30, 2 * CM.shelf.level + 14);
            return <QuestionMark x={qx} y={qy} s={0.4 * (1 - tw(800, 500))} />;
          })()}
          {qPos.map(([x, y, z], i) => {
            const [qx, qy] = iso(x, y, z);
            return <QuestionMark key={i} x={qx} y={qy} s={qms[i] * 0.36} />;
          })}
        </svg>
      </Camera>

      {/* hodiny v strede medzery medzi regalom a vykresom */}
      <svg width={240} height={240} viewBox="-120 -120 240 240" style={{ position: 'absolute', left: 950, top: 380, opacity: clock, transform: `scale(${0.6 + 0.4 * clock})` }}>
        <circle r={100} fill="#1B2A44" stroke="#fff" strokeWidth={10} />
        {[0, 90, 180, 270].map((a) => (
          <line key={a} x1={0} y1={-84} x2={0} y2={-68} stroke={BRAND[400]} strokeWidth={8} strokeLinecap="round" transform={`rotate(${a})`} />
        ))}
        <line x1={0} y1={0} x2={0} y2={-62} stroke="#fff" strokeWidth={9} strokeLinecap="round" transform={`rotate(${hand})`} />
        <line x1={0} y1={0} x2={0} y2={-42} stroke="#fff" strokeWidth={9} strokeLinecap="round" transform={`rotate(${hand / 12 + 60})`} />
        <circle r={8} fill={BRAND[400]} />
      </svg>
      {/* sipka hodiny -> vykres */}
      <svg width={180} height={80} viewBox="0 0 180 80" style={{ position: 'absolute', left: 1195, top: 460, opacity: arrow > 0 ? 1 : 0 }}>
        <path d="M10 40 H150" fill="none" stroke={BRAND[400]} strokeWidth={8} strokeLinecap="round" {...drawProps(arrow, 140)} />
        <path d="M122 12 L156 40 L122 68" fill="none" stroke={BRAND[400]} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={arrow > 0.85 ? 1 : 0} />
      </svg>

      <div style={{ position: 'absolute', left: 330, top: 760 }}>
        <PriceTag text="skladovanie" s={tagA} color={BRAND[700]} />
      </div>
      <div style={{ position: 'absolute', left: 1390, top: 300, opacity: sheet, transform: `translateY(${(1 - sheet) * 30}px) rotate(-4deg)` }}>
        <Sheet w={280} h={390} lines={7} stamp />
      </div>
      <div style={{ position: 'absolute', left: 1390, top: 740 }}>
        <PriceTag text="nové vyhotovenie" s={tagB} color={BRAND[700]} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 20, textAlign: 'center', opacity: big, transform: `scale(${0.6 + 0.4 * big})`, paddingLeft: 220 }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 170, lineHeight: 0.9, color: BRAND[400], letterSpacing: '-0.04em' }}>2×</span>
      </div>
      {showCap ? <Caption text={captions.C4} mode="dark" t={settle(frame, 5800)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
