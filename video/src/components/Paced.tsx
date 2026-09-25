import React from 'react';
import { Audio, Freeze, Sequence, getInputProps, staticFile, useCurrentFrame } from 'remotion';
import { Subtitles } from './Subtitles';
import { FPS } from '../theme';

export type Hold = { at: number; hold: number }; // ms v case sceny; obraz sa v `at` zastavi na `hold` ms

/** Celkova dlzka pauz (s). */
export const holdsSeconds = (holds: Hold[] = []) => holds.reduce((a, h) => a + h.hold, 0) / 1000;

/**
 * Cas vystupu -> cas sceny: pauzy (zmrazeny obraz) vlozene do hotovej animacie bez
 * prepisovania jej casovej osi. Pravidlo "pauza, citanie, dej": pauza sa vklada
 * hned po nastupe textu kroku, dej sa rozbehne az po nej.
 */
export const sceneFrame = (outFrame: number, holds: Hold[] = []) => {
  let f = outFrame;
  for (const h of [...holds].sort((a, b) => a.at - b.at)) {
    const at = Math.round((h.at / 1000) * FPS);
    const len = Math.round((h.hold / 1000) * FPS);
    if (f < at) break;
    if (f < at + len) return at;
    f -= len;
  }
  return f;
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
    <>
      {inner}
      {vo && p.voice !== false ? <Audio src={staticFile(`vo/${id}.wav`)} /> : null}
      {vo && p.subtitles !== false ? <Subtitles clip={id} dark={dark} darkUntil={darkUntil} left={subtitleLeft} /> : null}
    </>
  );
};
