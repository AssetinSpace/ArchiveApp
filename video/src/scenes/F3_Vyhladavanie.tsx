import React from 'react';
import { Step } from '../components/Steps';
import { DesktopFootageClip, Mark, Tap } from './F2_Metadata';
import { phases } from '../copy/sk';
import { cutDuration, cutTime, segStart } from '../lib/cuts';

/**
 * F3 - Vyhladavanie: zostrih podla src/footage/cuts.json (f3-search). Kolo 29: tri
 * kroky (Hladat slovo / Zlozka najdena / QR k polici), pauza pred kazdym, zhoda drzi 1,5 s.
 */
export const F3_SECONDS = cutDuration('f3-search');
const F3_STEPS: Step[] = [
  { from: 0, title: 'Hľadať slovo' },
  { from: segStart('f3-search', 1) * 1000, title: 'Zložka nájdená' },
  { from: segStart('f3-search', 5) * 1000, title: 'QR k polici' },
];
const F3_TAPS: Tap[] = [
  { t: cutTime('f3-search', 4.0), x: 0.16, y: 0.25 }, // klik na vysledok ZL_01
];
const F3_MARKS: Mark[] = [
  { from: cutTime('f3-search', 1.0), to: cutTime('f3-search', 2.5), x: 0.108, y: 0.462, w: 0.075, h: 0.05, sweep: 1.3 }, // pisane slovo "vodovod" - jemna fixka zlava
];
/** F3 zacina z bielej (F4 konci fade-om), okno sa objavi. */
export const F3_Vyhladavanie: React.FC = () => <DesktopFootageClip src="footage/f3-search.mp4" seconds={F3_SECONDS} steps={F3_STEPS} phase={phases.search} taps={F3_TAPS} marks={F3_MARKS} enter />;
