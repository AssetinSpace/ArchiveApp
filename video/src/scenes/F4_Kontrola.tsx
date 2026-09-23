import React from 'react';
import { Step } from '../components/Steps';
import { DesktopFootageClip } from './F2_Metadata';

/**
 * F4 - Kontrola metadat (127 s zaznam "Review metadat - v2" zostrihany na 15 s):
 * fotka stitku zblizka (0,5-2,5 s), prvy navrh a jeho prijatie (19-22 s),
 * montaz dalsich prijati zrychlena 22x (22-88 s), rucna oprava hodnoty
 * (93-97,5 s, 1,5x), Odoslat a prazdny zoznam kontrol (122,5-126,5 s).
 */
export const F4_SECONDS = 15;
const F4_STEPS: Step[] = [
  { from: 0, title: 'Fotka je dôkaz', line: 'Každý návrh sa kontroluje podľa fotky štítku.' },
  { from: 2000, title: 'Návrhy metadát', line: 'Aplikácia navrhla 25 hodnôt. Každú potvrdíte jedným klikom.' },
  { from: 8000, title: 'Oprava', line: 'Čo nesedí, opravíte priamo v návrhu.' },
  { from: 11000, title: 'Odoslať', line: 'Až po kontrole človekom sú metadáta platné.' },
];
export const F4_Kontrola: React.FC = () => <DesktopFootageClip src="footage/f4-review.mp4" seconds={F4_SECONDS} steps={F4_STEPS} />;
