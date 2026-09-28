import React from 'react';
import { Audio, Freeze, Sequence, getInputProps, staticFile, useCurrentFrame } from 'remotion';
import { Subtitles } from './Subtitles';
import { FPS } from '../theme';

export type Hold = { at: number; hold: number }; // ms v case sceny; obraz sa v `at` zastavi na `hold` ms

/** Celkova dlzka pauz (s). */
export const holdsSeconds = (holds: Hold[] = []) => holds.reduce((a, h) => a + h.hold, 0) / 1000;

/** Kolo 33: rozbeh a dobeh okolo pauzy (ms casu sceny na kazdej strane). */
export const RAMP_MS = 250;

/**
 * Cas vystupu -> cas sceny: pauzy vlozene do hotovej animacie bez prepisovania jej
 * casovej osi. Pravidlo "pauza, citanie, dej": pauza sa vklada hned po nastupe textu
 * kroku, dej sa rozbehne az po nej. Kolo 33: pohyb pred pauzou plynulo spomali
 * (RAMP_MS casu sceny za dvojnasobok casu vystupu), zastane v `at` a po pauze sa
 * plynulo rozbehne - ziadne tvrde zastavenie uprostred pohybu (dosekanost v kole 32).
 * Vysledok moze byt desatinny frame (Freeze aj spring ho zvladnu).
 */
export const sceneFrame = (outFrame: number, holds: Hold[] = []) => {
  let shift = 0;
  for (const h of [...holds].sort((a, b) => a.at - b.at)) {
    const A = (h.at / 1000) * FPS;
    const H = (h.hold / 1000) * FPS;
    if (H <= 0) continue;
    const R = Math.min((RAMP_MS / 1000) * FPS, H / 2);
    const D = 2 * R; // dobeh aj rozbeh trvaju 2R vystupu a prejdu R sceny
    const stop = H - 2 * R;
    const u = outFrame - (A - R + shift);
    if (u < 0) break;
    if (u < 2 * D + stop) {
      if (u < D) return A - R + u / 2 + (D / (2 * Math.PI)) * Math.sin((Math.PI * u) / D);
      if (u < D + stop) return A;
      const w = u - D - stop;
      return A + w / 2 - (D / (2 * Math.PI)) * Math.sin((Math.PI * w) / D);
    }
    shift += H;
  }
  return outFrame - shift;
};

/** Skutocny frame klipu (aj pocas pauzy) pre plynuly pohyb na pozadi, napr. tikajuce hodiny v C4. */
const OutputFrameContext = React.createContext<number | null>(null);
export const useOutputFrame = () => {
  const frozen = useCurrentFrame();
  return React.useContext(OutputFrameContext) ?? frozen;
};

/**
 * Obal klipu: pauzy (Freeze), nahovor (public/vo/<id>.wav) a titulky.
 * Prop voice: false vypne zvuk, subtitles: false titulky.
 */
export const Paced: React.FC<{ id: string; holds?: Hold[]; skip?: number; vo?: boolean; dark?: boolean; darkUntil?: number; subtitleLeft?: number; children: React.ReactNode }> = ({ id, holds = [], skip = 0, vo = false, dark, darkUntil, subtitleLeft, children }) => {
  const frame = useCurrentFrame();
  const p = getInputProps() as { voice?: boolean; subtitles?: boolean };
  // skip: scena zacne o `skip` ms neskor vo svojom case (preskoci sa jej uvod, napr. najazd kamery v C4)
  const skipped = skip ? <Sequence from={-Math.round((skip / 1000) * FPS)} layout="none">{children}</Sequence> : <>{children}</>;
  const inner = holds.length ? <Freeze frame={sceneFrame(frame, holds)}>{skipped}</Freeze> : skipped;
  return (
    <OutputFrameContext.Provider value={frame}>
      {inner}
      {vo && p.voice !== false ? <Audio src={staticFile(`vo/${id}.wav`)} /> : null}
      {vo && p.subtitles !== false ? <Subtitles clip={id} dark={dark} darkUntil={darkUntil} left={subtitleLeft} /> : null}
    </OutputFrameContext.Provider>
  );
};
