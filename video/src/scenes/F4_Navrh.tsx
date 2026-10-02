import React from 'react';
import { cutDuration } from '../lib/cuts';
import { FOOTAGE_WINDOW_WIDE } from '../components/Device';
import { DesktopFootageClip } from './F2_Metadata';

/**
 * F4-Navrh - klip len pre web (krok 3 produktovej stranky "Aplikacia precita
 * text a navrhne udaje"): prvy usek zaznamu kontroly (review2.mp4) podla
 * src/footage/cuts.json (f4-navrh), kde je vedla fotky stitku navrh udajov.
 * F2-Metadata ukazuje len spracovanie (priebeh do 100 %), navrh az tu.
 * Bez hlasu, bez klikov; rovnake okno ako F4.
 */
const ID = 'f4-navrh';
export const F4_NAVRH_SECONDS = cutDuration(ID);
export const F4_Navrh: React.FC = () => <DesktopFootageClip src="footage/f4-navrh.mp4" seconds={F4_NAVRH_SECONDS} steps={[{ from: 0, title: 'Návrh metadát' }]} win={FOOTAGE_WINDOW_WIDE} panelLeft={1460} panelWidth={430} />;
