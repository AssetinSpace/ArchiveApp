import React from 'react';
import { Hold, Paced, holdsSeconds } from './components/Paced';
import type { SceneDef } from './scenesList';
import { C2_Hladanie } from './scenes/C2_Hladanie';
import { K_C4, K_C4_D, K_C4_H, K_C5, K_F1, K_F1_SECONDS, K_F24, K_F24_SECONDS, K_F3, K_F3_SECONDS, K_C8, K_C9, c4End } from './scenes/kratka/Kratka';

/**
 * Experiment kratkej verzie (vetva claude/video-assets-archives-exp-la1hts), ~74 s. Hlavna verzia (SCENE_LIST
 * v scenesList.ts) sa nemeni. Hlas: public/vo-kratka/<ID>.wav (scenar src/copy/vo_kratka.json).
 * Pauzy (holds) len v pokoji, ako v hlavnej verzii (Paced). Kolo 2: teaser vypadol; klipy 16:9 nizsie su zaklad
 * verzie LinkedIn 4:5 (src/scenes/kratka/LinkedIn.tsx), ktora je jedinou kratkou verziou.
 */
export type PacedDef = { scene: React.FC; seconds: number; stills: number[]; holds?: Hold[]; skip?: number; vo?: boolean; dark?: boolean; darkUntil?: number; subtitleLeft?: number; subtitles?: boolean };
export const paced = (id: string, d: PacedDef): [string, SceneDef] => {
  const Scene = d.scene;
  const component: React.FC = () =>
    React.createElement(Paced, { id, holds: d.holds, skip: d.skip, vo: d.vo ?? true, dark: d.dark, darkUntil: d.darkUntil, subtitleLeft: d.subtitleLeft, subtitles: d.subtitles, audio: `vo-kratka/${id}.wav`, children: React.createElement(Scene) });
  return [id, { component, seconds: d.seconds + holdsSeconds(d.holds) - (d.skip ?? 0) / 1000, stills: d.stills }];
};
/** Pauzy C4 v kratkej verzii (hodiny so slovom "hodiny", vykres so slovom "nanovo", "2x" so slovom "dvakrat"). */
export const K_C4_HOLDS: Hold[] = [{ at: 2900, hold: 1600 }, { at: 4300, hold: 400 }];

/** Kratka verzia (~75 s): hacik hned, problem 25 s, tri kroky, ponuka a vyzva. */
export const K_LIST: [string, SceneDef][] = [
  paced('K-C2-Hladanie', { scene: C2_Hladanie, seconds: 10, dark: true, stills: [20, 90, 200, 280] }),
  // hodiny so slovom "hodiny", vykres so slovom "nanovo", "2x" so slovom "dvakrat"; predel po vete, znacka pocas vety o katalogu
  paced('K-C4-Cena', { scene: K_C4, seconds: c4End(K_C4_D, K_C4_H), darkUntil: 8450, holds: K_C4_HOLDS, stills: [80, 150, 200, 300, 420] }),
  paced('K-C5-Teren', { scene: K_C5, seconds: 8.4, stills: [60, 120, 160, 240] }),
  paced('K-F1-Sken', { scene: K_F1, seconds: K_F1_SECONDS, vo: false, stills: [15, 45, 70] }), // skutocny fotoaparat, bez hlasu
  paced('K-F24-Aplikacia', { scene: K_F24, seconds: K_F24_SECONDS, stills: [60, 150, 260, 340] }),
  paced('K-F3-Vyhladavanie', { scene: K_F3, seconds: K_F3_SECONDS, stills: [40, 130, 190] }),
  paced('K-C8-Ponuka', { scene: K_C8, seconds: 10.2, stills: [60, 150, 250, 300] }),
  paced('K-C9-Outro', { scene: K_C9, seconds: 6.5, dark: true, stills: [40, 150] }),
];
