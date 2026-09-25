import React from 'react';
import { Step } from '../components/Steps';
import { DesktopFootageClip, Mark, Tap } from './F2_Metadata';
import { phases } from '../copy/sk';
import { cutDuration, segPlay, segStart } from '../lib/cuts';

/**
 * F3 - Vyhladavanie: zostrih noveho zaznamu (search2.mp4, kolo 31) podla src/footage/cuts.json.
 * Tri kroky: pisanie slova, vysledok + detail so zmrazenym drobcekom PL_01 / KR_01 / ZL_03 (zvyraznenie
 * fixkou), automaticky zvyraznena zhoda (freeze 1,5 s), QR kod zlozky.
 */
export const F3_SECONDS = cutDuration('f3-search');
const F3_STEPS: Step[] = [
  { from: 0, title: 'Kľúčové slovo' },
  { from: segStart('f3-search', 2) * 1000, title: 'Záznam a podrobnosti' },
  { from: segStart('f3-search', 6) * 1000, title: 'QR kód overí obsah' },
];
const F3_TAPS: Tap[] = []; // detail zlozky sa otvara sam s vysledkom, klik v zazname nie je
const F3_MARKS: Mark[] = [
  { from: segPlay('f3-search', 2) + 2.3, to: segStart('f3-search', 3) - 0.2, x: 0.19, y: 0.425, w: 0.18, h: 0.048, sweep: 1.0 }, // drobcek PL_01 / KR_01 / ZL_03 (ludsky citatelna cesta)
];
/** F3 zacina z bielej (F4 konci fade-om), okno sa objavi. */
export const F3_Vyhladavanie: React.FC = () => <DesktopFootageClip src="footage/f3-search.mp4" seconds={F3_SECONDS} steps={F3_STEPS} phase={phases.search} taps={F3_TAPS} marks={F3_MARKS} enter />;
