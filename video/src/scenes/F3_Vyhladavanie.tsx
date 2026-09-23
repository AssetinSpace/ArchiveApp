import React from 'react';
import { Step } from '../components/Steps';
import { DesktopFootageClip } from './F2_Metadata';

/**
 * F3 - Vyhladavanie (16 s zaznam zostrihany na 12,5 s): zadanie slova
 * "vodovod" (0,5-7,5 s), zoznam metadat so zvyraznenou zhodou (7,5-14 s,
 * zrychlene 2x), QR kod zlozky (14-16,2 s).
 */
export const F3_SECONDS = 12.5;
const F3_STEPS: Step[] = [
  { from: 0, title: 'Hľadať', line: 'Stačí slovo. Napríklad „vodovod“.' },
  { from: 3000, title: 'Zhoda', line: 'Nájde zložku, v ktorej sa slovo vyskytuje: v názve, poznámke aj v texte prílohy.' },
  { from: 7000, title: 'Metadáta', line: 'Kľúče a hodnoty z fotky štítku, zhoda je zvýraznená.' },
  { from: 10300, title: 'QR kód', line: 'Z výsledku rovno k fyzickej zložke na polici.' },
];
export const F3_Vyhladavanie: React.FC = () => <DesktopFootageClip src="footage/f3-search.mp4" seconds={F3_SECONDS} steps={F3_STEPS} />;
