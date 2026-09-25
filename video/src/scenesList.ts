import React from 'react';
import { C1_Intro } from './scenes/C1_Intro';
import { C2_Hladanie } from './scenes/C2_Hladanie';
import { C2_Kancelaria } from './scenes/C2_Kancelaria';
import { C3_Sklad } from './scenes/C3_Sklad';
import { C4_Cena } from './scenes/C4_Cena';
import { C5_Teren } from './scenes/C5_Teren';
import { F1_SECONDS, F1_Sken } from './scenes/F1_Sken';
import { C6_Spracovanie } from './scenes/C6_Spracovanie';
import { F2_Metadata } from './scenes/F2_Metadata';
import { F3_Vyhladavanie } from './scenes/F3_Vyhladavanie';
import { F4_Kontrola } from './scenes/F4_Kontrola';
import { C7_Hierarchia } from './scenes/C7_Hierarchia';
import { C8_Pilot } from './scenes/C8_Pilot';
import { C9_Outro } from './scenes/C9_Outro';
import { S04_Pokusy } from './scenes/optional/S04_Pokusy';
import { S10_Nasadenie } from './scenes/optional/S10_Nasadenie';
import { Hold, Paced, holdsSeconds } from './components/Paced';
import { F2_SECONDS } from './scenes/F2_Metadata';
import { F3_SECONDS } from './scenes/F3_Vyhladavanie';
import { F4_SECONDS } from './scenes/F4_Kontrola';

export type SceneDef = { component: React.FC; seconds: number; stills: number[] };
/** Klip s pauzami (holds, ms v case sceny), nahovorom (vo) a titulkami; seconds = dlzka sceny bez pauz. */
type PacedDef = { scene: React.FC; seconds: number; stills: number[]; holds?: Hold[]; skip?: number; vo?: boolean; dark?: boolean; darkUntil?: number; subtitleLeft?: number };
const paced = (id: string, d: PacedDef): [string, SceneDef] => {
  const Scene = d.scene;
  const component: React.FC = () =>
    React.createElement(Paced, { id, holds: d.holds, skip: d.skip, vo: d.vo, dark: d.dark, darkUntil: d.darkUntil, subtitleLeft: d.subtitleLeft, children: React.createElement(Scene) });
  return [id, { component, seconds: d.seconds + holdsSeconds(d.holds) - (d.skip ?? 0) / 1000, stills: d.stills }];
};

/**
 * Klipy (kolo 29): dlzka sceny v sekundach + pauzy (Paced), frame-y pre stills (vo vystupnom case).
 * Pravidlo: text kroku nastupi, obraz sa zastavi (hold), az potom dej; vetu hovori nahovor a titulok.
 */
export const SCENE_LIST: [string, SceneDef][] = [
  ['C1-Intro', { component: C1_Intro, seconds: 4, stills: [45, 65, 100] }],
  paced('C2-Hladanie', { scene: C2_Hladanie, seconds: 10.5, vo: true, dark: true, holds: [{ at: 3600, hold: 2800 }], stills: [80, 240, 370] }),
  paced('C4-Cena', { scene: C4_Cena, seconds: 16.9, skip: 800, vo: true, darkUntil: 11600, holds: [{ at: 4300, hold: 3400 }, { at: 6800, hold: 1000 }], stills: [60, 220, 400, 560] }),
  paced('C5-Teren', { scene: C5_Teren, seconds: 9, vo: true, holds: [{ at: 1400, hold: 800 }, { at: 4600, hold: 800 }, { at: 6300, hold: 800 }], stills: [70, 190, 280] }),
  paced('F1-Sken', { scene: F1_Sken, seconds: F1_SECONDS, vo: true, subtitleLeft: 900, stills: [20, 170, 330] }),
  paced('C7-Hierarchia', { scene: C7_Hierarchia, seconds: 5, vo: true, holds: [{ at: 3300, hold: 1200 }, { at: 4300, hold: 1400 }], stills: [15, 110, 200] }),
  paced('C6-Spracovanie', { scene: C6_Spracovanie, seconds: 3, vo: true, stills: [20, 45, 85] }),
  paced('F2-Metadata', { scene: F2_Metadata, seconds: F2_SECONDS, vo: true, stills: [10, 100, 240] }),
  paced('F4-Kontrola', { scene: F4_Kontrola, seconds: F4_SECONDS, vo: true, stills: [10, 150, 400] }),
  paced('F3-Vyhladavanie', { scene: F3_Vyhladavanie, seconds: F3_SECONDS, vo: true, stills: [10, 170, 340] }),
  paced('C8-Pilot', { scene: C8_Pilot, seconds: 8, vo: true, holds: [{ at: 2300, hold: 1000 }], stills: [50, 130, 240] }),
  paced('C9-Outro', { scene: C9_Outro, seconds: 6, vo: true, dark: true, stills: [40, 120] }),
];

/** Verzia 1 (dlha): samostatna kancelaria a sklad, nahradene klipom C2-Hladanie. */
export const V1_LIST: [string, SceneDef][] = [
  ['C2-Kancelaria', { component: C2_Kancelaria, seconds: 8, stills: [50, 110, 230] }],
  ['C3-Sklad', { component: C3_Sklad, seconds: 13, stills: [90, 230, 380] }],
];

/** Volitelne sceny v starom layoute (nie su v jadre videa). */
export const OPTIONAL_LIST: [string, SceneDef][] = [
  ['S04-Pokusy', { component: S04_Pokusy, seconds: 6, stills: [60, 160] }],
  ['S10-Nasadenie', { component: S10_Nasadenie, seconds: 6, stills: [60, 150] }],
];
