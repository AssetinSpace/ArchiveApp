import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { BrandMod, BrandSep, BrandStack, LOCKUP, LOCKUP_W } from '../components/Brand';
import { settle, tween } from '../lib/anim';

/**
 * C1 - Intro. Lockup podla assetin-design-kitu: stohovany logotyp
 * (assetin / .space), zvisly oddelovac, modul "Archives". Lockup je pocas
 * drzania centrovany; na konci sa Archives zasunie za oddelovac, oddelovac
 * sa stiahne, logotyp sa priblizi a vybledne do navy = prvy frame C2.
 * Kolo 36: assetin a .space vyplavaju spolu (kratsie o 0,4 s), klip 3,6 s.
 *
 * ms: 300 assetin.space · 700-1100 oddelovac · 900-1500 Archives vychadza ·
 * 2000-2500 Archives sa zasuva (skupina ide do stredu) · 2500-2800 oddelovac
 * sa stiahne · 2800-3500 priblizenie + navy.
 */
export const C1_Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const tw = (s: number, d: number) => tween(frame, s, d);
  const stackIn = settle(frame, 300);
  const domain = stackIn; // kolo 36: spolu s assetin
  const sep = tw(700, 400) * (1 - tw(2500, 300));
  const mod = tw(900, 600) * (1 - tw(2000, 500));
  const back = tw(2000, 500);
  const zoom = tw(2800, 700);
  const navy = tw(3200, 300);

  // pocas drzania je centrovany cely lockup; pri zasunuti Archives sa skupina
  // (stack + sep) posunie tak, aby bol logotyp v strede
  const stackLeftHold = 960 - LOCKUP_W / 2;
  const stackLeftEnd = 960 - LOCKUP.stackW / 2;
  const stackLeft = stackLeftHold + (stackLeftEnd - stackLeftHold) * back;
  const sepLeft = stackLeft + LOCKUP.stackW + LOCKUP.gap;
  const modLeft = sepLeft + LOCKUP.sepW + LOCKUP.gap;
  const top = 540 - LOCKUP.sepH / 2;
  // korekcie podla nameranych glyfov (stred glyfov na y = 540)
  const STACK_DY = -2;
  const MOD_DY = -30;
  const scale = 1 + zoom * 0.35;

  return (
    <Scene mode="dark">
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${scale})`, transformOrigin: '50% 50%', opacity: 1 - zoom * 0.9, filter: `blur(${zoom * 6}px)` }}>
        {/* stohovany logotyp */}
        <div style={{ position: 'absolute', left: stackLeft, top: top + STACK_DY, opacity: stackIn, transform: `translateY(${(1 - stackIn) * 24}px)` }}>
          <BrandStack domain={domain} />
        </div>
        {/* oddelovac */}
        <div style={{ position: 'absolute', left: sepLeft, top }}>
          <BrandSep t={sep} />
        </div>
        {/* modul Archives: vychadza spoza oddelovaca doprava (clip) */}
        {/* clip len vodorovne (modul vychadza spoza oddelovaca) - zvislo s rezervou, aby sa neorezali pismena */}
        <div style={{ position: 'absolute', left: modLeft, top: top - 80, width: LOCKUP.modW + 40, height: LOCKUP.sepH + 160, overflow: 'hidden' }}>
          <BrandMod style={{ position: 'absolute', left: 0, top: MOD_DY + 80, transform: `translateX(${(mod - 1) * (LOCKUP.modW + 40)}px)`, opacity: Math.min(1, mod * 2) }} />
        </div>
      </div>
      {/* prechod do navy na konci (prvy frame C2 je navy) */}
      <div style={{ position: 'absolute', inset: 0, background: '#08111F', opacity: navy }} />
    </Scene>
  );
};
