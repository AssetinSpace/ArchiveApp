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
                       # originály sú u Samuela; bez nich render F1/Full padne (náhradný postup nižšie v časti Footage)
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
  copy/vo.json        scenár náhovoru: klip, čas vety (ms), text, nameraná dĺžka; z neho je zvuk aj titulky
  footage/cuts.json   zostrih desktop footage (segmenty zdroja, zrýchlenie, zmrazený obraz); lib/cuts.ts z neho počíta časy
  lib/anim.ts         tween/pop/settle/stagger – prevod CSS transitions z webu na frame-y
  lib/camera.tsx      Camera – nájazd/posun kamery podľa keyframov (ms, x, y, scale)
  lib/iso.tsx         2:1 dimetrická projekcia + primitívy (IsoBox, Carton, Pallet, ShelfFrame, Binder, QR)
  lib/fonts.ts        načítanie lokálnych fontov z public/fonts
  components/
    ArchiveBox.tsx    doslovný port dlaždice „Neprehľadný archív“ (QuickStart.astro) – veko, zložky, QR
    Scene.tsx         obal scény (pozadie), LogoMark, useCaptions (texty v obraze; C8 zapnuté, ostatné len s prop captions:true)
    Paced.tsx         obal klipu: pauzy (Freeze) bez prepisovania animácie, náhovor (public/vo/<klip>.wav), titulky
    Subtitles.tsx     titulky náhovoru z copy/vo.json (jeden riadok dole, y 926); prop subtitles:false ich vypne
    Device.tsx        PhoneFrame / WindowFrame – rámik zariadenia, fill 0..1 = nájazd na celý frame
    Text.tsx          Caption (jediný text v obraze) + Kicker/Headline/Body pre optional scény
    Illustrations.tsx Person, QuestionMark, Check, Sheet, PriceTag, Chip, PhotoCard, Floor
  scenes/C1_…C9       klipy, Full.tsx = všetky za sebou (tvrdé strihy), FootageFrame.tsx = footage v rámiku
  scenes/optional/    S04, S10 v starom layoute (mimo jadra)
public/brand/         logo (kópia z assetin.sk)
public/fonts/         Manrope 600/700/800, Inter 400/500/600 (TTF)
scripts/stills.sh, render.sh, check-stills.mjs (kontrola, že ilustrácia nesiaha do caption zóny)
scripts/vo.mjs        náhovor: espeak-ng (sk) po vetách -> public/vo/<klip>.wav, dopíše dĺžky do vo.json, hlási prekryvy
scripts/cut-footage.mjs  zostrih desktop footage z originálov podľa footage/cuts.json (ffmpeg z pip imageio-ffmpeg)
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

## Footage

`public/footage/` nie je v gite. Potrebné súbory: `f1-sken.mp4` (mobil, 884 × 1920), `f2-metadata.mp4`, `f4-review.mp4` a `f3-search.mp4` (desktop, 1520 × 882, zostrihy z `Extrakce_metadat_-_v1.mp4`, `Review_metadat_-_v2.mp4` a `Vyhladavanie_-_v3.mp4`, orez 1520:882:400:150). Postup zostrihu je vo FEEDBACK.md.

Zostrih desktop klipov (F2, F3, F4) je v `src/footage/cuts.json` a robí sa z originálov
`public/footage/src/{extrakce,review,vyhladavanie}.mp4` (mimo gitu): `node scripts/cut-footage.mjs`.
Mobilné footage F1 (`f1-sken.mp4`) v tomto prostredí nie je; klip beží ako `F1_SkenPatched`
(starší render `public/footage/f1-old.mp4` = out/mp4/F1-Sken.mp4 a nanovo kreslený panel vpravo).
Po nahratí `f1-sken.mp4` prepnúť v `scenesList.ts` späť na `F1_Sken`.

## Náhovor a titulky

Video je s hovoreným slovom (kolo 29). Scenár je v `src/copy/vo.json`: pre každý klip vety s časom
`at` (ms od začiatku klipu, vo výstupnom čase aj s pauzami). `node scripts/vo.mjs` vyrobí dočasný
hlas (espeak-ng, slovenčina, len na tempo) do `public/vo/<klip>.wav` (mimo gitu), zmeria dĺžky viet
a dopíše ich do `vo.json` (`dur`); z toho istého súboru bežia titulky. Kvalitný hlas: vety sa
vygenerujú inde (Google Cloud TTS sk-SK, ElevenLabs, alebo reálny speaker podľa `VOICEOVER.md`) do
`public/vo/lines/<klip>-<i>.wav` a spustí sa `node scripts/vo.mjs --reuse`. Render bez zvuku:
`--props='{"voice":false}'`, bez titulkov: `--props='{"subtitles":false}'` (prezentácia so živým komentárom).

Tempo: každý klip má v `scenesList.ts` pauzy (`holds`, zmrazený obraz hneď po nástupe textu kroku), vety
sa nesmú prekrývať (`vo.mjs` to hlási) a text v obraze je len názov kroku (2-3 slová); vetu hovorí náhovor.

## Verzie

- **Verzia 2 (aktuálna, kolo 29, ~125 s)**: C2-Hladanie nahrádza C2-Kancelaria + C3-Sklad; od kola 29 hovorené slovo + titulky, pauzy pred dejom.
- **Verzia 1 (88,5 s)**: rendre v `out/mp4/v1/` a `out/stills/v1/`; scény ostávajú v `src/scenes/` (`V1_LIST` v `scenesList.ts`, `npm run stills`/`render` ich preskakujú).
