import React from 'react';
import { C1_Intro } from './scenes/C1_Intro';
import { C2_Hladanie } from './scenes/C2_Hladanie';
import { C2_Kancelaria } from './scenes/C2_Kancelaria';
import { C3_Sklad } from './scenes/C3_Sklad';
import { C4_Cena } from './scenes/C4_Cena';
import { C5_Teren } from './scenes/C5_Teren';
import { F1_Sken } from './scenes/F1_Sken';
import { C6_Spracovanie } from './scenes/C6_Spracovanie';
import { F2_Metadata } from './scenes/F2_Metadata';
import { F3_Vyhladavanie } from './scenes/F3_Vyhladavanie';
import { F4_Kontrola } from './scenes/F4_Kontrola';
import { C7_Hierarchia } from './scenes/C7_Hierarchia';
import { C8_Pilot } from './scenes/C8_Pilot';
import { C9_Outro } from './scenes/C9_Outro';
import { S04_Pokusy } from './scenes/optional/S04_Pokusy';
import { S10_Nasadenie } from './scenes/optional/S10_Nasadenie';

export type SceneDef = { component: React.FC; seconds: number; stills: number[] };

/** Klipy (kolo 3), dlzka v sekundach a frame-y pre stills (zaciatok akcie, stred, koniec). */
export const SCENE_LIST: [string, SceneDef][] = [
  ['C1-Intro', { component: C1_Intro, seconds: 4, stills: [45, 65, 100] }],
  ['C2-Hladanie', { component: C2_Hladanie, seconds: 11.5, stills: [80, 160, 240] }],
  ['C4-Cena', { component: C4_Cena, seconds: 10.5, stills: [10, 100, 210, 290] }],
  ['C5-Teren', { component: C5_Teren, seconds: 10, stills: [70, 170, 285] }],
  ['F1-Sken', { component: F1_Sken, seconds: 10.8, stills: [30, 170, 300] }],
  ['C6-Spracovanie', { component: C6_Spracovanie, seconds: 4, stills: [25, 60, 115] }],
  ['F2-Metadata', { component: F2_Metadata, seconds: 8, stills: [15, 80, 200] }],
  ['F4-Kontrola', { component: F4_Kontrola, seconds: 11.5, stills: [20, 150, 320] }],
  ['C7-Hierarchia', { component: C7_Hierarchia, seconds: 10.5, stills: [15, 120, 230] }],
  ['F3-Vyhladavanie', { component: F3_Vyhladavanie, seconds: 11, stills: [30, 150, 300] }],
  ['C8-Pilot', { component: C8_Pilot, seconds: 5, stills: [40, 90, 140] }],
  ['C9-Outro', { component: C9_Outro, seconds: 4, stills: [40, 100] }],
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
