import React from 'react';
import { cutDuration, srcFrac } from '../lib/cuts';
import { FOOTAGE_WINDOW_WIDE } from '../components/Device';
import { DesktopFootageClip, Mark, ZoomKey, markAt } from './F2_Metadata';

/**
 * F4-Navrh - klip len pre web (krok 3 produktovej stranky "Aplikacia precita
 * text a navrhne udaje"): staticky zaber zo zaznamu kontroly (review2.mp4,
 * src/footage/cuts.json f4-navrh), vedla fotky stitku navrh udajov.
 * Kamera: najprv priblizenie na hlavicku fotky (nazov stavby), potom prejazd
 * na navrhnute hodnoty vpravo (Nazov projektu, Stavba), ktore sa s fotkou zhoduju.
 * Bez hlasu, bez klikov; rovnake okno ako F4. Samuel 2. 10.: zaber bez priblizenia bol "od veci".
 */
const ID = 'f4-navrh';
export const F4_NAVRH_SECONDS = cutDuration(ID);

// ohniska v px zdroja (pred orezom) -> podiely obsahu okna
const focus = (x: number, y: number, scale: number, ms: number): ZoomKey => ({ ms, ...srcFrac(ID, x, y), scale });
const ZOOM: ZoomKey[] = [
  focus(1030, 591, 1, 0), // cely zaber (stred orezu)
  focus(1030, 591, 1, 300),
  focus(450, 625, 2.4, 1300), // hlavicka fotky: "Novostavba bytoveho domu SLNECNA 12" + STAVBA
  focus(450, 625, 2.4, 2700),
  focus(1310, 760, 1.5, 3700), // navrhnute hodnoty vpravo: Nazov projektu, Stavba
  focus(1310, 760, 1.5, F4_NAVRH_SECONDS * 1000),
];
const MARKS: Mark[] = [
  markAt(ID, 1.3, 2.7, 320, 578, 252, 72, { spot: true, pad: 6 }), // riadky na fotke: nazov stavby a STAVBA
  markAt(ID, 3.7, F4_NAVRH_SECONDS - 0.4, 822, 644, 980, 46, { outline: true }), // Hodnota: Novostavba bytoveho domu SLNECNA 12, BRATISLAVA
  markAt(ID, 3.9, F4_NAVRH_SECONDS - 0.4, 822, 914, 980, 46, { outline: true }), // Hodnota: Bytovy dom Slnecna 12, Bratislava
];

export const F4_Navrh: React.FC = () => (
  <DesktopFootageClip
    src="footage/f4-navrh.mp4"
    seconds={F4_NAVRH_SECONDS}
    steps={[
      { from: 0, title: 'Fotka identifikačnej strany' },
      { from: 3400, title: 'Navrhnuté údaje sa zhodujú' },
    ]}
    marks={MARKS}
    zoom={ZOOM}
    win={FOOTAGE_WINDOW_WIDE}
    panelLeft={1460}
    panelWidth={430}
  />
);
