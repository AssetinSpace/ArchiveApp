import React from 'react';
import { Step } from '../components/Steps';
import { DesktopFootageClip } from './F2_Metadata';

/**
 * F4 - Kontrola metadat (127 s zaznam "Review metadat - v2" zostrihany na 11,5 s):
 * fotka stitku zblizka (0,5-1,7 s), prvy navrh a jeho prijatie (19,8-22 s),
 * montaz dalsich prijati 12x (22-56 s) + zmrazeny obraz 0,5 s na pocitadle,
 * rucna oprava hodnoty (93,2-97,5 s, 1,8x), Odoslat a prazdny zoznam (122,8-126,5 s, 1,6x).
 */
export const F4_SECONDS = 11.5;
const F4_STEPS: Step[] = [
  { from: 0, title: 'Fotka je dôkaz', line: 'Každý návrh sa kontroluje podľa fotky štítku.' },
  { from: 1200, title: 'Návrhy metadát', line: 'Aplikácia navrhla 25 hodnôt. Každú potvrdíte jedným klikom.' },
  { from: 6700, title: 'Oprava', line: 'Čo nesedí, opravíte priamo v návrhu.' },
  { from: 9100, title: 'Odoslať', line: 'Až po kontrole človekom sú metadáta platné.' },
];
export const F4_Kontrola: React.FC = () => <DesktopFootageClip src="footage/f4-review.mp4" seconds={F4_SECONDS} steps={F4_STEPS} />;
