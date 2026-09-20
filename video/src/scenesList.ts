import React from 'react';
import { C1_Intro } from './scenes/C1_Intro';
import { C2_Kancelaria } from './scenes/C2_Kancelaria';
import { C3_Sklad } from './scenes/C3_Sklad';
import { C4_Cena } from './scenes/C4_Cena';
import { C5_Teren } from './scenes/C5_Teren';
import { C6_Spracovanie } from './scenes/C6_Spracovanie';
import { C7_Hierarchia } from './scenes/C7_Hierarchia';
import { C8_Pilot } from './scenes/C8_Pilot';
import { C9_Outro } from './scenes/C9_Outro';
import { S04_Pokusy } from './scenes/optional/S04_Pokusy';
import { S10_Nasadenie } from './scenes/optional/S10_Nasadenie';

export type SceneDef = { component: React.FC; seconds: number; stills: number[] };

/** Klipy (kolo 3), dlzka v sekundach a frame-y pre stills (zaciatok akcie, stred, koniec). */
export const SCENE_LIST: [string, SceneDef][] = [
  ['C1-Intro', { component: C1_Intro, seconds: 5, stills: [45, 75, 125] }],
  ['C2-Kancelaria', { component: C2_Kancelaria, seconds: 8, stills: [50, 110, 230] }],
  ['C3-Sklad', { component: C3_Sklad, seconds: 14, stills: [120, 260, 410] }],
  ['C4-Cena', { component: C4_Cena, seconds: 9, stills: [10, 110, 250] }],
  ['C5-Teren', { component: C5_Teren, seconds: 10, stills: [70, 170, 285] }],
  ['C6-Spracovanie', { component: C6_Spracovanie, seconds: 7, stills: [40, 110, 200] }],
  ['C7-Hierarchia', { component: C7_Hierarchia, seconds: 12, stills: [15, 120, 230] }],
  ['C8-Pilot', { component: C8_Pilot, seconds: 7, stills: [50, 110, 180] }],
  ['C9-Outro', { component: C9_Outro, seconds: 5, stills: [40, 120] }],
];

/** Volitelne sceny v starom layoute (nie su v jadre videa). */
export const OPTIONAL_LIST: [string, SceneDef][] = [
  ['S04-Pokusy', { component: S04_Pokusy, seconds: 6, stills: [60, 160] }],
  ['S10-Nasadenie', { component: S10_Nasadenie, seconds: 6, stills: [60, 150] }],
];
