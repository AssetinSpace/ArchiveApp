import React from 'react';
import { Step } from '../components/Steps';
import { DesktopFootageClip, Mark, Tap } from './F2_Metadata';

/**
 * F3 - Vyhladavanie (16 s zaznam zostrihany na 11 s): pisanie "vodovod"
 * (0,5-2,5 s 1,3x), vysledok (2,5-4 s), klik (4-7,5 s 2x), scroll metadat
 * (7,5-9,8 s 2x), zvyraznena zhoda drzi (9,8-11,8 s 1x), zvysok 2x, QR kod (14-16,2 s 1,2x).
 */
export const F3_SECONDS = 11;
const F3_STEPS: Step[] = [
  { from: 0, title: 'Hľadať', line: 'Stačí slovo. Napríklad „vodovod“.' },
  { from: 2400, title: 'Zhoda', line: 'Nájde zložku, v ktorej sa slovo vyskytuje: v názve, poznámke aj v texte prílohy.' },
  { from: 4800, title: 'Metadáta', line: 'Kľúče a hodnoty z fotky štítku, zhoda je zvýraznená.' },
  { from: 9100, title: 'QR kód', line: 'Z výsledku rovno k fyzickej zložke na polici.' },
];
const F3_TAPS: Tap[] = [
  { t: 4.5, x: 0.16, y: 0.25 }, // klik na vysledok ZL_01
];
const F3_MARKS: Mark[] = [
  { from: 0.4, to: 2.2, x: 0.108, y: 0.462, w: 0.075, h: 0.05, sweep: 1.3 }, // pisane slovo "vodovod" - jemna fixka zlava
];
/** F3 zacina z bielej (F4 konci fade-om), okno sa objavi. */
export const F3_Vyhladavanie: React.FC = () => <DesktopFootageClip src="footage/f3-search.mp4" seconds={F3_SECONDS} steps={F3_STEPS} taps={F3_TAPS} marks={F3_MARKS} enter />;
