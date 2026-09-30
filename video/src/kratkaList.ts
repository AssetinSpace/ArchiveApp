import React from 'react';
import { Hold, Paced, holdsSeconds } from './components/Paced';
import type { SceneDef } from './scenesList';

/**
 * Experiment kratkej verzie (vetva claude/video-assets-archives-exp-la1hts), ~74 s. Hlavna verzia (SCENE_LIST
 * v scenesList.ts) sa nemeni. Hlas: public/vo-kratka/<ID>.wav (scenar src/copy/vo_kratka.json).
 * Pauzy (holds) len v pokoji, ako v hlavnej verzii (Paced). Kolo 2: teaser vypadol, jedina kratka verzia je
 * LinkedIn 4:5 (src/scenes/kratka/LinkedIn.tsx); kolo 3: jej klipy 16:9 (K_LIST) vypadli, ostal `paced` a pauzy C4.
 * Kolo 6: pauza C4 vypadla (LinkedIn prehra zaciatok C4 rychlejsie, K_C4_FAST).
 */
export type PacedDef = { scene: React.FC; seconds: number; stills: number[]; holds?: Hold[]; skip?: number; vo?: boolean; dark?: boolean; darkUntil?: number; subtitleLeft?: number; subtitles?: boolean };
export const paced = (id: string, d: PacedDef): [string, SceneDef] => {
  const Scene = d.scene;
  const component: React.FC = () =>
    React.createElement(Paced, { id, holds: d.holds, skip: d.skip, vo: d.vo ?? true, dark: d.dark, darkUntil: d.darkUntil, subtitleLeft: d.subtitleLeft, subtitles: d.subtitles, audio: `vo-kratka/${id}.wav`, children: React.createElement(Scene) });
  return [id, { component, seconds: d.seconds + holdsSeconds(d.holds) - (d.skip ?? 0) / 1000, stills: d.stills }];
};
