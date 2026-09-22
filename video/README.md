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
cd video          # projekt videa žije v priečinku video/ (aplikácia je v backend/ a frontend/)
npm install
npm run dev            # Remotion Studio (náhľad + timeline) na http://localhost:3000
npm run stills         # PNG stills všetkých klipov do out/stills/ (3 na klip) + kontrola caption zóny
npm run stills -- C4-Teren              # len vybraný klip
npm run render         # finálne MP4 všetkých klipov do out/mp4/ (bez textu v obraze; PNG medzisnímky, CRF 16)
                       # klipy F* (footage z aplikácie) potrebujú zdroj v public/footage/ – priečinok nie je v gite,
                       # originály sú u Samuela; bez nich render F1/Full padne
CAP=1 npm run render   # verzie s titulkami v obraze do out/mp4/cap/ (titulky sú zatiaľ vypnuté, doriešia sa neskôr)
node scripts/contact-sheet.mjs   # kontaktný hárok z posledných stills
npm run render -- C4-Teren C5-Spracovanie
PREVIEW=1 npm run render -- Full        # celé video v polovičnom rozlíšení do out/preview/
npm run typecheck
```

Na PC si Remotion pri prvom renderi stiahne vlastný headless Chrome. V prostredí
bez tejto možnosti sa dá použiť existujúci binár:
`REMOTION_CHROME=/cesta/k/chrome-headless-shell npm run render`.

## Štruktúra

```
src/
  Root.tsx            registrácia kompozícií (Clips/*, Footage/FootageFrame, Preview/Full, Optional/*)
  scenesList.ts       zoznam klipov, dĺžky (s) a frame-y pre schvaľovacie stills
  theme.ts            paleta, fonty, rozmery, ms→frames
  copy/sk.ts          všetky texty v obraze (SK)
  lib/anim.ts         tween/pop/settle/stagger – prevod CSS transitions z webu na frame-y
  lib/camera.tsx      Camera – nájazd/posun kamery podľa keyframov (ms, x, y, scale)
  lib/iso.tsx         2:1 dimetrická projekcia + primitívy (IsoBox, Carton, Pallet, ShelfFrame, Binder, QR)
  lib/fonts.ts        načítanie lokálnych fontov z public/fonts
  components/
    ArchiveBox.tsx    doslovný port dlaždice „Neprehľadný archív“ (QuickStart.astro) – veko, zložky, QR
    Scene.tsx         obal scény (pozadie), LogoMark, useCaptions (titulky len s prop captions:true)
    Device.tsx        PhoneFrame / WindowFrame – rámik zariadenia, fill 0..1 = nájazd na celý frame
    Text.tsx          Caption (jediný text v obraze) + Kicker/Headline/Body pre optional scény
    Illustrations.tsx Person, QuestionMark, Check, Sheet, PriceTag, Chip, PhotoCard, Floor
  scenes/C1_…C9       klipy, Full.tsx = všetky za sebou (tvrdé strihy), FootageFrame.tsx = footage v rámiku
  scenes/optional/    S04, S10 v starom layoute (mimo jadra)
public/brand/         logo (kópia z assetin.sk)
public/fonts/         Manrope 600/700/800, Inter 400/500/600 (TTF)
scripts/stills.sh, render.sh, check-stills.mjs (kontrola, že ilustrácia nesiaha do caption zóny)
out/stills/           schvaľovacie PNG (commitované)
out/mp4/              finálne MP4 scén (commitované po schválení)
```

## Mierka a bezpečné zóny

- 1 jednotka iso sveta = 1 cm. Rozmery objektov sú v `CM` (`src/theme.ts`): krabica 52×36×36,
  šanón 32×8×44, paleta 120×80×14, skriňa 100×45×200, A4 21×30, mobil 7×15 (v obraze ×1,4).
  Každý klip si zvolí jedno `PX_PER_CM`; 2D prvky (list, mobil) sa odvodzujú z neho, nie odhadom.
  Pri porte dlaždice `ArchiveBox` dáva prepočet `archiveBoxPxPerCm(size)`.
- `SAFE` (`src/theme.ts`): ilustrácia y 60–800, caption y 880. `npm run stills` skontroluje pás 830–860.
- QR kódy sú čierno-biele (`QrOnLeftFace`, `QrOnRightFace`, QR v `ArchiveBox` a `Sheet`); zelená patrí
  len dianiu okolo (rámik skenu, blesk, check, glow).

## Ako pridať alebo upraviť scénu

1. Text do `src/copy/sk.ts`.
2. Komponent do `src/scenes/Sxx_Nazov.tsx` – časovanie v ms cez `tween(frame, startMs, durMs)`,
   dosadnutie cez `pop(frame, startMs)`, texty cez `settle(frame, startMs)`.
3. Zápis do `src/scenesList.ts` (ID iba `A-Za-z0-9-`, dĺžka v sekundách, frame-y pre stills).
   Jediný text v obraze cez `<Caption>` a `captions` v `src/copy/sk.ts` (≤ 7 slov); predvolene vypnuté, zapne ich prop `captions: true`.
4. `npm run stills -- <ID>` a skontrolovať PNG.

## Review a feedback

Klipy sa prehliadajú na review stránke (odkaz v STORYBOARD.md). Pripomienky z nej sa archivujú
do `FEEDBACK.md` a zapracúvajú po kolách; po každom kole sa nahrajú nové MP4 ako assety stránky.

## Licencia Remotion

Remotion je zadarmo pre jednotlivcov a firmy do 3 zamestnancov (aj komerčne).
Väčšia firma potrebuje Company License – pozri LICENSE v balíku `remotion`.

## Verzie

- **Verzia 2 (aktuálna, 80 s)**: C2-Hladanie nahrádza C2-Kancelaria + C3-Sklad.
- **Verzia 1 (88,5 s)**: rendre v `out/mp4/v1/` a `out/stills/v1/`; scény ostávajú v `src/scenes/` (`V1_LIST` v `scenesList.ts`, `npm run stills`/`render` ich preskakujú).
