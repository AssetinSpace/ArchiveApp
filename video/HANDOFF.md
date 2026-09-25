# Odovzdanie práce na videu (stav k 25. 9. 2026, kolo 33)

Tento súbor je pre novú session. Všetko dôležité je v gite na vetve `claude/progress-preview-vo1ocm`,
okrem zdrojových záznamov a vygenerovaného hlasu (tie sú mimo gitu, postup obnovy nižšie).

## Kde čo je

- Review stránka klipov (videá, pripomienky): https://claude.ai/artifact/R2aK5Ms7zxVvtKM4SjHCJa
  Zdroj stránky je v `review/index.html` (údaje v `BUILD`, `FULL`, `NEWS`, `CLIPS`; pri novom kole upraviť a publikovať
  cez `Artifact publish` s `url` stránky, capabilities `assets`, `db`, `comments`). Nové videá sa nahrávajú ako assety
  (`publish` s `asset: true`), ich id idú do `cap` / `poster`.
  Kolo 33: pripomienky chodia ako komentáre stránky. Kto má právo úprav, pošle ich tlačidlom priamo Claudovi (session
  sledujúca stránku sa zobudí), ostatní pridajú bežný komentár a Claudovi ho pošle Samuel. Postup po prijatí: odpovedať
  vo vlákne, nastaviť stav v databáze (`ArtifactData` set `status/current`: `state` idle / working / rendering, `title`,
  `note`, `updatedAt`), zapracovať, prerenderovať, nahrať, zmeniť `BUILD.renderedAt` a `NEWS`, publikovať, vlákno
  vyriešiť (resolve), stav vrátiť na idle, zapísať kolo do FEEDBACK.md. Protichodné pripomienky nerozhodovať, pýtať sa Samuela.
  Staršie pripomienky (kolo 31 až 33) boli v kolekcii `feedback`; formulár na ňu už stránka nemá.
  Kolo 34: "Poslať Claudovi" sa v niektorých zobrazeniach (napr. mobilná appka) neponúka, preto beží hodinová Routine
  "Review video: nove komentare" (trig_01Mzmtn7iXgoggmkm6SN2wXu), ktorá číta komentáre a spracuje nové; spracované
  vlákna sú v kolekcii `processed` (doc_id = thread id). V novej session Routine zmazať alebo presmerovať (viaže sa na túto session).
- Dokument so scenárom náhovoru (tabuľka viet, pravidlá): https://claude.ai/code/artifact/4dda9745-5ee0-442b-8175-ff309c835dbc
- História kôl a rozhodnutí: `FEEDBACK.md` (kolo 1 až 33), storyboard `STORYBOARD.md`, návod `README.md`.
- Scenár náhovoru (jediný zdroj pravdy pre zvuk aj titulky): `src/copy/vo.json` (záznam = jedno generovanie hlasu, `at` v ms, `parts` = titulky po častiach, `partAt` a `dur` dopĺňa skript, `say` = fonetický prepis len pre Piper/edge/espeak, `_style`).
- Zostrih footage: `src/footage/cuts.json` (segmenty zdroja, zrýchlenie, zmrazený obraz len na pokojnej obrazovke, `fade` = prelínačka, orez), `scripts/cut-footage.mjs` (meria výsledok a hlási odchýlku).
- Pauzy a poradie klipov: `src/scenesList.ts` (`paced(...)`: `holds`, `skip`, `vo`, `dark`, `subtitleLeft`).
- Hlas: `scripts/vo.mjs` (`--engine espeak|edge|piper|gemini`), `scripts/gemini_tts.py`, kontrola `scripts/vo_check.py`, časy slov `scripts/vo_words.py`.

## Obnova prostredia (nová session)

