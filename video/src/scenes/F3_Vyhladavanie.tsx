import React from 'react';
import { Step } from '../components/Steps';
import { FOOTAGE_WINDOW_WIDE } from '../components/Device';
import { voAt } from '../components/Subtitles';
import { DesktopFootageClip, Mark, Tap, ZoomKey, markAt } from './F2_Metadata';
import { phases } from '../copy/sk';
import { cutDuration, segStart, srcFrac } from '../lib/cuts';

/**
 * F3 - Vyhladavanie: zostrih noveho zaznamu (search2.mp4) podla src/footage/cuts.json.
 * Kolo 33: orez 1764 x 882 od (96, 150) = cely obsah appky v sirsom okne (vlavo vysledok s odznakmi
 * "Najdene v: Metadata | OCR", vpravo detail). Pisanie slova, vysledok a detail zastane v pokoji
 * (pred posunom stranky): drobcek PL_01 / KR_01 / ZL_03 ("ludsky citatelna cesta v hierarchii"), potom
 * odznaky Metadata / OCR ("zvyrazni vsade, kde sa naslo"); posun k automaticky zvyraznenej zhode
 * v metadatach, posun k QR kodu zlozky. Kroky podla hlasu.
 * Kolo 35: zvyraznenia su spoty (ramik + stmavene okolie). Kolo 36: uvod o praci s databazou je samostatna scena C10
 * (ako ostatne funkcie), menu sa nezvyraznuje; F3 nadvazuje na okno z C10 (bez `enter`), spot len na poli vyhladavania.
 */
const ID = 'f3-search';
export const F3_SECONDS = cutDuration(ID);
const vo = (i: number, k = 0) => voAt('F3-Vyhladavanie', i, k);
const F3_STEPS: Step[] = [
  { from: 0, title: 'Kľúčové slovo' },
  { from: vo(1), title: 'Záznam a podrobnosti' },
  { from: vo(2), title: 'Cesta v hierarchii' },
  { from: vo(3), title: 'Zvýraznené v metadátach' }, // kolo 41: bez vety o povodnom texte a bez QR (Samuel)
];
const F3_TAPS: Tap[] = []; // detail zlozky sa otvara sam s vysledkom, klik v zazname nie je
const spot = { spot: true };
const F3_MARKS: Mark[] = [
  markAt(ID, vo(0) / 1000 + 0.2, segStart(ID, 1), 190, 578, 1638, 62, spot), // pole vyhladavania (pisanie slova)
  markAt(ID, vo(2) / 1000 + 0.4, vo(3) / 1000 - 0.1, 596, 783, 246, 28, spot), // drobcek PL_01 / KR_01 / ZL_03
  markAt(ID, vo(3) / 1000 + 0.3, segStart(ID, 3) - 0.05, 226, 879, 154, 28, spot), // Najdene v: Metadata | OCR
  markAt(ID, segStart(ID, 4) + 0.1, F3_SECONDS - 0.4, 998, 632, 496, 24, { ...spot, pad: 4 }), // kolo 41: zvyraznena zhoda v metadatach (Popis zmeny); kolo 42: tesne okolo zltej zhody (ramik bol privelky)
];
/** F3 nadvazuje na okno z C10 (kolo 36), obsah okna nabehne z bielej. */
export const F3_Vyhladavanie: React.FC = () => <DesktopFootageClip src="footage/f3-search.mp4" seconds={F3_SECONDS} steps={F3_STEPS} phase={phases.search} taps={F3_TAPS} marks={F3_MARKS} win={FOOTAGE_WINDOW_WIDE} panelLeft={1460} panelWidth={430} />;

/**
 * F3-Vyhladavanie-Web: ten isty zostrih pre web (krok 5 produktovej stranky), s kamerou: pole
 * vyhladavania pri pisani, vysledok a detail, drobcek cesty, odznaky Najdene v, zvyraznena zhoda.
 * Samuel 2. 10.: priblizovat tam, kde sa prave nieco deje. Bez hlasu (web hra bez zvuku).
 */
const f = (x: number, y: number, scale: number, s: number): ZoomKey => ({ ms: s * 1000, ...srcFrac(ID, x, y), scale });
const FULL = (s: number) => f(978, 591, 1, s);
const F3_ZOOM: ZoomKey[] = [
  FULL(0),
  FULL(0.4),
  f(640, 609, 1.5, 1.2), // pole vyhladavania: lava cast, kde sa pise slovo
  f(640, 609, 1.5, segStart(ID, 2)),
  f(700, 790, 1.45, segStart(ID, 2) + 0.8), // vysledok ZL_03 a detail
  f(700, 790, 1.45, vo(2) / 1000),
  f(720, 797, 1.9, vo(2) / 1000 + 0.7), // drobcek PL_01 / KR_01 / ZL_03
  f(720, 797, 1.9, vo(3) / 1000),
  f(330, 870, 1.9, vo(3) / 1000 + 0.6), // odznaky Najdene v: Metadata | OCR
  f(330, 870, 1.9, segStart(ID, 3)),
  FULL(segStart(ID, 3) + 0.6), // posun k zhode
  FULL(segStart(ID, 4)),
  f(1246, 644, 1.6, segStart(ID, 4) + 0.7), // zvyraznena zhoda v metadatach
  f(1246, 644, 1.6, F3_SECONDS),
];
export const F3_VyhladavanieWeb: React.FC = () => <DesktopFootageClip src="footage/f3-search.mp4" seconds={F3_SECONDS} steps={F3_STEPS} phase={phases.search} taps={F3_TAPS} marks={F3_MARKS} zoom={F3_ZOOM} win={FOOTAGE_WINDOW_WIDE} panelLeft={1460} panelWidth={430} />;
