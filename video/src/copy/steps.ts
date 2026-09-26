/**
 * Texty krokov vpravo v obraze (Krok i / n, nazov, riadok). Cisty datovy
 * subor bez JSX a bez importov: citaju ho sceny aj `scripts/export-web.mjs`,
 * ktory ich prenasa na produktovu stranku assetin.sk. Zmena textu tu = zmena
 * vo videu aj na webe (po `npm run export:web` a synchronizacii webu).
 *
 * `from` = zaciatok kroku od zaciatku klipu. Jednotky su ako v scene, ktora
 * krok pouziva: F1 v sekundach, ostatne v ms.
 */
export type StepText = { from: number; title: string; line: string };

/** C5 - v sklade (ms). */
export const C5_STEPS: StepText[] = [
  { from: 900, title: 'Označiť', line: 'Každá položka dostane nálepku s QR kódom.' },
  { from: 4100, title: 'Odfotiť', line: 'Štítok sa odfotí mobilom priamo v sklade.' },
  { from: 5300, title: 'Zaevidovať', line: 'Fotka ide do aplikácie, položka dostane ID.' },
];

/** F1 - sken v appke (s). */
export const F1_STEPS: StepText[] = [
  { from: 0, title: 'Krabica KR_01', line: 'Naskenovaná krabica. Pridáva sa do nej zložka.' },
  { from: 1.5, title: 'Typ jednotky', line: 'Zložka pod krabicou KR_01.' },
  { from: 3.45, title: 'Priradiť QR', line: 'Kód sa prečíta z fotky štítku.' },
  { from: 5.57, title: 'Odfotiť štítok', line: 'Fotka je dôkaz. Appka z nej číta údaje.' },
  { from: 7.79, title: 'Skontrolovať a vytvoriť', line: 'Jednotka má ID a svoje miesto.' },
];

/** C7 - hierarchia (ms). */
export const C7_STEPS: StepText[] = [
  { from: 600, title: 'Miesto v hierarchii', line: 'Polica, krabica, zložka, dokument. Presne podľa reality.' },
  { from: 3300, title: 'Hotovo v teréne', line: 'QR kódy, fotky a hierarchia. Zvyšok je práca v aplikácii.' },
];

/** F2 - extrakcia metadat (ms). */
export const F2_STEPS: StepText[] = [
  { from: 0, title: 'Príloha čaká', line: 'Fotka štítku je pri zložke ZL_01, pripravená na extrakciu.' },
  { from: 2200, title: 'Extrahovať metadáta', line: 'Jeden klik. Údaje sa čítajú z fotky.' },
  { from: 5000, title: 'Spracúva sa', line: 'Aplikácia číta text z fotky a pripravuje návrh metadát na kontrolu.' },
];

/** F4 - kontrola metadat (ms). */
export const F4_STEPS: StepText[] = [
  { from: 0, title: 'Fotka je dôkaz', line: 'Každý návrh sa dá kedykoľvek overiť voči fotke štítku.' },
  { from: 2000, title: 'Správny návrh', line: 'Názov projektu prečítaný z fotky. Sedí, stačí potvrdiť.' },
  { from: 5700, title: 'Návrhy metadát', line: 'Aplikácia navrhla 25 hodnôt. Každú potvrdíte jedným klikom.' },
  { from: 9000, title: 'Oprava', line: 'Číslo zmeny nesedí. Hodnota sa opraví priamo v návrhu a potvrdí.' },
  { from: 14000, title: 'Odoslať', line: 'Až po kontrole človekom sú metadáta platné.' },
];

/** F3 - vyhladavanie (ms). */
export const F3_STEPS: StepText[] = [
  { from: 0, title: 'Hľadať', line: 'Stačí slovo. Napríklad „vodovod“.' },
  { from: 1600, title: 'Zhoda', line: 'Nájde zložku, v ktorej sa slovo vyskytuje: v názve, poznámke aj v texte prílohy.' },
  { from: 4300, title: 'Metadáta', line: 'Kľúče a hodnoty z fotky štítku, zhoda je zvýraznená.' },
  { from: 8100, title: 'QR kód', line: 'Z výsledku rovno k fyzickej zložke na polici.' },
];

/** Kroky podla ID klipu (rovnake ID ako v `scenesList.ts`). */
export const STEPS_BY_CLIP: Record<string, StepText[]> = {
  'C5-Teren': C5_STEPS,
  'F1-Sken': F1_STEPS,
  'C7-Hierarchia': C7_STEPS,
  'F2-Metadata': F2_STEPS,
  'F4-Kontrola': F4_STEPS,
  'F3-Vyhladavanie': F3_STEPS,
};
