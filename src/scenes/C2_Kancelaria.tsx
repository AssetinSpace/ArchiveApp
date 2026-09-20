import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene, useCaptions } from '../components/Scene';
import { Caption } from '../components/Text';
import { Camera } from '../lib/camera';
import { Binder, Cabinet, Chair, Desk, IsoBox, Roll, iso } from '../lib/iso';
import { Floor, Person, QuestionMark } from '../components/Illustrations';
import { pop, settle, tween } from '../lib/anim';
import { captions } from '../copy/sk';
import { CM, ISO, SAFE } from '../theme';

/**
 * C2 - Kancelaria: stol so stolickou, skrina. Panacik pride ku skrini,
 * otvori lave dvere (otacaju sa okolo pantu), vnutri natlacene sanony,
 * rolky, listy; panacik hlada, "?" nad nim; vyhadzuje veci - vyletia
 * oblukom a dopadnu v rade vedla skrine. Kamera mierny najazd. 8 s.
 *
 * ms: 300 scena · 900-1900 panacik prichadza · 2000-2700 dvere · 2200+ "?" ·
 * 3000/3500/4000 vyhodene veci · 3200 caption · hold.
 */
const PX = 2.4;
const CAB = { x: 280, y: 40 };
const LEVEL = (CM.cabinet.h - 3) / 3;

const Lying: React.FC<{ x: number; y: number; z: number; opacity?: number }> = ({ x, y, z, opacity }) => (
  <g opacity={opacity}>
    <IsoBox x={x} y={y} z={z} w={CM.binder.w} d={CM.binder.h} h={CM.binder.d} faces={{ top: ISO.paper, left: ISO.paper, right: ISO.right }} stroke />
    {/* chrbat sanonu: tmavsi pas na pravej strane */}
    <IsoBox x={x + CM.binder.w - 4} y={y} z={z} w={4} d={CM.binder.h} h={CM.binder.d} faces={{ top: ISO.right, left: ISO.right, right: ISO.edge }} />
  </g>
);
const Papers: React.FC<{ x: number; y: number; z: number; h?: number; opacity?: number }> = ({ x, y, z, h = 6, opacity }) => (
  <g opacity={opacity}>
    <IsoBox x={x} y={y} z={z} w={21} d={30} h={h} faces={{ top: '#fff', left: ISO.paper, right: ISO.left }} stroke />
  </g>
);

export const C2_Kancelaria: React.FC = () => {
  const frame = useCurrentFrame();
  const showCap = useCaptions();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const appear = settle(frame, 300);
  const walk = tw(900, 1000);
  const open = tw(2000, 700);
  const qm = [pop(frame, 2200), pop(frame, 2700), pop(frame, 4400)];

  // panacik: prichadza spredu ku skrini (pred lave dvere)
  const px = 200 + (CAB.x - 70 - 200) * walk;
  const py = 260 + (CAB.y + 70 - 260) * walk;
  const [sx, sy] = iso(px, py, 0);

  // vyhodene veci: obluk zo skrine na podlahu vlavo od skrine, dopad v rade
  const thrown = [
    { start: 3000, tx: CAB.x - 30, ty: CAB.y + 100, kind: 'b' as const },
    { start: 3500, tx: CAB.x + 15, ty: CAB.y + 96, kind: 'r' as const },
    { start: 4000, tx: CAB.x + 60, ty: CAB.y + 108, kind: 'p' as const },
  ];

  const cabinetCenter = iso(CAB.x + 50, CAB.y + 22, 100);
  const camX = (cabinetCenter[0] + 400) * PX - 960;
  const camY = (cabinetCenter[1] + 60) * PX - 540;

  return (
    <Scene mode="dark">
      <Camera keys={[{ ms: 1500, x: 0, y: 0, scale: 1 }, { ms: 5500, x: camX * 0.45, y: camY * 0.25, scale: 1.12 }]}>
        <svg width={1920} height={1080} viewBox="-400 -60 800 450" style={{ position: 'absolute', left: 0, top: 0, opacity: appear, transform: `translateY(${(1 - appear) * 30}px)` }}>
          <Floor x={-40} y={-40} w={520} d={420} fill="#263246" edge="#131F31" />
          <Chair x={100} y={100} />
          <Desk x={60} y={150} />
          <Lying x={80} y={160} z={75} />
          <Papers x={124} y={158} z={75} h={5} />
          <Papers x={132} y={176} z={80} h={3} />

          {/* vyhodene veci na podlahe (pod skrinou v z-order, ale pred nou v y) */}
          {thrown.map((it, i) => {
            const t = tw(it.start, 700);
            if (t <= 0) return null;
            const sxp = CAB.x + 20,
              syp = CAB.y + 60;
            const x = sxp + (it.tx - sxp) * t,
              y = syp + (it.ty - syp) * t;
            const zz = 90 * (1 - t) + 80 * Math.sin(Math.PI * t); // obluk
            const spin = (1 - t) * 40;
            const [cx, cy] = iso(x + 16, y + 15, zz);
            return (
              <g key={i} transform={`rotate(${spin} ${cx} ${cy})`}>
                {it.kind === 'b' ? <Lying x={x} y={y} z={zz} /> : it.kind === 'r' ? <Roll x={x} y={y + 8} z={zz} len={90} /> : <Papers x={x} y={y} z={zz} h={8} />}
              </g>
            );
          })}

          <Cabinet x={CAB.x} y={CAB.y} open={open}>
            {/* spodna polica */}
            {[4, 38, 62].map((bx, i) => (
              <Binder key={`b0${i}`} x={CAB.x + 3 + bx} y={CAB.y + 6 + [0, 10, 2][i]} z={3} d={30} />
            ))}
            <Lying x={CAB.x + 6} y={CAB.y + 6} z={3 + CM.binder.h} />
            {/* stredna polica */}
            {[4, 60].map((bx, i) => (
              <Binder key={`b1${i}`} x={CAB.x + 3 + bx} y={CAB.y + 6 + [8, 0][i]} z={LEVEL + 3} d={30} />
            ))}
            <Papers x={CAB.x + 40} y={CAB.y + 8} z={LEVEL + 3} h={9} />
            <Lying x={CAB.x + 36} y={CAB.y + 14} z={LEVEL + 12} />
            {/* horna polica */}
            <Roll x={CAB.x + 6} y={CAB.y + 8} z={2 * LEVEL + 3} len={88} />
            <Roll x={CAB.x + 6} y={CAB.y + 20} z={2 * LEVEL + 3} len={82} />
            <Roll x={CAB.x + 10} y={CAB.y + 14} z={2 * LEVEL + 11} len={84} />
            <Papers x={CAB.x + 62} y={CAB.y + 10} z={2 * LEVEL + 3} h={6} />
          </Cabinet>

          <Person x={sx} y={sy} scale={1} color="#ffffff" opacity={tw(800, 300)} />
          {qm.map((s, i) => {
            const [qx, qy] = iso(px - 10 + i * 22, py - 10, CM.person + 25 + (i % 2) * 16);
            return <QuestionMark key={i} x={qx} y={qy} s={s * 0.9} />;
          })}
        </svg>
      </Camera>
      {showCap ? <Caption text={captions.C2} mode="dark" t={settle(frame, 3200)} y={SAFE.captionY} /> : null}
    </Scene>
  );
};
