# Odovzdanie práce na videu (stav k 25. 9. 2026, kolo 31)

Tento súbor je pre novú session. Všetko dôležité je v gite na vetve `claude/progress-preview-vo1ocm`,
okrem zdrojových záznamov a vygenerovaného hlasu (tie sú mimo gitu, postup obnovy nižšie).

## Kde čo je

- Review stránka klipov (videá, pripomienky): https://claude.ai/artifact/R2aK5Ms7zxVvtKM4SjHCJa
  Pripomienky sa ukladajú do jej databázy (`ArtifactData`, kolekcia `feedback`); po zapracovaní sa mažú.
  Stránka sa publikuje zo súboru `review.html` v scratchpade session; ak chýba, stiahnuť cez
  `Artifact read` (url vyššie) a upraviť. Nové videá sa nahrávajú ako assety (`publish` s `asset: true`)
  a ich `/_blob/<id>` sa dopĺňajú do poľa `CLIPS` v HTML (`cap`, `poster`, `len`, `desc`).
- Dokument so scenárom náhovoru (tabuľka viet, pravidlá): https://claude.ai/code/artifact/4dda9745-5ee0-442b-8175-ff309c835dbc
- História kôl a rozhodnutí: `FEEDBACK.md` (kolo 1 až 31), storyboard `STORYBOARD.md`, návod `README.md`.
- Scenár náhovoru (jediný zdroj pravdy pre zvuk aj titulky): `src/copy/vo.json` (vety, `at` v ms, `say` = fonetický prepis, `_style`).
- Zostrih footage: `src/footage/cuts.json` (segmenty zdroja, zrýchlenie, zmrazený obraz, orez), `scripts/cut-footage.mjs`.
- Pauzy a poradie klipov: `src/scenesList.ts` (`paced(...)`: `holds`, `skip`, `vo`, `dark`, `subtitleLeft`).
- Hlas: `scripts/vo.mjs` (`--engine espeak|edge|piper|gemini`), `scripts/gemini_tts.py`.

## Obnova prostredia (nová session)

```bash
cd video && npm ci
pip install imageio-ffmpeg piper-tts google-genai edge-tts
apt-get install -y espeak-ng                       # len pre --engine espeak
mkdir -p /root/piper && cd /root/piper && \
  curl -sSLO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/sk/sk_SK/lili/medium/sk_SK-lili-medium.onnx && \
  curl -sSLO https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/sk/sk_SK/lili/medium/sk_SK-lili-medium.onnx.json
export REMOTION_CHROME=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
```

Zdrojové záznamy do `video/public/footage/src/` (mimo gitu) sú uložené ako assety review stránky;
stiahnuť cez `Artifact read` s `url` stránky a `path` = id:

| Súbor | Asset id | Poznámka |
|---|---|---|
| `src/sken-1.mp4` | `d8b402908c339502b82249631201aa37` | mobil F1, H.264 prevod pôvodného .mov (1206 x 2622, 60 fps, 10,5 s); druhá časť záznamu (Vytvoriť, nahrávanie) stále chýba |
| `src/extrakce.mp4` | `1aa84bb6286f29fd9a601c5dad7ce270` | desktop F2 (36 s) |
| `src/review2-30.mp4` | `7c14646acc6c3a9316d2711a0a944b17` | desktop F4, nový záznam z 25. 9. (70 s), prevod 30 fps; v `cuts.json` je `src/review2.mp4`, po stiahnutí premenovať alebo upraviť `src` |
| `src/search2.mp4` | `2c36ba26831c4f1d86ba1b899d94c988` | desktop F3, nový záznam z 25. 9. (19 s) |

Potom: `node scripts/cut-footage.mjs` (vyrobí `public/footage/f1-sken.mp4`, `f2-metadata.mp4`, `f3-search.mp4`, `f4-review.mp4`),
`node scripts/vo.mjs --engine piper` (hlas + dĺžky viet), `npm run stills`, `bash scripts/render.sh`.
Full sa lepí z klipov (C1 potrebuje tichú stopu, inak concat zahodí zvuk):

