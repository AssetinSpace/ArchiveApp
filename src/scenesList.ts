import React from 'react';
import { S00_Intro } from './scenes/S00_Intro';
import { S01_Sklad } from './scenes/S01_Sklad';
import { S02_Krabica } from './scenes/S02_Krabica';
import { S03_Cena } from './scenes/S03_Cena';
import { S04_Pokusy } from './scenes/S04_Pokusy';
import { S05_Teren } from './scenes/S05_Teren';
import { S06_Spracovanie } from './scenes/S06_Spracovanie';
import { S07_Potvrdenie } from './scenes/S07_Potvrdenie';
import { S08_Hierarchia } from './scenes/S08_Hierarchia';
import { S09_Tabulka } from './scenes/S09_Tabulka';
import { S10_Nasadenie } from './scenes/S10_Nasadenie';
import { S11_Pilot } from './scenes/S11_Pilot';
import { S12_Outro } from './scenes/S12_Outro';

export type SceneDef = { component: React.FC; seconds: number; stills: [number, number] };

/**
 * Sceny, ich dlzka v sekundach a dva frame-y pre schvalovacie stills
 * (A = po nastupe objektov, B = koncovy stav).
 */
export const SCENE_LIST: [string, SceneDef][] = [
  ['S00-Intro', { component: S00_Intro, seconds: 5, stills: [60, 130] }],
  ['S01-Sklad', { component: S01_Sklad, seconds: 9, stills: [90, 240] }],
  ['S02-Krabica', { component: S02_Krabica, seconds: 7, stills: [80, 190] }],
  ['S03-Cena', { component: S03_Cena, seconds: 7, stills: [70, 180] }],
  ['S04-Pokusy', { component: S04_Pokusy, seconds: 6, stills: [60, 160] }],
  ['S05-Teren', { component: S05_Teren, seconds: 9, stills: [100, 200] }],
  ['S06-Spracovanie', { component: S06_Spracovanie, seconds: 8, stills: [80, 200] }],
  ['S07-Potvrdenie', { component: S07_Potvrdenie, seconds: 8, stills: [80, 220] }],
  ['S08-Hierarchia', { component: S08_Hierarchia, seconds: 8, stills: [90, 200] }],
  ['S09-Tabulka', { component: S09_Tabulka, seconds: 8, stills: [90, 200] }],
  ['S10-Nasadenie', { component: S10_Nasadenie, seconds: 6, stills: [60, 150] }],
  ['S11-Pilot', { component: S11_Pilot, seconds: 6, stills: [60, 150] }],
  ['S12-Outro', { component: S12_Outro, seconds: 5, stills: [40, 120] }],
];
