import React from 'react';
import { Step } from '../components/Steps';
import { FOOTAGE_WINDOW_WIDE } from '../components/Device';
import { voAt } from '../components/Subtitles';
import { DesktopFootageClip, Mark, Tap, markAt } from './F2_Metadata';
import { phases } from '../copy/sk';
import { cutDuration, segStart } from '../lib/cuts';

/**
 * F3 - Vyhladavanie: zostrih noveho zaznamu (search2.mp4) podla src/footage/cuts.json.
 * Kolo 33: orez 1764 x 882 od (96, 150) = cely obsah appky v sirsom okne (vlavo vysledok s odznakmi
 * "Najdene v: Metadata | OCR", vpravo detail). Pisanie slova, vysledok a detail zastane v pokoji
 * (pred posunom stranky): drobcek PL_01 / KR_01 / ZL_03 ("ludsky citatelna cesta v hierarchii"), potom
 * odznaky Metadata / OCR ("zvyrazni vsade, kde sa naslo"); posun k automaticky zvyraznenej zhode
 * v metadatach, posun k QR kodu zlozky. Kroky podla hlasu.
 */
const ID = 'f3-search';
export const F3_SECONDS = cutDuration(ID);
const vo = (i: number, k = 0) => voAt('F3-Vyhladavanie', i, k);
const F3_STEPS: Step[] = [
  { from: 0, title: 'Kľúčové slovo' },
  { from: vo(1), title: 'Záznam a podrobnosti' },
  { from: vo(2), title: 'Cesta v hierarchii' },
  { from: vo(3), title: 'Zvýraznené všade' },
  { from: vo(4), title: 'QR kód overí obsah' },
];
const F3_TAPS: Tap[] = []; // detail zlozky sa otvara sam s vysledkom, klik v zazname nie je
const F3_MARKS: Mark[] = [
  markAt(ID, vo(2) / 1000 + 0.4, vo(3) / 1000 - 0.1, 596, 783, 246, 28, { sweep: 0.8 }), // drobcek PL_01 / KR_01 / ZL_03
  markAt(ID, vo(3) / 1000 + 0.3, segStart(ID, 3) - 0.05, 226, 879, 154, 28, { sweep: 0.6 }), // Najdene v: Metadata | OCR
];
/** F3 zacina z bielej (F4 konci fade-om), okno sa objavi. */
export const F3_Vyhladavanie: React.FC = () => <DesktopFootageClip src="footage/f3-search.mp4" seconds={F3_SECONDS} steps={F3_STEPS} phase={phases.search} taps={F3_TAPS} marks={F3_MARKS} win={FOOTAGE_WINDOW_WIDE} panelLeft={1460} panelWidth={430} enter />;