```bash
FF=$(python3 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())")
$FF -y -i out/mp4/C1-Intro.mp4 -f lavfi -i anullsrc=r=48000:cl=mono -shortest -c:v copy -c:a aac /tmp/C1-silent.mp4
# list.txt: /tmp/C1-silent.mp4, potom C2-Hladanie C4-Cena C5-Teren F1-Sken C7-Hierarchia C6-Spracovanie F2-Metadata F4-Kontrola F3-Vyhladavanie C8-Pilot C9-Outro (out/mp4/<ID>.mp4)
$FF -y -f concat -safe 0 -i list.txt -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 160k -ar 48000 out/mp4/Full_1080p.mp4
$FF -y -i out/mp4/Full_1080p.mp4 -vf scale=960:540 -c:v libx264 -crf 24 -pix_fmt yuv420p -c:a aac -b:a 96k out/mp4/Full_preview_540p.mp4
```

Sieť: povolené sú `huggingface.co` (Piper), `speech.platform.bing.com` (edge-tts; websocket ide cez `--proxy $HTTPS_PROXY`,
CA proxy treba pridať do certifi: `cat /root/.ccr/ca-bundle.crt >> $(python3 -c "import certifi;print(certifi.where())")`),
`generativelanguage.googleapis.com` (Gemini).

## Rozhodnutia, ktoré platia

- Video je s hovoreným slovom a titulkami (jedna veta dole, y 926). Text v obraze vpravo je len názov kroku
  (2-3 slová), a to kľúčové slová z vety, ktorá práve znie. Pred dejom pauza (zmrazený obraz).
- Oslovenie zmiešané, rozprávač uvedie problém a naše riešenie. Musí zaznieť "fotka je dôkaz" a to, že
  každý záznam potvrdí človek. "Assetin" s tvrdým t, "Archives" po anglicky, QR "kjúár".
- Hlas zatiaľ Piper Lili (Microsoft hlasy pôsobia ako AI). Cieľ: Gemini TTS, hlas "Velvet 1".
- C4: bez domčeka na bielom slide, bez popisu pod lockupom (vetu hovorí náhovor).
- F3: musí byť vidieť drobček PL_01 / KR_01 / ZL_03, automatické zvýraznenie zhody a QR dole.
- Poradie klipov: C1 · C2 · C4 · C5 · F1 · C7 · C6 · F2 · F4 · F3 · C8 · C9. Full má 134 s.

## Rozpracované: hlas cez Gemini TTS

1. Kľúč `GEMINI_API_KEY` je v nastaveniach prostredia (nová session ho má v env; nikdy ho nedávať do chatu ani do gitu).
2. Overiť API: `cd video && python3 scripts/gemini_tts.py --list-voices` (vypíše prompted hlasy, id `voice_...`).
3. Kontrola hlavičky: jednu vetu vygenerovať s `--header` aj bez a porovnať dĺžky; ak s hlavičkou trvá dlhšie,
   model číta "## Transcript:" nahlas a hlavička ostáva vypnutá (predvolené).
4. Pri Gemini neposielať fonetické prepisy (`say`), len čistý `text` (Gemini číta angličtinu a skratky sám);
   v `vo.mjs` je `say` použité pre všetky engine, treba pridať výnimku pre `gemini` (čaká na súhlas Samuela).
5. Model `gemini-3.8-flash-tts` je z exportu AI Studia; hlas "Velvet 1", temperature 0,85, štýl v
   `speech_metadata` (`vo.json` -> `_style`).
6. `node scripts/vo.mjs --engine gemini`, potom prepočítať `at` podľa nameraných dĺžok (skript hlási prekryvy),
   prípadne pauzy v `scenesList.ts` a `after` v `cuts.json`, render, Full, upload na review stránku, commit.

## Otvorené body

- Druhá časť mobilného záznamu F1 (Vytvoriť + nahrávanie) chýba, klip končí zmrazenou obrazovkou Skontrolovať jednotku.
- Nové desktop záznamy sú celoobrazovkové, orez 300:150 odreže titulok "Archív PD" vľavo; pri ďalšom nahrávaní užšie okno alebo 90 % zoom.
- Hudobný podmaz sa doplní až v strihu po schválení hlasu.
