import React from 'react';
import { C1_Intro } from './scenes/C1_Intro';
import { C2_Hladanie } from './scenes/C2_Hladanie';
import { C2_Kancelaria } from './scenes/C2_Kancelaria';
import { C3_Sklad } from './scenes/C3_Sklad';
import { C4_BRAND_END, C4_Cena, C4_WIPE_AT } from './scenes/C4_Cena';
import { C5_TerenMain } from './scenes/C5_Teren';
import { C8B_SECONDS, C8b_Technika } from './scenes/C8b_Technika';
import { F1_SECONDS, F1_Sken } from './scenes/F1_Sken';
import { C6_Spracovanie } from './scenes/C6_Spracovanie';
import { F2_Metadata } from './scenes/F2_Metadata';
import { F3_Vyhladavanie } from './scenes/F3_Vyhladavanie';
import { F4_Kontrola } from './scenes/F4_Kontrola';
import { C8_Pilot } from './scenes/C8_Pilot';
import { C9_Outro } from './scenes/C9_Outro';
import { S04_Pokusy } from './scenes/optional/S04_Pokusy';
import { S10_Nasadenie } from './scenes/optional/S10_Nasadenie';
import { BrandDef, Hold, Paced, holdsSeconds } from './components/Paced';
import { F2_SECONDS } from './scenes/F2_Metadata';
import { F3_SECONDS } from './scenes/F3_Vyhladavanie';
import { F4_SECONDS } from './scenes/F4_Kontrola';

export type SceneDef = { component: React.FC; seconds: number; stills: number[] };
/** Klip s pauzami (holds, ms v case sceny), nahovorom (vo) a titulkami; seconds = dlzka sceny bez pauz. */
type PacedDef = { scene: React.FC; seconds: number; stills: number[]; holds?: Hold[]; skip?: number; vo?: boolean; dark?: boolean; darkUntil?: number; subtitleLeft?: number; brand?: BrandDef };
const paced = (id: string, d: PacedDef): [string, SceneDef] => {
  const Scene = d.scene;
  const component: React.FC = () =>
    React.createElement(Paced, { id, holds: d.holds, skip: d.skip, vo: d.vo, dark: d.dark, darkUntil: d.darkUntil, subtitleLeft: d.subtitleLeft, brand: d.brand, children: React.createElement(Scene) });
  return [id, { component, seconds: d.seconds + holdsSeconds(d.holds) - (d.skip ?? 0) / 1000, stills: d.stills }];
};

/**
 * Klipy (kolo 29; kolo 33: pauzy podla casov slov hlasu Gemini, plynule spomalenie okolo pauz v Paced): dlzka sceny v sekundach + pauzy (Paced), frame-y pre stills (vo vystupnom case).
 * Pravidlo: text kroku nastupi, obraz sa zastavi (hold), az potom dej; vetu hovori nahovor a titulok.
 * Kolo 49: `brand` = logo Assetin Archives v pravom dolnom rohu (ako v kratkej verzii), okrem intra a zaveru.
 */
export const SCENE_LIST: [string, SceneDef][] = [
  ['C1-Intro', { component: C1_Intro, seconds: 3.6, stills: [30, 55, 95] }],
  paced('C2-Hladanie', { scene: C2_Hladanie, seconds: 10, vo: true, dark: true, brand: { dark: true }, holds: [{ at: 1700, hold: 2420 }, { at: 3600, hold: 500 }], stills: [80, 150, 260, 380] }),
  paced('C4-Cena', { scene: C4_Cena, seconds: 16.65, vo: true, darkUntil: 11400, brand: { darkUntil: C4_WIPE_AT, hide: [C4_WIPE_AT, C4_BRAND_END] }, holds: [{ at: 3000, hold: 2500 }, { at: 4390, hold: 1770 }], stills: [80, 170, 280, 370, 500] }),
  paced('C5-Teren', { scene: C5_TerenMain, seconds: 8.4, vo: true, brand: {}, holds: [{ at: 1400, hold: 3800 }, { at: 4300, hold: 4350 }, { at: 6700, hold: 900 }], stills: [70, 200, 300, 400] }), // kolo 51: dlhsia veta o QR (nalepky pri "sanon alebo zlozka, dostane QR kod"), mobil pri "Mobilom potom odfotime"
  paced('F1-Sken', { scene: F1_Sken, seconds: F1_SECONDS, vo: true, brand: {}, subtitleLeft: 900, stills: [20, 170, 310] }),
  // kolo 41: C7-Hierarchia vypadlo (Samuel: navyse; hierarchiu povie F1 "zaradime ju do hierarchie" a ukaze F3 cesta v hierarchii)
  paced('C6-Spracovanie', { scene: C6_Spracovanie, seconds: 2, vo: false, // kolo 52: 2 s (predtym 3 s bez hlasu)
    // kolo 51: bez vety (F2 hned "Aplikacia z fotky sama precita text...")
    brand: {}, stills: [20, 45, 85] }),
  paced('F2-Metadata', { scene: F2_Metadata, seconds: F2_SECONDS, vo: true, holds: [{ at: 7400, hold: 900 }], // kolo 51: veta z kratkej verzie je o 0,3 s dlhsia
    brand: {}, stills: [10, 100, 240] }),
  paced('F4-Kontrola', { scene: F4_Kontrola, seconds: F4_SECONDS, vo: true, brand: {}, stills: [10, 150, 400] }),
  // kolo 53 (Samuel: export a analyzu vyhodit, hned klucove slovo a vyhladavanie): C10-Databaza vypadol, F3 ide hned po F4
  paced('F3-Vyhladavanie', { scene: F3_Vyhladavanie, seconds: F3_SECONDS, vo: true, brand: {}, stills: [30, 170, 330, 440] }),
  paced('C8-Pilot', { scene: C8_Pilot, seconds: 21, vo: true, brand: {}, stills: [60, 170, 330, 500, 625] }), // kolo 42: dve ponuky (sluzba na kluc / softver), kolo 45: riadok rozsahu nasadenia
  paced('C8b-Technika', { scene: C8b_Technika, seconds: C8B_SECONDS, vo: true, brand: {}, stills: [40, 160, 220] }), // kolo 52: slide Technicke riesenie z kratkej verzie
  paced('C9-Outro', { scene: C9_Outro, seconds: 7.3, vo: true, dark: true, stills: [40, 150] }),
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
