import React from 'react';
import { C1_Intro } from './scenes/C1_Intro';
import { C2_Problem } from './scenes/C2_Problem';
import { C3_Cena } from './scenes/C3_Cena';
import { C4_Teren } from './scenes/C4_Teren';
import { C5_Spracovanie } from './scenes/C5_Spracovanie';
import { C6_Vysledok } from './scenes/C6_Vysledok';
import { C7_Pilot } from './scenes/C7_Pilot';
import { C8_Outro } from './scenes/C8_Outro';
import { S04_Pokusy } from './scenes/optional/S04_Pokusy';
import { S10_Nasadenie } from './scenes/optional/S10_Nasadenie';

export type SceneDef = { component: React.FC; seconds: number; stills: number[] };

/**
 * Klipy (kolo 2), dlzka v sekundach a frame-y pre schvalovacie stills
 * (zaciatok akcie, stred, koniec).
 */
export const SCENE_LIST: [string, SceneDef][] = [
  ['C1-Intro', { component: C1_Intro, seconds: 4, stills: [40, 75, 115] }],
  ['C2-Problem', { component: C2_Problem, seconds: 14, stills: [120, 215, 400] }],
  ['C3-Cena', { component: C3_Cena, seconds: 7, stills: [40, 100, 190] }],
  ['C4-Teren', { component: C4_Teren, seconds: 10, stills: [70, 170, 285] }],
  ['C5-Spracovanie', { component: C5_Spracovanie, seconds: 14, stills: [80, 180, 390] }],
  ['C6-Vysledok', { component: C6_Vysledok, seconds: 14, stills: [150, 250, 390] }],
  ['C7-Pilot', { component: C7_Pilot, seconds: 7, stills: [50, 110, 180] }],
  ['C8-Outro', { component: C8_Outro, seconds: 5, stills: [40, 120] }],
];

/** Volitelne sceny v starom layoute (nie su v jadre videa). */
export const OPTIONAL_LIST: [string, SceneDef][] = [
  ['S04-Pokusy', { component: S04_Pokusy, seconds: 6, stills: [60, 160] }],
  ['S10-Nasadenie', { component: S10_Nasadenie, seconds: 6, stills: [60, 150] }],
];
