import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { Camera } from '../lib/camera';
import { Binder, Cabinet, Chair, Desk, IsoBox, Roll, iso } from '../lib/iso';
import { Floor, QuestionMark } from '../components/Illustrations';
import { pop, settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { CM, SAFE } from '../theme';

/**
 * C2 - Kancelaria: stol, stolicka, monitor, vysoka skrina. Dvere sa otvoria,
 * vnutri natlacene zlozky v roznych sklonoch, rolky pare, volne listy;
 * dve zlozky a rolka sa vysypu na zem, "?" vyskocia. Kamera 1 -> 1.25. 7 s.
 * Mierka 2.4 px/cm (viewBox 800 x 450 cm na 1920 x 1080).
 */
const PX = 2.4;
const CAB = { x: 280, y: 40 };
const LEVEL = (CM.cabinet.h - 3) / 3; // ~66 cm, 3 police

export const C2_Kancelaria: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const appear = settle(frame, 300);
  const open = tw(1400, 700);
  const fall = [pop(frame, 2300, { damping: 10 }), pop(frame, 2600, { damping: 10 }), pop(frame, 2900, { damping: 10 })];
  const qm = [pop(frame, 3300), pop(frame, 3800), pop(frame, 4300)];

  // obsah polic: stojace zlozky (rozne vysunute), leziace zlozky navrch, rolky, listy
  const Lying: React.FC<{ x: number; y: number; z: number }> = ({ x, y, z }) => (
    <IsoBox x={x} y={y} z={z} w={CM.binder.w} d={CM.binder.h} h={CM.binder.d} faces={{ top: '#e5e7eb', left: '#e5e7eb', right: '#9ca3af' }} stroke />
  );
  const shelfBinders = (level: number, xs: number[], pull: number[]) =>
    xs.map((bx, i) => <Binder key={`${level}${i}`} x={CAB.x + 3 + bx} y={CAB.y + 6 + pull[i]} z={level * LEVEL + 3} d={30} />);

  const cabinetCenter = iso(CAB.x + 50, CAB.y + 22, 100);
  const camX = (cabinetCenter[0] + 400) * PX - 960; // 400 = posun viewBoxu
  const camY = (cabinetCenter[1] + 60) * PX - 540;

  return (
    <Scene mode="dark">
      <Camera keys={[{ ms: 1200, x: 0, y: 0, scale: 1 }, { ms: 5200, x: camX * 0.5, y: camY * 0.25, scale: 1.12 }]}>
        <svg width={1920} height={1080} viewBox="-400 -60 800 450" style={{ position: 'absolute', left: 0, top: 0, opacity: appear, transform: `translateY(${(1 - appear) * 30}px)` }}>
          <Floor x={-40} y={-40} w={520} d={420} fill="#263246" edge="#131F31" />
          <Desk x={60} y={150} />
          <Chair x={130} y={250} />
          {/* par zloziek a listov na stole */}
          <IsoBox x={80} y={160} z={75} w={32} d={44} h={8} faces={{ top: '#e5e7eb', left: '#e5e7eb', right: '#9ca3af' }} stroke />
          <IsoBox x={120} y={158} z={75} w={21} d={30} h={6} faces={{ top: '#fff', left: '#e5e7eb', right: '#d1d5db' }} stroke />
          <IsoBox x={170} y={170} z={75} w={21} d={30} h={1} faces={{ top: '#fff', left: '#e5e7eb', right: '#d1d5db' }} />
          <IsoBox x={178} y={180} z={76} w={21} d={30} h={1} faces={{ top: '#fff', left: '#e5e7eb', right: '#d1d5db' }} />

          <Cabinet x={CAB.x} y={CAB.y} open={open}>
            {/* spodna polica: 4 stojace sanony, jeden vysunuty, navrch leziaci */}
            {shelfBinders(0, [4, 38, 62], [0, 10, 2])}
            <Lying x={CAB.x + 6} y={CAB.y + 6} z={0 * LEVEL + 3 + CM.binder.h} />
            {/* stredna polica: 2 stojace + kopa listov + leziaci sanon sikmo vysunuty */}
            {shelfBinders(1, [4, 60], [8, 0])}
            <IsoBox x={CAB.x + 40} y={CAB.y + 8} z={1 * LEVEL + 3} w={21} d={30} h={9} faces={{ top: '#fff', left: '#e5e7eb', right: '#d1d5db' }} stroke />
            <Lying x={CAB.x + 36} y={CAB.y + 14} z={1 * LEVEL + 12} />
            {/* horna polica: rolky pare a listy */}
            <Roll x={CAB.x + 6} y={CAB.y + 8} z={2 * LEVEL + 3} len={88} />
            <Roll x={CAB.x + 6} y={CAB.y + 20} z={2 * LEVEL + 3} len={82} />
            <Roll x={CAB.x + 10} y={CAB.y + 14} z={2 * LEVEL + 11} len={84} />
            <IsoBox x={CAB.x + 62} y={CAB.y + 10} z={2 * LEVEL + 3} w={21} d={30} h={6} faces={{ top: '#fff', left: '#e5e7eb', right: '#d1d5db' }} stroke />
          </Cabinet>

          {/* vysypane veci: dve leziace zlozky a rolka padnu pred skrinu */}
          {(() => {
            const items: { x: number; y: number; kind: 'b' | 'r' }[] = [
              { x: CAB.x - 80, y: CAB.y + 30, kind: 'b' },
              { x: CAB.x - 50, y: CAB.y + 62, kind: 'b' },
              { x: CAB.x - 140, y: CAB.y + 50, kind: 'r' },
            ];
            return items.map((it, i) => {
              const t = fall[i];
              if (t <= 0) return null;
              const drop = (1 - t) * -140;
              return (
                <g key={i} transform={`translate(0 ${drop})`} opacity={Math.min(1, t * 2)}>
                  {it.kind === 'b' ? <Lying x={it.x} y={it.y} z={0} /> : <Roll x={it.x} y={it.y} z={0} len={90} />}
                </g>
              );
            });
          })()}

          {qm.map((s, i) => {
            const [qx, qy] = iso(CAB.x + 20 + i * 30, CAB.y + 20, CM.cabinet.h + 12 + (i % 2) * 14);
            return <QuestionMark key={i} x={qx} y={qy} s={s * 0.9} />;
          })}
        </svg>
      </Camera>
      {showCap ? <Caption text={captions.C2} mode="dark" t={settle(frame, 3000)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
