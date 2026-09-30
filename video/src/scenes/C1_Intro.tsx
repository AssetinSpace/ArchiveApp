import React from 'react';
import { useCurrentFrame } from 'remotion';
import { Scene } from '../components/Scene';
import { Lockup } from '../components/ArchivesBrand';
import { tween } from '../lib/anim';

/**
 * C1 - Intro. Kolo 36: klip 3,6 s.
 * Kolo 49 (Samuel: dlhu verziu znackovo zjednotit s kratkou): namiesto textoveho lockupu z design kitu (assetin/.space |
 * Archives) oficialne dvojriadkove logo Assetin Archives vo verzii na tmavomodru, sklada sa rovnako ako v C4 a v kratkej
 * verzii (ciara narastie, domcek dosadne, assetin a ARCHIVES vyjdu zospodu). Na konci sa priblizi a vybledne do navy
 * = prvy frame C2.
 *
 * ms: 300 logo sa sklada (do ~1250) · drzi · 2800-3500 priblizenie + navy.
 */
const LOGO_H = 220; // sirka ~870 px

export const C1_Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = tween(frame, 2800, 700);
  const navy = tween(frame, 3200, 300);
  return (
    <Scene mode="dark">
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + zoom * 0.35})`, transformOrigin: '50% 50%', opacity: 1 - zoom * 0.9, filter: `blur(${zoom * 6}px)` }}>
        <Lockup height={LOGO_H} colors="inverse" build={300} />
      </div>
      {/* prechod do navy na konci (prvy frame C2 je navy) */}
      <div style={{ position: 'absolute', inset: 0, background: '#08111F', opacity: navy }} />
    </Scene>
  );
};
