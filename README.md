# Assetin Archives – explainer video

Krátke ilustračné video k službe **Assetin Archives** (digitálna katalogizácia
fyzicky archivovanej dokumentácie). Postavené na [Remotion](https://www.remotion.dev)
– každá scéna je React komponent, render do PNG (stills na schválenie) a MP4
(1920×1080, 30 fps, H.264) na poskladanie v strihovom softvéri.

Obsahová predloha: brožúra *Assetin Archives – Predstavenie služby* (12 strán).
Vizuálna predloha: animované dlaždice „Quick start“ na assetin.sk
(izometrický štýl, 5 sivých + brand zelená `#1F7A33`, Manrope + Inter).

Táto vetva je **samostatná (orphan)** – neobsahuje kód aplikácie ArchiveApp,
slúži len ako úložisko video projektu.

## Spustenie

```bash
npm install
npm run dev            # Remotion Studio (náhľad + timeline) na http://localhost:3000
npm run stills         # PNG stills všetkých scén do out/stills/ (2 na scénu: _a, _b)
npm run stills -- S05-Teren             # len vybraná scéna
npm run render         # MP4 všetkých scén do out/mp4/
npm run render -- S05-Teren S06-Spracovanie
PREVIEW=1 npm run render -- Full        # celé video v polovičnom rozlíšení do out/preview/
npm run typecheck
```

Na PC si Remotion pri prvom renderi stiahne vlastný headless Chrome. V prostredí
bez tejto možnosti sa dá použiť existujúci binár:
`REMOTION_CHROME=/cesta/k/chrome-headless-shell npm run render`.

## Štruktúra

```
src/
  Root.tsx            registrácia kompozícií (Scenes/*, Preview/Full)
  scenesList.ts       zoznam scén, dĺžky (s) a frame-y pre schvaľovacie stills
  theme.ts            paleta, fonty, rozmery, ms→frames
  copy/sk.ts          všetky texty v obraze (SK)
  lib/anim.ts         tween/pop/settle/stagger – prevod CSS transitions z webu na frame-y
  lib/iso.tsx         2:1 dimetrická projekcia + primitívy (IsoBox, Carton, Pallet, ShelfFrame, Binder, QR)
  lib/fonts.ts        načítanie lokálnych fontov z public/fonts
  components/
    ArchiveBox.tsx    doslovný port dlaždice „Neprehľadný archív“ (QuickStart.astro) – veko, zložky, QR
    Scene.tsx         obal scény (pozadie, pätka s logom, zelený pás), LogoMark
    Text.tsx          Kicker / Headline / Body / TextColumn v štýle brožúry
    Illustrations.tsx Person, QuestionMark, Check, Sheet, PriceTag, Chip, PhotoCard, Floor
  scenes/S00_…S12     jednotlivé scény, Full.tsx = všetky za sebou
public/brand/         logo (kópia z assetin.sk)
public/fonts/         Manrope 600/700/800, Inter 400/500/600 (TTF)
scripts/stills.sh, render.sh
out/stills/           schvaľovacie PNG (commitované)
out/mp4/              finálne MP4 scén (commitované po schválení)
```

## Ako pridať alebo upraviť scénu

1. Text do `src/copy/sk.ts`.
2. Komponent do `src/scenes/Sxx_Nazov.tsx` – časovanie v ms cez `tween(frame, startMs, durMs)`,
   dosadnutie cez `pop(frame, startMs)`, texty cez `settle(frame, startMs)`.
3. Zápis do `src/scenesList.ts` (ID iba `A-Za-z0-9-`, dĺžka v sekundách, dva frame-y pre stills).
4. `npm run stills -- <ID>` a skontrolovať PNG.

## Licencia Remotion

Remotion je zadarmo pre jednotlivcov a firmy do 3 zamestnancov (aj komerčne).
Väčšia firma potrebuje Company License – pozri LICENSE v balíku `remotion`.
