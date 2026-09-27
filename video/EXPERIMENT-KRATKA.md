# Experiment: kratšie video pre LinkedIn (27. 9. 2026)

Vetva `claude/video-assets-archives-exp-la1hts`, vychádza z `main` (commit `ea5550e`, kolo 48).
Review stránka experimentu: https://claude.ai/artifact/Y6R9zZWRh7VNqCNk9dnjg3
(hlavná review stránka R2aK5Ms7zxVvtKM4SjHCJa ostala bez zmeny).

## Zadanie a rozhodnutia Samuela

- Zistiť, ako video zefektívniť, aby bolo kratšie, zrozumiteľné pre bežného laika a stále vysvetlilo všetko; posúdiť dĺžku.
- Nové vety tým istým hlasom smú byť. Cieľ je LinkedIn post, ktorý zaujme hneď, "možno ešte kratšie".
- Dĺžka: okolo 75 s a k tomu 30 s teaser. Ponuku (C8) nechal na mňa.
- Pôvodnú verziu nechytať, je to vstup. Hlas a hudbu negenerovať znova (existujúce nahrávky sa len strihajú).

## Rozbor pôvodnej verzie (kolo 48, 145,2 s)

- Hlas znie 112,8 zo 145,2 s (250 slov, 133 slov/min). Dĺžku určuje scenár, nie pauzy (skrátením páuz najviac ~15 s).
- Kam išiel čas: úvod a problém 28 s, predstavenie 7 s, ako to funguje 57 s (C5, F1, C6, F2, F4), databáza a hľadanie 25 s (C10, F3), ponuka a záver 29 s.
- "Spravíme to za vás" zaznie až v 1:57; Wistia radí dať podstatu do prvej polovice.
- Referencie k dĺžke: vysvetľujúce videá o produkte 60-90 s (~150 slov/min po anglicky), technický B2B produkt znesie 90-120 s.

## Výsledok

| Verzia | Dĺžka | Slov | Klipy |
|---|---|---|---|
| Pôvodná (kolo 48) | 145,2 s | 250 | C1 C2 C4 C5 F1 C6 F2 F4 C10 F3 C8 C9 |
| K, krátka | 73,9 s | 136 | K-C2 K-C4 K-C5 K-F1 K-F24 K-F3 K-C8 K-C9 |
| T, teaser | 31,0 s | 60 | T-C2 T-C4 T-C5 T-F3 T-C9 |
| K a T na výšku 4:5 (LinkedIn) | 73,6 s / 30,8 s | | kompozície K-LinkedIn, T-LinkedIn |

Filmy: `out/kratka/K_1080p.mp4`, `T_1080p.mp4`, `K-LinkedIn_1080p.mp4`, `T-LinkedIn_1080p.mp4` (+ `_preview_540p`), kontaktné hárky `out/kratka/K-contact-sheet.png`, `T-contact-sheet.png`.

### Čo sa zmenilo oproti pôvodnej verzii

- Bez intra C1: háčik (otázka) je prvý obraz aj prvá veta.
- C2 bez páuz a bez vety "Či už správu, výkres alebo protokol?" (10 s namiesto 13 s).
- C4: nová kratšia veta o cene, predel skôr (`d` 600 ms), značka s novou vetou "Predstavujeme vám Assetin Archives. Z vášho archívu urobíme prehľadný digitálny katalóg."
- C5 + F1: jedna nová veta "Na každú krabicu aj zložku nalepíme QR kód a mobilom odfotíme jej titulnú stranu."; F1 len skutočný fotoaparát (2,6 s, bez hlasu, bez obrazovky s textom z vývoja).
- C6, F2 a F4 nahradil jeden klip K-F24 (záznam review2): návrh údajov a kontrola človekom, bez montáže, opravy a odoslania; priblíženie 1,5x.
- C10 vypadlo; F3 len slovo, výsledok a cesta PL_01 / KR_01 / ZL_03 s vetou "Potom stačí napísať slovo a aplikácia ukáže, na ktorej polici a v ktorej krabici dokument leží.", priblíženie 1,5x.
- C8 jeden riadok (Služba na kľúč, Softvér), riadok Rozsah nasadenia vypadol; nová veta "Alebo ho spracujete sami v našej aplikácii."
- C9 s výzvou "Dohodnite si obhliadku" (v teaseri hovorí ponuku na kľúč namiesto sloganu).
- Kroky vpravo "V archíve" namiesto "V teréne".
- Hudba: tá istá `bed.wav`, vystrihnuté úseky na dobu (`src/copy/music_kratka.json`), nástup plnej kapely padne na značku.

### Test divákov (Gemini s videom a zvukom, laik a správca budov, orientačne)