```bash
cd video && npm ci
pip install imageio-ffmpeg piper-tts google-genai edge-tts faster-whisper pillow
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

Overené v kole 32: assety sa sťahujú cez `Artifact read` s `path` = id (jeden súbor na volanie, nie `paths`),
po `cut-footage` (kolo 33) majú zostrihy F1 14,7 s, F2 8,2 s, F3 24,0 s, F4 18,6 s; skript hlási, ak nameraná dĺžka nesedí s tabuľkou.

Potom: `node scripts/cut-footage.mjs` (vyrobí `public/footage/f1-sken.mp4`, `f2-metadata.mp4`, `f3-search.mp4`, `f4-review.mp4`),
`node scripts/vo.mjs --engine gemini --reuse` (hlas, dĺžky, časti titulkov; `--reuse` vezme vety z `public/vo/lines`, bez neho sa generujú znova; nahrávky sú mimo gitu, v novej session ich treba vygenerovať, ~20 generovaní), `npm run stills`, `bash scripts/render.sh`.
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
- Hlas: Gemini TTS "Velvet 1" (`voice_7ws1j8pd39cu`) od kola 32, štýl B od kola 33 (plynulý, svižnejší); Piper Lili ostáva ako záloha (`--engine piper`).
- Plynulosť (kolo 33): veta sa nikdy negeneruje po kúskoch; pauzy (`holds`) len v pokoji, `Paced` ich plynulo nabieha a dobieha; vo footage sa nezmrazuje prechodová snímka ani živý náhľad, medzi strihmi `fade`.
- Názov kroku vpravo sa prepína podľa hlasu (`voAt`), zvýraznenia: zelená = potvrdenie, jantárová = oprava, rámik = fotka.
- F3 a F4 (nové záznamy, iný zoom) majú orez 1764 × 882 a širšie okno `FOOTAGE_WINDOW_WIDE`; F2 (starý záznam) ostáva v pôvodnom okne.
- C4: bez domčeka na bielom slide, bez popisu pod lockupom (vetu hovorí náhovor).
- F3: musí byť vidieť drobček PL_01 / KR_01 / ZL_03, automatické zvýraznenie zhody a QR dole.
- Poradie klipov: C1 · C2 · C4 · C5 · F1 · C7 · C6 · F2 · F4 · F3 · C8 · C9. Full má 144,7 s (kolo 33).

## Hlas cez Gemini TTS (kolo 32, 33)

- Kľúč vkladá proxy prostredia (`generativelanguage.googleapis.com`), `GEMINI_API_KEY` v env byť nemusí. Nikdy ho nedávať do chatu ani do gitu.
- `python3 scripts/gemini_tts.py --list-voices`: "Velvet 1" je v účte päťkrát, používa sa `voice_7ws1j8pd39cu` (natvrdo vo `vo.mjs`, iný cez `--voice`).
- Kvóta 10 požiadaviek za minútu (skript pri 429 čaká) a 100 za deň na model (potom treba čakať do obnovenia). Celý náhovor (20 generovaní) trvá asi 3 minúty.
- C9 je v kole 33 ešte z kola 32 (vystrihnutá zo stopy, starší štýl); po obnovení kvóty zmazať `public/vo/lines/C9-Outro-0.wav` a spustiť `vo.mjs --engine gemini --reuse`.
- Gemini dostáva čistý `text` (bez `say`); výslovnosť QR, PL_01 a pod. rieši anglický pokyn v `_style`. Pri temperature 0,85 sa výsledok medzi pokusmi mení, preto po generovaní: `python3 scripts/vo_check.py --regen 5` (prepis cez `gemini-3.8-flash`, kontrola hlavičky, QR, kódov a zhody slov, zlé vety pregeneruje).
- Časti titulkov (`partAt`) určuje `vo.mjs` z časov slov (`scripts/vo_words.py`, faster-whisper small, cache `<veta>.words.json`); bez neho podľa páuz v nahrávke.
- Hlavička "## Transcript:" vypnutá, model ju občas prečíta nahlas.
- Vety majú asi 0,25 s ticha na začiatku a 0,35 s na konci; medzera medzi vetami aspoň 150 ms (skript hlási prekryvy).

## Otvorené body

- Schválenie plynulosti a nových textov (kolo 33).

- Druhá časť mobilného záznamu F1 (Vytvoriť + nahrávanie) chýba, klip končí zmrazenou obrazovkou Skontrolovať jednotku.
- Nové desktop záznamy sú celoobrazovkové, orez 300:150 odreže titulok "Archív PD" vľavo; pri ďalšom nahrávaní užšie okno alebo 90 % zoom.
- Hudobný podmaz sa doplní až v strihu po schválení hlasu.
