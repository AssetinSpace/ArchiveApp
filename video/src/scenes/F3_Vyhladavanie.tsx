import React from 'react';
import { Step } from '../components/Steps';
import { voAt } from '../components/Subtitles';
import { DesktopFootageClip, Mark, Panel, Tap, markAt } from './F2_Metadata';
import { DocPath, ItemCard, SearchCard } from '../components/AppCards';
import { cutDuration, segStart } from '../lib/cuts';

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
  { from: 0, title: 'Napísať kľúčové slovo' }, // kolo 51: kroky a vety ako v kratkej verzii
  { from: vo(0, 1), title: 'Údaje o položke' },
  { from: vo(1), title: 'Cesta k položke' },
  { from: vo(2), title: 'Zvýraznené v metadátach' },
];
const F3_TAPS: Tap[] = []; // detail zlozky sa otvara sam s vysledkom, klik v zazname nie je
const spot = { spot: true };
/** Kolo 51: vety 0 (slovo a udaje o polozke), 1 (aj cestu k nej), 2 (zvyraznenie v metadatach). */
const F3_MARKS: Mark[] = [
  markAt(ID, vo(0) / 1000 + 0.2, vo(0, 1) / 1000 + 0.1, 190, 578, 1638, 62, spot), // pole vyhladavania (pisanie slova)
  markAt(ID, vo(0, 1) / 1000 + 0.4, vo(1) / 1000 - 0.1, 132, 830, 402, 180, spot), // vysledok ZL_03: "aplikacia ukaze udaje o konkretnej polozke" (ako v kratkej)
  markAt(ID, vo(1) / 1000 + 0.1, vo(2) / 1000 - 0.1, 596, 783, 246, 28, spot), // drobcek PL_01 / KR_01 / ZL_03: "aj cestu k nej"
  markAt(ID, vo(2) / 1000 + 0.3, segStart(ID, 3) - 0.05, 226, 879, 154, 28, spot), // Najdene v: Metadata | OCR
  markAt(ID, segStart(ID, 4) + 0.1, F3_SECONDS - 0.4, 998, 632, 496, 24, { ...spot, pad: 4 }), // kolo 41: zvyraznena zhoda v metadatach (Popis zmeny); kolo 42: tesne okolo zltej zhody
];
/**
 * Kolo 52 (ako v kratkej verzii): pod oknom hladane slovo (pise sa ako v zazname, 1,0 az 2,1 s), pri "a aplikacia ukaze
 * udaje" karta najdenej zlozky ZL_03 so zvyraznenym slovom, pri "aj cestu k nej" cesta PL_01 -> KR_01 -> ZL_03;
 * pri vete o zvyrazneni v metadatach je okno znova velke.
 */
const F3_PANELS: Panel[] = [
  { from: 0.25, to: vo(0, 1) / 1000 + 0.25, node: <SearchCard typeFrom={1.0} typeTo={2.1} /> },
  { from: vo(0, 1) / 1000 + 0.3, to: vo(1) / 1000 + 0.05, node: <ItemCard /> },
  { from: vo(1) / 1000 + 0.1, to: vo(2) / 1000 - 0.2, node: <DocPath lineAt={vo(1) / 1000} /> },
];
/** Kolo 53: C10 vypadol, F3 ide hned po F4 (ten konci do bielej), okno sa objavi z bielej (`enter`). */
export const F3_Vyhladavanie: React.FC = () => <DesktopFootageClip src="footage/f3-search.mp4" seconds={F3_SECONDS} steps={F3_STEPS} taps={F3_TAPS} marks={F3_MARKS} panels={F3_PANELS} enter />;
