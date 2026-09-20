import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { Camera } from '../lib/camera';
import { Carton, ShelfFrame, iso } from '../lib/iso';
import { PriceTag, Sheet } from '../components/Illustrations';
import { QuestionMark } from '../components/Illustrations';
import { pop, settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { BRAND, CM, FONT, NAVY, SAFE } from '../theme';
import { CAM_END, SHELF_LEVEL, SV, TARGET_SHELF, VB } from './C3_Sklad';

/**
 * C4 - Cena. Zacina rovnakym zaberom ako koniec C3 (polica s dvoma
 * zatvorenymi krabicami, "?"). Regal sa odsunie dolava a dostane cenovku
 * "skladovanie"; vpravo sa objavi vykres s peciatkou (nove vyhotovenie)
 * s cenovkou; az potom doskoci "2x". 8 s.
 */
export const C4_Cena: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const shift = tw(800, 900); // regal dolava
  const tagA = pop(frame, 1900);
  const sheet = settle(frame, 2800);
  const tagB = pop(frame, 3600);
  const big = pop(frame, 4600, { damping: 12 });
  const s = TARGET_SHELF;
  return (
    <Scene mode="dark">
      <Camera keys={[{ ms: 0, ...CAM_END }, { ms: 1700, x: CAM_END.x + 380 / CAM_END.scale, y: CAM_END.y - 30 / CAM_END.scale, scale: 1.95 }]}>
        <svg width={1920} height={1080} viewBox={`${VB.x} ${VB.y} ${1920 / SV} ${1080 / SV}`} style={{ position: 'absolute', left: 0, top: 0 }}>
          <ShelfFrame x={s.x} y={s.y} w={CM.shelf.w} d={CM.shelf.d} levels={2} levelH={CM.shelf.level} />
          {[0, 1].map((lvl) => [0, 1].map((k) => <Carton key={`${lvl}${k}`} x={s.x + 8 + k * 60} y={s.y + 12} z={lvl * CM.shelf.level + 5} />))}
          {(() => {
            const [qx, qy] = iso(s.x + 65, s.y + 30, 2 * CM.shelf.level + 40);
            return <QuestionMark x={qx} y={qy} s={0.5 * (1 - tw(800, 500))} />;
          })()}
        </svg>
      </Camera>
      {/* cenovka nad regalom (screen-space, po odsune) */}
      <div style={{ position: 'absolute', left: 330, top: 760 }}>
        <PriceTag text="skladovanie" s={tagA} color={BRAND[700]} />
      </div>
      {/* vykres vpravo */}
      <div style={{ position: 'absolute', left: 1190, top: 280, opacity: sheet, transform: `translateY(${(1 - sheet) * 30}px) rotate(-4deg)` }}>
        <Sheet w={280} h={390} lines={7} stamp />
      </div>
      <div style={{ position: 'absolute', left: 1180, top: 760 }}>
        <PriceTag text="nové vyhotovenie" s={tagB} color={BRAND[700]} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center', fontFamily: FONT.display, fontWeight: 800, fontSize: 90, color: NAVY[300], opacity: sheet, paddingLeft: 120 }}>+</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 20, textAlign: 'center', opacity: big, transform: `scale(${0.6 + 0.4 * big})`, paddingLeft: 120 }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 170, lineHeight: 0.9, color: BRAND[400], letterSpacing: '-0.04em' }}>2×</span>
      </div>
      {showCap ? <Caption text={captions.C4} mode="dark" t={settle(frame, 5200)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