| | Pôvodná | Krátka (3. kolo) | Teaser (2. kolo) |
|---|---|---|---|
| Nerozumeli | metadáta, fulltext, katalogizácia, hierarchia | v hlase ničomu; na obrazovke "Kľúče metadát", "OCR text"; pilot | slogan, pilot, pojmy v aplikácii |
| Strácali pozornosť | úvod 0:05-0:25, kontrola 1:05-1:28 | úvod do 0:18, kontrola 0:36-0:48 | statický zelený záver, úvod |
| Odporúčaná dĺžka | 60-90 / 60-75 s | do 45 / 40-45 s | 20-25 / 30 s |
| Chýbalo | cena, kontakt, výzva | cena, bezpečnosť, telefón, čas | telefón, cena, bezpečnosť |

Po 1. kole opravené: priblíženie aplikácie, obrazovka s textom z vývoja v F1, "V archíve", ponuka na kľúč v teaseri, kratšia značka v teaseri.
V 2. kole bola chyba zvuku v K od 0:33: tichý klip K-F1 dostal mono stopu medzi stereo klipmi a concat pokazil všetko za ním. Oprava v `mix-music.mjs` (ticho v rozložení kanálov ostatných klipov), overené prepisom a technickou kontrolou.

### Odporúčanie

Teaser do 30 s na reklamu, LinkedIn post okolo 45-60 s (4:5), krátka verzia 74 s na web a e-mail. Otvorené otázky pre Samuela sú na review stránke (časť o cene, obhliadka zadarmo, práca na mieste, telefón, slogan, pilot/skúška, ďalší krok).

## Ako to zopakovať

```bash
cd video && npm ci && pip install imageio-ffmpeg google-genai faster-whisper pillow numpy soundfile
export REMOTION_CHROME=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
python3 scripts/kratka_lines.py                    # vety so `src` vyrezané z public/vo/lines -> public/vo-kratka/lines
node scripts/vo.mjs --engine gemini --reuse --script src/copy/vo_kratka.json --dir public/vo-kratka   # nové vety len ak chýbajú
python3 scripts/vo_check.py --script src/copy/vo_kratka.json --dir public/vo-kratka K-C4-Cena-0 ...   # kontrola prepisom
node scripts/cut-footage.mjs k-f1-sken k-f24-review k-f3-search   # VŽDY s id, bez nich sa prerobí aj pôvodné footage
for id in K-C2-Hladanie K-C4-Cena K-C5-Teren K-F1-Sken K-F24-Aplikacia K-F3-Vyhladavanie K-C8-Ponuka K-C9-Outro \
          T-C2-Hladanie T-C4-Znacka T-C5-Teren T-F3-Vyhladavanie T-C9-Outro; do npx remotion render $id out/kratka/$id.mp4; done
node scripts/mix-music.mjs --list src/kratkaList.ts:K_LIST --clips out/kratka --out out/kratka/K_1080p.mp4 --cfg src/copy/music_kratka.json --variant K
node scripts/mix-music.mjs --list src/kratkaList.ts:T_LIST --clips out/kratka --out out/kratka/T_1080p.mp4 --cfg src/copy/music_kratka.json --variant T
npx remotion render K-LinkedIn out/kratka/K-LinkedIn_voice.mp4 --props='{"subtitles":false}'
node scripts/mix-music.mjs --video out/kratka/K-LinkedIn_voice.mp4 --out out/kratka/K-LinkedIn_1080p.mp4 --cfg src/copy/music_kratka.json --variant K
node scripts/kratka-stills.mjs                     # kontrolné stills do out/kratka/stills
```

## Súbory

- Nové: `src/kratkaList.ts` (K_LIST, T_LIST), `src/scenes/kratka/Kratka.tsx` (scény a varianty), `src/scenes/kratka/KratkaFull.tsx`, `src/scenes/kratka/LinkedIn.tsx` (4:5), `src/copy/vo_kratka.json`, `src/copy/music_kratka.json`, `scripts/kratka_lines.py`, `scripts/kratka-stills.mjs`, `review-kratka/index.html`, `public/vo-kratka/`, `public/footage/k-*.mp4`, `out/kratka/`.
- Zdieľané súbory dostali len voliteľné parametre s predvolenou hodnotou hlavnej verzie: `Paced` (`audio`), `Subtitles` (scenár K/T vedľa hlavného), `C4_Cena` (`d`, `h`), `C5_Teren` (`steps`, `phase`), `C8_Pilot` (export kariet), `C9_Outro` (`cta`), `F1_Sken` (`phase`), `F2_Metadata` (`zoom`), `cuts.json` (nové kľúče `k-*`), skripty `vo.mjs`, `vo_check.py` (`--script`, `--dir`) a `mix-music.mjs` (`--list`, `--clips`, `--out`, `--cfg`, `--variant`, `--video`).
- Kontrola: 20 snímok pôvodných klipov (C2, C4, C5, C8, C9, F1, F4) z commitu `ea5550e` a z tejto vetvy je na pixel rovnakých; dĺžky kompozícií bez zmeny.
- Jediná zmena správania pôvodnej cesty: `mix-music.mjs` dáva tichému klipu (C1) stopu v rozložení kanálov ostatných klipov (stereo namiesto mono). Zvuk je ticho, výsledok rovnaký.
