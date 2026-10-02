# Experiment: kratšie video pre LinkedIn (27. 9. 2026)

Vetva `claude/video-assets-archives-exp-la1hts`, vychádza z `main` (commit `ea5550e`, kolo 48).
Review stránka experimentu: https://claude.ai/artifact/Y6R9zZWRh7VNqCNk9dnjg3
(hlavná review stránka R2aK5Ms7zxVvtKM4SjHCJa ostala bez zmeny).

## Zadanie a rozhodnutia Samuela

- Zistiť, ako video zefektívniť, aby bolo kratšie, zrozumiteľné pre bežného laika a stále vysvetlilo všetko; posúdiť dĺžku.
- Nové vety tým istým hlasom smú byť. Cieľ je LinkedIn post, ktorý zaujme hneď, "možno ešte kratšie".
- Dĺžka: okolo 75 s a k tomu 30 s teaser. Ponuku (C8) nechal na mňa.
- Pôvodnú verziu nechytať, je to vstup. Hlas a hudbu negenerovať znova (existujúce nahrávky sa len strihajú).

## Kde sme skončili (2. 10. 2026, kolo 34)

- Dve hotové videá, obe LinkedIn 4:5 (1080 x 1350), obe sa renderujú z toho istého projektu:
  - `video/out/kratka/K-LinkedIn_1080p.mp4` (76,8 s, kolo 31, kompozícia `K-LinkedIn`): plná krátka verzia, od kola 31 bez zmeny.
  - `video/out/kratka/K-LinkedIn-46_1080p.mp4` (52,2 s, kolo 34, kompozícia `K-LinkedIn-46`): krátka verzia pre LinkedIn
    s háčikom "Naskenovať celý archív je drahé..." hneď po logu, jedna vec naraz v aplikácii a hľadaní, výsledok ako tri body;
    podrobnosti v kole 34 nižšie. Kolá 32 (55,7 s) a 33 (50,5 s) sú v `out/kratka/verzie/`.
    Náhľady `*_preview_540p.mp4` vedľa. Staršie kolá 14 až 30 sú v `out/kratka/verzie/`. Pôvodná dlhá verzia (145 s, 16:9) sa nemenila.
- Zdroj: kompozície `K-LinkedIn` a `K-LinkedIn-46` (zoznam klipov `LI_LIST_46` na konci súboru) v `src/scenes/kratka/LinkedIn.tsx` (spoločné dáta `Kratka.tsx`, klipy `src/kratkaList.ts`),
  scenár `src/copy/vo_kratka.json`, hlas `public/vo-kratka/`, hudba `src/copy/music_kratka.json` (variant `K`: hudba
  z kola 15 poskladaná na mriežke 105 BPM, bez iskier na začiatku), logá z `podklady/archives-logo-final/` cez
  `scripts/archives_logo.py`. Render a mix: časť "Ako to zopakovať" nižšie.
- Obsah: kancelária a sklad (každá na vlastnej plošine s rohom hore aj dole, police v sklade ďalej od okraja), most "S nami ho nájdete za pár sekúnd.",
  dvojriadkové logo s pilulkou "Prvé dokumenty zadarmo a nezáväzne", QR a fotka dokumentu, aplikácia prečíta text
  a človek overí, hľadanie "kľúčového slova" s cestou k položke, ponuka (Spracovanie archívu, Technické riešenie, Prvý
  krok "Začnime jednou krabicou, zadarmo a nezáväzne."), zelený záver s logom, sloganom a webom. V pravom dolnom rohu je
  počas celého videa logo s ARCHIVES.
- Otvorené otázky (aj na review stránke v časti Rozhodnutia a otázky):
  - Veta v 0:42 "Človek každú hodnotu overí a prípadne opraví alebo potvrdí.": pripomienka zameniť "človek" za
    "pracovník". Posudok: nechať "človek" (kontrast so strojom, ktorý navrhne údaje; sedí na službu na kľúč aj na
    spracovanie vlastnými silami), ale dať ho na koniec vety, kde je v slovenčine dôraz: "Každú hodnotu overí človek
    a prípadne ju opraví alebo potvrdí." Takto nezaznie neurčité "človek si musí". "Pracovník" stráca kontrast so strojom,
    znie ako práca navyše a otvára otázku, čí pracovník; "používateľ" znie technicky, "odborník" sedí len na službu.
    Zmena znamená novú nahrávku jednej vety rovnakým hlasom a zladenie zeleného potvrdenia so slovom "potvrdí".
  - Druhý nadpis ponuky "Technické riešenie", alebo presne "Technická špecifikácia".
  - Pilulka pod logom v 0:12 (testerom pôsobí predčasne), priamy kontakt pri výzve (telefón alebo e-mail), verzia do
    minúty (návrh 59,8 s nižšie), logo vpravo dole a ovládanie videa na LinkedIn (overiť skúšobným príspevkom).
  - Krabica alebo box: posúdené v kole 24, odporúčanie nechať "krabica".
- Gemini API (hlas aj hudba) naposledy vracalo 402, vyčerpaný predplatený kredit; nové vety čakajú na jeho dobitie.
- Review stránka experimentu (odkaz hore) je súkromná, ostatní ju uvidia, až keď ju vlastník zdieľa cez Share.

## Kolo 34 (1. až 2. 10. 2026): háčik "neskenujte všetko", vyvážený dej bez zvuku

Samuel (ku kolu 33, pozerané bez zvuku): niekde je toho strašne veľa, niekde málo a nič to nevypovedá, nevyvážený dej,
napríklad na konci dve fázy; na začiatok dať háčik v štýle "všetko naskenovať je drahé, my fotíme len identifikačnú stranu
k tvorbe katalógu a potom druhá fáza iba kde treba"; posúdiť a naplánovať, simulovať našu cieľovku, čo jej chýba.

- Meranie obrazu kola 33 (pohyb medzi snímkami a podiel obsahu, 4 snímky za sekundu): prázdne 0:10 až 0:14 (logo, obsah 5 až
  10 % plochy), 0:15 až 0:19 (začiatok QR scény), 0:37 až 0:43 (karty fáz, 7 %, nulový pohyb), 0:45 až 0:47; preplnené 0:22 až
  0:26 (okno aplikácie + karta + titulok, 38 až 50 %) a 0:33 až 0:35 (výsledok hľadania + karta).
- Simulované publikum (Gemini s videom, bez zvuku aj so zvukom; správca budov, majiteľ stavebnej firmy, laik): bez zvuku správca
  pochopil QR a "systém povie policu a krabicu", odišiel by v 0:25 pri drobnom okne aplikácie, chýba mu "kto to nafotí, ja alebo
  vy"; majiteľ pochopil medzikrok pred drahou digitalizáciou, odišiel by v 0:09 až 0:12 (statické logo pôsobí ako koniec videa),
  chýba mu argument "neskenujte všetko"; laik odíde v 0:03 (nie je cieľovka). So zvukom obom chýba dôvod, prečo fotiť len titulnú
  stranu (má zaznieť do 0:20); dve fázy im so zvukom sedia, bez zvuku sú to dva nečitateľné bloky textu. Rozhodnuté: háčik s tromi
  vetami vrátane druhej fázy, krátky logo záber ostáva, záver tri body + výzva, jedna vec naraz, pod výzvou "Na kľúč, alebo
  vlastnými silami".
- Hlas: 3 nové vety Gemini (prepis bez chýb, klesavá intonácia na konci overená meraním výšky hlasu 120 až 138 Hz proti stredu
  148 až 184 Hz): "Naskenovať celý archív je drahé." (2,6 s), "My odfotíme len jednu stranu z každého dokumentu a vznikne katalóg."
  (4,5 s), "Skenuje sa až to, čo naozaj potrebujete." (3,1 s). Most "S nami ho nájdete za pár sekúnd." vypadol (háčik ho nahrádza),
  K46-C4-Cena má len "Predstavujeme vám Assetin Archives.", K46-Fazy nahradil K46-Vysledok (len prvá veta, druhá je v háčiku).
  Spolu 13 viet, 74 slov. Časy slov cez faster-whisper.
- Obraz (začiatky vo filme): C2 0:00 (8,17 s): kratšia chôdza v sklade (štart 0,5 ako v kole 10, 1,05 s namiesto 1,75; `c2Geo(p0)`),
  "V skrini?" 3,9 s, "V sklade?" 5,2 s, "Hľadanie môže trvať hodiny." 6,37 s, návrat zložiek 1,25x. C4 0:08,2 (3,9 s): zelený prechod,
  logo, veta od 0,6 s, logo odíde 0,4 s po vete, bez pilulky (`C4TopBase` `pill`), klip končí na bielej. Háčik 0:12,1 (11,05 s, nová
  scéna `LI_Hook`): stoh listov a cenovka "€€€" pri "drahé"; vrchný list sa zdvihne doľava, zelený rámik a blesk pri "stranu", stoh
  zbledne, karta ZL_03 s cestou pri "vznikne katalóg"; tri dokumenty pod kartou, pri "až to" sa jeden zvýrazní so "Skenovať", ostatné
  zblednú, fajka pri "potrebujete"; nadpisy Skenovať všetko je drahé / Len jedna strana z dokumentu / Skenovať len vybrané. C5 0:22,7
  (6,84 s, prelínačka z háčika 400 ms) ako kolo 33. F1 (skutočný záznam fotenia) vypadol: fotenie ukazuje háčik aj C5, F24 sa prelinie
  z mobilu. F24 0:29,2 (5,4 s): pri "a človek" okno zbledne (opacity 0,15, `LiFootage` `dimAt`) a karta Názov projektu sa vysunie
  na jeho miesto (`Panel` `lift`), pri "potvrdí" zozelenie s fajkou; klik v okne už nie je. F3 0:34,2 (7,8 s): pri "údaje o konkrétnej
  položke" okno zbledne a karta ZL_03 sa vysunie, pri "aj cestu k nej" ju nahradí cesta; zostrih `k46-f3-search` drží 4,25 s (hlas končí v 7,55 s), zmrazený úvod 0,2 s.
  Výsledok 0:41,5 (4,95 s, `LI_Vysledok`): tri riadky s fajkou pri slovách čo / kde / skartovať. C8 0:45,9 (4,4 s): pod pilulkou
  "Na kľúč, alebo vlastnými silami" (`C8FirstStep` `who`). C9 0:50,3 (1,8 s). Film 52,07 s (1562 snímok).
- Dĺžka: háčik má 10,2 s reči (tri vety), preto film vyšiel 52,1 s, nie 50; vzaté bolo F1 (1,4 s), dobeh hľadania (0,8 s), koniec
  ponuky a záveru (0,4 s), kratšia chôdza (0,7 s), rýchlejší návrat zložiek (0,2 s). Ďalšie rezervy: kratšia druhá veta háčika
  (nová nahrávka bez "z každého dokumentu", asi 1,2 s), mobil v C5 1,6x (0,5 s), logo záber bez vety (2 s).
- Hudba (variant `K46` prepočítaný): úvod 3,25 taktu s delay 0,209 s, nástup kapely 0,25 s pred zeleným prechodom (7,93 s), groove 16
  taktov 0 až 15 (bicie od taktu 12 pod vyhľadávaním, 36,4 s), tempo 0,9623, pokojná časť (takt 44) na začiatku prelínačky do ponuky
  (45,93 s, strih 45,87 s), takt 50 a akord (51) v 50,68 s na záverečnom logu (50,27 s).
- Kontroly: stills v 25 časoch (háčik tri obrazy, logo bez pilulky, karty cez zbledené okno, výsledok, výzva) bez kolízií;
  prepis mixu cez Gemini zachytí všetkých 16 viet celých (prvý mix mal zostrih F3 7,0 s a vetu "aj cestu k nej" odsekol, preto
  zostrih drží 4,25 s a logo a chvost F24 sú kratšie), hlas zrozumiteľný, hudba bez skokov (pri druhom počúvaní Gemini hlásil skok
  v 0:26, tam je však groove taktov 0 až 15 bez strihu, je to bubnový prechod skladby). Meranie obrazu: obsah pod 6 % plochy len v
  0:09 až 0:12 (logo) a 0:40 až 0:43 (nástup troch bodov), nad 40 % len 0:30 až 0:31 (okno aplikácie); 0:15 až 0:19 a 0:37 až 0:43 z
  kola 33 sú zaplnené. Simulované publikum (správca budov, majiteľ firmy): so zvukom obaja dopozerajú do konca, dôvod "len jedna
  strana" pochopia obaja aj bez zvuku (titulky háčika, cenovka), "kto to urobí" vedia až z riadku pod výzvou (0:48) a chceli by to
  skôr; bez zvuku správca odchádza v 0:31 (drobné polia okna aplikácie), majiteľ v 0:04 (úvod vyzerá ako HR video, chcel by hneď
  číslo o nákladoch na sklad); obom je logo pridlhé (4 s), priveľa: QR scéna 0:22 až 0:26 a hľadanie 0:35 až 0:41, tri body fádne.
  -16,3 LUFS, true peak -1,4 dBFS. K-LinkedIn má stále 2302 snímok.
- Kolo 33 je uložené v `out/kratka/verzie/K-LinkedIn-46_kolo33_50s_*.mp4` a v commite `63756e0`.

## Kolo 33 (1. 10. 2026): 50 s s pripomienkami (úvod, QR bez vymenovania, len titulná strana, dve fázy)

Samuel (ku kolu 32): 55 s je veľa; v úvode hlas hovorí málo, hoci miesta je dosť, dať tam "V skrini? V sklade?"
(v kancelárii majú v skriniach neporiadok); pri 0:26 netreba vymenúvať položky, QR je vidieť; musí zaznieť, že sa fotí len
titulná (identifikačná) strana, preto je katalogizácia rýchlejšia; potom fotka -> aplikácia vyčíta údaje -> je jasné, kde to je
a čo to je a dá sa s tým ďalej pracovať; podľa produktovej stránky Archives (assetin.sk, vetva `claude/asset-archives-page-agmnzi`,
`src/i18n/archives.ts`, sekcia `levels`) dve fázy: rýchla katalogizácia (kde to je, čo to je, metadáta napr. skartovať alebo
uchovať) a až potom skenovanie vybraných dokumentov s fulltextom; cieľ 45 až 50 s. Rozhodnuté v chate: nové vety tým istým
hlasom sú v poriadku, 48 až 50 s stačí, "V skrini? V sklade?", veta o fázach s "ako s tým ďalej naložiť, skartovať alebo uchovať".

- Hlas: 7 nových viet Gemini TTS (Velvet 1, prepis bez chýb; otázky majú stúpavú intonáciu (výška hlasu na konci 214 a 245 Hz
  proti 130 Hz pri oznamovacích vetách), "Odfotí sa len titulná strana." na druhý pokus): "V skrini?", "V sklade?" (počas chôdze
  v sklade, kde v K bola veta o sklade), "Každá položka dostane QR kód.", "Odfotí sa len titulná strana." (pri príchode mobilu),
  "Aplikácia z fotky sama vyčíta údaje a človek ich len potvrdí." (potvrdenie človekom je znova v hlase), "Viete, čo máte, kde to
  je a čo skartovať alebo uchovať." a "Skenuje sa až to, čo naozaj potrebujete." (nová scéna Dve fázy). "Predstavujeme vám Assetin
  Archives." je vystrihnuté z `K-C4-Cena-1.wav` (0 až 2,55 s, hranica vety podľa `words.json`), veta o katalógu vypadla (katalóg
  nesie karta Katalogizácia). Ostatné vety sú kópie ako v kole 32. Spolu 12 viet, 61 slov. Časy slov nových viet cez
  faster-whisper (`scripts/vo_words.py`).
- Obraz (začiatky vo filme): C2 0:00 (8,87 s) bez zmeny obrazu, otázky v 4,3 a 5,6 s. C4 0:08,9 (6,65 s): logo odíde 0,3 s po
  vete (`K_C4_H46` 2350, `c4BrandOut(h)`), pilulka ostáva, bez ikon archív -> katalóg (`C4TopBase` s `promise`). C5 0:15,5
  (6,84 s): scéna od 300 ms bez páuz, od 4000 ms (zložka, mobil, blesk, nájazd) 1,4x cez mapu času (`C5_46_MAP`, `Freeze`),
  ikony polica / krabica / šanón / zložka naraz pri "Každá položka", nálepky QR pri slove "kód", odídu pri vete o titulnej
  strane; nadpisy Prilepiť QR kód / Odfotiť len titulnú stranu. F1 0:22,3 (1,4 s). F24 0:23,3 (5,63 s): nový zostrih
  `k46-f24-review` (pokoj na fotke 2,4 s, lupa 1,6x, prijatie hneď), výrezy podľa slov "údaje" a "potvrdí", klik 0,3 s po
  "potvrdí", nadpisy Prečítať text / Návrh údajov / Človek potvrdí. F3 0:29,0 (7,8 s): zostrih `k46-f3-search` (karta a cesta
  o 1,3 s kratšie; `f3Marks(clip, seconds)`, `LI_F3Base`). Dve fázy 0:36,3 (8,25 s, `LI_Fazy`, `PhaseCard`): karta
  Katalogizácia ("Viete, čo máte, kde to je a čo skartovať alebo uchovať.") so zeleným okrajom počas prvej vety, karta
  Digitalizácia ("Skenujú sa len vybrané dokumenty, s fulltextovým vyhľadávaním.") príde 0,7 s pred druhou vetou; prelínačka
  z F3 aj do ponuky. C8 0:44,0 (4,4 s, koniec 0,2 s po vete). C9 0:48,4 (2,0 s). Film 50,43 s (1512 snímok).
- Hudba (variant `K46` v `music_kratka.json` prepísaný): úvod 3,25 taktu s delay 1,37 s, nástup kapely 0,3 s pred zeleným
  prechodom (8,57 s), groove 16 taktov 0 až 15 (bicie od taktu 12 pod scénou Dve fázy, 35,1 s), tempo 1,032 (+3,2 %),
  pokojná časť (takt 44) na začiatku prelínačky do ponuky (44,0 s), takt 50 a záverečný akord (takt 51) v 48,43 s na
  záverečnom logu. Skoky 15 -> 44 (podobnosť 0,954) a 44 -> 50 (0,966).
- Kontroly: stills v 20 časoch bez kolízií; film 50,5 s (s hudbou), -16,1 LUFS, true peak -1,3 dBFS; hlas bez prekryvov viet, typecheck bez chýb,
  kompozícia K-LinkedIn stále 2302 snímok. Prepis finálneho mixu cez Gemini zachytí všetkých 12 viet v poradí a čase
  (0:00, 0:04, 0:05, 0:07, 0:09, 0:11, 0:15, 0:19, 0:24, 0:29, 0:37, 0:41, 0:44, 0:48), hlas podľa neho čisto zrozumiteľný,
  hudba bez počuteľných skokov, lupnutí a náhlych zmien.
- Kolo 32 je uložené v `out/kratka/verzie/K-LinkedIn-46_kolo32_56s_*.mp4` a v commite `aecc5b7`.

## Kolo 32 (1. 10. 2026): verzia okolo 46 s z existujúcich nahrávok (K-LinkedIn-46)

Samuel: pre LinkedIn skôr okolo 40 s, aby to algoritmus zachytil a video sa jasne odprezentovalo; žiadne nové nahrávky,
zredukovať to, čo už vo videu je; 46 s je prijateľných; v obraze má ostať, že cieľom je digitálny katalóg, a aspoň ukázať
potvrdenie človekom. Text príspevku zatiaľ nepísať, pilulka pri logu ostáva, hudba ostáva, pomer strán podľa toho, čo je
pre LinkedIn najlepšie (posúdenie: ostáva 4:5, zobrazí sa celé vo feede na mobile aj na počítači; 9:16 by znamenalo nové
rozloženie každej scény).

- Nová kompozícia `K-LinkedIn-46` (`LI_LIST_46` v `LinkedIn.tsx`, `Root.tsx`), 77 s verzia `K-LinkedIn` sa nemení (2302
  snímok ako doteraz). Spoločné časti sú vyňaté do parametrov: mapa času skladu `c2Plan(backAt, endMs)`, `c4ShiftFor(c2Seconds)`,
  `C5HierarchyBase` (klip a čas odchodu ikon), `LI_F24Base` (zostrih, výrezy, kliky), `C8FirstStep` (slide Prvý krok),
  `filmOf(list)`. `scripts/kratka-stills.mjs --comp K-LinkedIn-46` renderuje stills druhej kompozície.
- Hlas: klipy `K46-*` v `src/copy/vo_kratka.json`, každá veta je kópia existujúcej vety (súbory `public/vo-kratka/lines/K46-*.wav`
  skopírované aj s `words.json`, `src` v scenári ukazuje na pôvodný súbor). Klipy `K-C4-Cena`, `K-F3-Vyhladavanie` a `K-C9-Outro`
  sa použili priamo. Vypadli: "V sklade, na polici, v krabici alebo v zložke." (sklad ostáva obrazom), "Mobilom potom odfotíme
  titulnú stranu dokumentu.", "Človek každú hodnotu overí a prípadne opraví alebo potvrdí.", "Archív vám spracujeme na kľúč.",
  "Alebo ho spracujete sami v našej aplikácii." a veta o bezpečnosti a infraštruktúre (slidy Spracovanie archívu a Technické
  riešenie). Ostalo 10 viet, 77 slov (predtým 16 viet, 139 slov).
- Obraz po klipoch (začiatky vo filme): C2 0:00 (8,87 s): otázka, prestrih do skladu, chôdza, krabice sa otvoria a hneď
  "Hľadanie môže trvať hodiny." (veta 100 ms pred zdvihnutím zložiek, návrat zložiek 100 ms po ňom; pozor, komentár v kóde
  uvádzal chôdzu ~1,05 s, skutočná je 1,74 s, zložky sú hore v 7,16 s klipu). C4 0:08,9 (9,15 s) bez zmeny: most, logo,
  pilulka, "Z vášho archívu urobíme prehľadný digitálny katalóg." s ikonami archív -> katalóg. C5 0:18,0 (9,8 s): veta o QR,
  pauza po poslednej nálepke len 0,7 s (predtým 4,15 s), zložka a mobil prídu počas "podľa toho, ako máte archív usporiadaný",
  ikony polica / krabica / šanón / zložka odídu 0,4 s pred koncom vety (skôr, než mobil narastie na celý rámec). F1 0:27,8
  (2,0 s, záznam drží posledný záber). F24 0:29,4 (10,35 s): "Aplikácia z fotky sama prečíta text...", potom bez hlasu nadpis
  kroku "Overiť a potvrdiť", lupa nad fotkou, klik na prijatie a zelená karta s fajkou; nový zostrih `k46-f24-review`
  (`cuts.json`, pokoj na fotke 4,2 s namiesto 6,6 s). F3 0:39,8 (9,1 s) bez zmeny. C8 0:48,4 (4,8 s): len slide Prvý krok
  s výzvou "Začnime jednou krabicou, zadarmo a nezáväzne." a webom. C9 0:53,2 (2,5 s). Film 55,67 s (1670 snímok).
- Dĺžka: odhad "asi 46 s" z posudku rátal s tým, že obraz sa skráti s hlasom; v skutočnosti chôdza v sklade, otvorenie
  krabíc, príchod mobilu a fotenie a klik na prijatie potrebujú svoj čas aj bez viet, preto 55,7 s. Kde sa dá ďalej brať
  (bez nových nahrávok): sklad v úvode (bez prestrihu do skladu by úvod mal ~5 s, ale veta o hodinách by znela nad kanceláriou),
  veta o katalógu (3,8 s), karta nájdenej zložky vo vyhľadávaní (drží 5,35 s, dá sa o 1 s menej), rýchlejší príchod mobilu
  (scéna C5 od 4000 ms 1,25x, ~0,9 s).
- Hudba: variant `K46` v `src/copy/music_kratka.json` (tá istá skladba `bed.wav`, mriežka 105 BPM): úvod 3,25 taktu
  (posledná doba taktu -13, -12, -2, -1) s delay 0,959 s, nástup kapely 0,3 s pred zeleným prechodom (8,57 s), groove 17 taktov
  (0-7, 11-19; skok 7 -> 11 vybraný podľa podobnosti akordov taktov 7 a 10, 0,985), tempo 0,9763, pokojná časť (takt 44) na
  začiatku prelínačky do ponuky (48,37 s), pod ponukou takty 44 a 50 a záverečný akord (takt 51) v 53,05 s, 0,12 s pred
  záverečným logom. Stlmenie nádychu a cinkavých tónov na začiatku ako v K. `scripts/music_edit.py --variant K46` ->
  `public/music/bed_kratka46_edit.wav` (56,3 s, mimo gitu), mix `mix-music.mjs --variant K46 --gain -7 --range 0`.
- Kontroly: stills v 22 časoch (úvod, logo, nálepky a mobil s ikonami, aplikácia, potvrdenie, ponuka, záver) bez kolízií;
  film 55,8 s (s hudbou), -16,2 LUFS, true peak -1,4 dBFS; hlas v renderi bez prekryvov viet (vo.mjs), typecheck bez chýb,
  kompozícia K-LinkedIn má po zmenách stále 2302 snímok. prepis finálneho mixu cez Gemini zachytí všetkých
  10 viet v správnom poradí a čase (0:00, 0:07, 0:09, 0:11, 0:14, 0:18, 0:30, 0:40 a 0:46, 0:49, 0:53), hlas podľa neho zrozumiteľný
  v celom zázname, hudba bez počuteľných skokov a lupnutí.
- Kolo 31 (77 s) ostáva ako `out/kratka/K-LinkedIn_1080p.mp4` a v commite `a70056e`.

## Kolo 31 (30. 9. 2026): police v sklade ďalej od okraja plošiny

Samuel (snímka skladu): police posunúť viac od spodného okraja.

- Príčina: tretí regál (x 380 až 510) presahoval hranu podlahy skladu (x 500) o 10 cm, stál priamo na pravom prednom
  okraji plošiny.
- Police (`SHELVES` v `C3_Sklad`) sú spoločné s pôvodnou verziou, preto sa nehýbu (inak by sa zmenila aj cesta panáčika,
  otáznik a priblíženie na cieľovú policu). Krátka verzia kreslí vlastnú, o 60 cm širšiu podlahu skladu (`WH_FLOOR_DX`),
  regál je od hrany 50 cm. Záber skladu je o 43 px vyššie (`WH_C` [1200, 470]), aby predný roh ostal nad titulkami:
  predný roh 1021 px (s hranou 1034, titulky od 1060), zadný 68 px. Orez skladu siaha o 70 px nad plátno (`WH_PAD`).
- Kolo 30 je uložené v `out/kratka/verzie/K-LinkedIn_kolo30_77s_*.mp4` a v commite `50d2854`.

## Kolo 30 (29. 9. 2026): úvod bez prechodov, plošiny s rohom hore aj dole

Samuel (snímka skladu): nemá zmysel horný prechod v sklade ani dolný v kancelárii pred ním, dá sa to spraviť
prirodzenejšie? Po návrhu (scéna na celý obraz): logickejšie je, keď majú plošiny viditeľný roh hore aj dole nad textom.

- Príčina prechodov: úvodné scény (C2 kancelária a sklad, C4 do bieleho prechodu) boli v okne `INTRO_WIN` 90 až 1040 px
  s prechodom 30 px do pozadia. Hore okno odrezalo plošinu skladu, dole podlahu kancelárie. Okno vzniklo v kole 11, keď
  bolo logo hore; od kola 14 stáli obe miestnosti na jednej spoločnej plošine, ktorá v kancelárii pokračovala dole
  a v sklade hore, preto ju okno orezávalo.
- `INTRO_WIN` je celý rámec bez prechodu. Každá miestnosť má znova vlastnú podlahu (`Floor` v `Office` a `Warehouse`,
  rovnaké farby a hrúbka, `SharedFloor` vypadla): roh kancelárie je v obraze na 187 a 990 px, skladu na 111 a 1015 px,
  titulky začínajú na 1060 px; bočné rohy sú za okrajom rámca.
- Prechod dole (3,45 až 4,35 s): aby dve dosky nepôsobili ako polica nad skladom (kolo 14, boli ~50 px od seba), sú od
  seba o `C2_GAP` 300 px plátne (posun 1380 namiesto 1080 px za rovnakých 900 ms) a prelínajú sa: kancelária pri posune
  nahor zmizne (od 3,55 s, 450 ms), sklad sa zospodu vynorí (od 3,80 s, 450 ms), obe dosky nie sú nikdy naraz naplno.
  Orez skladu siaha o 40 px vyššie (`WH_PAD`), lebo zadný roh jeho podlahy je 9 px nad plátnom.
- Kolo 29 je uložené v `out/kratka/verzie/K-LinkedIn_kolo29_77s_*.mp4` a v commite `22ebba2`.

## Kolo 29 (29. 9. 2026): v rohu logo s ARCHIVES

Samuel: logo vpravo dole by mohlo byť tiež to logo s archives.

- Posúdenie: áno. Meno produktu je v rohu počas celého videa, dôležité na LinkedIne, kde väčšina ľudí nedopozerá
  do konca a veľké logo vidí len v 0:10. Daň je veľkosť: ARCHIVES je v rohu malé.
- `BrandRow` je finálne dvojriadkové logo (`Lockup` bez skladania) vysoké 60 px: assetin je veľké ako predtým (výška x
  24 px, predtým 23,7), ARCHIVES pod ním má verzálky 16 px (na mobile ~6 bodov, ako písmo ~8 bodov). Účiara ARCHIVES je na
  `BRAND_BASE` (57 px od spodku, súmerne s vrchom nadpisu kroku), vpravo 48 px, šírka 237 px, vrch loga 1233 px (titulky
  končia ~1200 px). Na tmavom úvode verzia na tmavomodrú, inak na bielu.
- Mobil pri fotení (F1) je užší, 720 px namiesto 740 px (ľavý okraj ostáva pri nadpise), medzera k logu je 25 px.
- Jednoriadkové logo z prvej verzie sa už nepoužíva: `scripts/archives_logo.py` berie len finálny balík
  (`podklady/archives-logo-final/`), z prvej verzie ostávajú len ikona aplikácie a favicon (README tam).
- Kolo 28 je uložené v `out/kratka/verzie/K-LinkedIn_kolo28_77s_*.mp4` a v commite `4ac78bf`.

## Kolo 28 (29. 9. 2026): zelený záver ako bol

Samuel: záver zelený, ako bol.

- Záver (C9, od 1:13,7) má znova zelený prechod `BRAND[800]` -> `BRAND[600]` a slogan `BRAND[100]` ako do kola 25.
  Logo je finálne dvojriadkové vo verzii na zelené pozadie (domček, čiara, assetin aj ARCHIVES biele,
  `ARCHIVES_LOGO.two.onGreen`); `Lockup` má namiesto `inverse` prop `colors` (`color`, `inverse`, `onGreen`).
- Ostatné ako v kole 27: v 0:10 farebné logo s tmavomodrým ARCHIVES, v rohu domček | assetin. Hlas a hudba bez zmeny.
- Kolo 27 je uložené v `out/kratka/verzie/K-LinkedIn_kolo27_77s_*.mp4` a v commite `1f60b17`.

## Kolo 27 (29. 9. 2026): finálne logá, ARCHIVES tmavomodré

Samuel: posiela aktualizované logá, v podstate sa len zelené ARCHIVES prepísalo na navy.

- Finálny balík je v `podklady/archives-logo-final/` (21 súborov): na bielom (aj priehľadné), na navy (aj priehľadné), na
  zelenom, jednofarebné biele a čierne, PNG 200 a 800 px. Tvary sú rovnaké ako v prvej verzii, zmenili sa farby:
  ARCHIVES je na bielej #121a2b (ako asset), na navy biele, verzia na zelenú je celá biela.
- `scripts/archives_logo.py` berie dvojriadkové logo z finálneho balíka (priehľadné na bielom a na navy, farby verzie na
  zelenom ako `onGreen`) a z prvej verzie (`podklady/archives-logo/`, pozri README tam) už len tvar domček | assetin pre
  roh (bez ARCHIVES; jednoriadkové logo vo finálnom balíku nie je).
- Video: ARCHIVES je v 0:10 tmavomodré, na konci biele, všetko ostatné bez zmeny. Záver ostáva tmavomodrý ako v kole 26;
  zelený by bol pozadie #1a7431 a farby `onGreen`.
- Kolo 26 je uložené v `out/kratka/verzie/K-LinkedIn_kolo26_77s_*.mp4` a v commite `4bab401`.

## Kolo 26 (29. 9. 2026): oficiálne dvojriadkové logo

Samuel poslal nové logá (zip: dvojriadkové a jednoriadkové logo, inverzné verzie, ikona aplikácie, favicon): do videa
zahrnúť logo, kde sú assetin a archives nad sebou, vhodne zapracovať.

- Logá sú v `podklady/archives-logo/` (14 súborov). `scripts/archives_logo.py` z nich zapíše cesty a farby do
  `src/scenes/kratka/archivesLogo.ts` (farebná a inverzná verzia majú rovnaké cesty, líšia sa len farby), takže logo sa vo
  videu kreslí presne podľa podkladov a dá sa animovať po častiach.
- 0:10 (C4): `Lockup` je oficiálne dvojriadkové logo (domček | assetin nad ARCHIVES), farebná verzia, výška 168 px
  (šírka 665 px), skladá sa ako doteraz (domček dosadne, čiara narastie, assetin a potom ARCHIVES vyjdú zospodu z masky).
  Slogan pod ním je vetou a sivý (Inter 500, 34 px, `INK[600]`) namiesto zelených verzálok s rozostupom, ktoré by pod
  ARCHIVES pôsobili ako tretí riadok loga. Logo od 300 px (predtým riadok 88 px od 372 px), pilulka a archív -> katalóg
  na mieste.
- Záver (C9): inverzná verzia dvojriadkového loga (182 px) na tmavomodrej (`NAVY[800]` -> `NAVY[900]`, ako tmavý úvod),
  slogan `NAVY[200]`. Inverzné logo je robené na tmavomodrú (#121a2b); na zelenej by zelený domček a ARCHIVES zanikli
  (kontrast zelenej loga #2f9e4f so zelenou záveru ~1,5 : 1) a biela verzia loga v podkladoch nie je.
- Značka v rohu: domček | assetin presne z oficiálneho jednoriadkového loga (asset hrubo, in tenko; doteraz celé slovo
  Manrope 800), výška x ako predtým (23,7 px), šírka 211 px ako v kole 20, účiara a pravý okraj na rovnakom mieste; na
  tmavom úvode inverzné farby. Celé jednoriadkové logo s ARCHIVES by v rohu bolo na mobile nečitateľné (ARCHIVES ~5 bodov).
- "archives" malým z kola 20 nahrádza oficiálne ARCHIVES v logu; v texte (titulky, príspevky) ostáva "Assetin Archives".
  Ikona aplikácie a favicon sa vo videu nepoužili (sú pre aplikáciu a web).
- Kolo 25 je uložené v `out/kratka/verzie/K-LinkedIn_kolo25_77s_*.mp4` a v commite `12930c7`.

## Kolo 25 (29. 9. 2026): nadpis "Spracovanie archívu"

Samuel: "Spracovanie archívu" áno, daj to tam (návrh z kola 24 namiesto hovorového "Kto to spracuje").

- Nadpis prvého slidu ponuky (`C8_STEPS` v `LinkedIn.tsx`, 0:55 až 1:01) je "Spracovanie archívu". Nadpisy ponuky sú
  teraz Spracovanie archívu / Technické riešenie / Prvý krok. Hlas, hudba a časovanie bez zmeny.
- Kolo 24 je uložené v `out/kratka/verzie/K-LinkedIn_kolo24_77s_*.mp4` a v commite `93feac2`.

## Kolo 24 (29. 9. 2026): nadpis "Technické riešenie", posudok krabica alebo box

Samuel (pripomienka na review stránke): nadpis "Kde to beží" pôsobí infantilne, zmeniť napríklad na "Technická
špecifikácia" alebo podobne. Zároveň posúdiť, či slovo "krabica" nenahradiť slovom "box" (znelo by uhladenejšie), zatiaľ
nič nemeniť.

- Nadpis druhého slidu ponuky (`C8_STEPS` v `LinkedIn.tsx`, 1:01 až 1:09) je "Technické riešenie". Na slide sú
  bezpečnosť a dve možnosti prevádzky (online u nás, na vašej infraštruktúre), nie parametre, preto nie "Technická
  špecifikácia"; "Prevádzka a bezpečnosť" by dala "bezpeč-" na slide trikrát. Hlas, hudba a časovanie bez zmeny.
- Krabica vo videu: hlas v 0:03 ("v krabici", pôvodná nahrávka hlavnej verzie), 0:22 ("polica, krabica, šanón alebo
  zložka") a 1:08 ("Začnime jednou krabicou"); obraz v 0:22 (ikona Krabica), 0:53 (cesta Krabica KR_01) a 1:08 (slide).
  Aplikácia má úroveň L4 "Krabica" (štítok, "Obsah krabice", "Otvoriť detail krabice"), kódy KR_ a mená krabica_12.
- Posudok: nechať "krabica". Box znie o kúsok modernejšie a kancelárskejšie (archívny box z kancelárskych potrieb) a je
  kratší, ale: v zozname polica, krabica, šanón, zložka by bol jediné cudzie slovo; tvary "v boxe" a "jedným boxom"
  pripomínajú garážový box a šport; nesedel by s aplikáciou (Krabica, KR_01) ani s hlavnou verziou; "Začnime jednou
  krabicou" testeri chválili ako konkrétnu, predstaviteľnú výzvu. Ak by mal byť box, tak všade naraz (tri vety hlasu
  novou nahrávkou, tri miesta v obraze, aplikácia).
- Kolo 23 je uložené v `out/kratka/verzie/K-LinkedIn_kolo23_77s_*.mp4` a v commite `fa62a2a`.

## Kolo 23 (29. 9. 2026): naozaj jedno odfotenie v 0:33, stlmené iskry po prvom akorde

Samuel: "nič sa nezmenilo, mám taký pocit" (po kole 22: dokument sa stále akoby odfotí dvakrát, iskry na začiatku).

- Príčina dvojitej fotky: záznam mobilu `sken-1.mp4` má vlastné bliknutie iOS pri odfotení (8,583 s zdroja, obrazovka na
  ~50 ms čierna a do 8,85 s sa vráti, tlačidlo spúšte sa zmenšuje od 8,567 s), vo filme 32,72 s. Náš zelený krúžok
  spúšte a biely blesk boli pri 8,9 s zdroja (33,03 s), teda o 0,33 s neskôr: prst akoby stlačil spúšť ešte raz, druhá fotka.
  Kolo 22 odstránilo iné zosvetlenie (vyblednutie na konci F1), preto sa nič nezmenilo.
- Oprava: krúžok spúšte (`K_F1_TAPS`) pri 8,55 s zdroja (32,68 s filmu), tesne pred skutočným bliknutím; biely blesk
  vypadol (`LI_F1`: prekrytie obrazovky len pri nábehu mobilu). Jediná fotka je bliknutie iOS v zázname, krúžok ho
  ohlási. Dĺžky záberov, prelínačka do F1 -> F24 (`F1_XFADE`) aj hlas bez zmeny.
- Iskry: kolo 22 umlčalo trblietavý nádych pred prvým akordom (0-2,2 s), ale po akorde ostali vysoké cinkavé tóny
  (zostupné, 2,9-5 s, 8-14 kHz) a jasný šum nábehu akordu nad 6 kHz. `music_edit.py` má voliteľné `hf_cut`: v `K` sú
  v 2,2-5,3 s výšky nad 6 kHz o 24 dB tichšie (prechod od 4 kHz, nábeh a dobeh 0,45 s, filter v spektre s nulovou fázou).
  Pásma pod 4 kHz (akord) sa nezmenili, hudba od 5,75 s je bit po bite rovnaká ako v kole 22.
- Kolo 22 je uložené v `out/kratka/verzie/K-LinkedIn_kolo22_77s_*.mp4` a v commite `4b69676`.

## Kolo 22 (29. 9. 2026): hudba bez iskier na začiatku, jedno odfotenie v 0:34

Samuel: hudba je fajn, len na začiatku dať preč iskry, veľmi jemne; v 0:34 sa dokument akoby dvakrát odfotí, má raz.

- Iskry: trblietavý nádych pred prvým akordom skladby (0-2,2 s, v prvej sekunde 93-98 % zvuku nad 5 kHz, spätný nádych do
  akordu), vo filme asi 23 dB pod hlasom vo výškach. `music_edit.py` má voliteľné `mute_before` a `mute_fade_ms`: v `K` je
  hudba do 2,21 s ticho, nábeh 60 ms do 2,27 s, prvý akord (doba 1 taktu -12) nabieha 2,24-2,30 s; od 2,27 s je upravená
  skladba bit po bite rovnaká ako v kole 21.
- 0:34: dva biele záblesky 0,8 s po sebe: blesk pri spúšti (33,1 s) a vyblednutie mobilu do bielej na konci F1 (33,8-34,0 s,
  z kola 8 proti bielemu prebliknutiu pri prechode do aplikácie), ktoré pôsobilo ako druhá fotka. Vyblednutie vypadlo, okno
  F24 sa cez mobil prelinie (`F1_XFADE` 400 ms = 12 snímok); záznam `k-f1-sken` drží posledný záber o 0,4 s dlhšie (`cuts.json`
  after 1,3), takže F24 aj všetko za ním začína v rovnakom čase (hlasová stopa renderu je bit po bite zhodná s kolom 21).
- Kontroly: obraz sa od kola 21 líši len v 33,8-34,3 s, jas ukazuje jediný záblesk; hlasitosť filmu v pásmach sa od kola 21
  líši najviac o 0,6 dB (medián 0,08 dB), -16,0 LUFS, true peak -1,4 dBFS. Priebeh vzoriek sa líši v celej dĺžke, lebo
  loudnorm a atempo reagujú na zmenený začiatok, počuteľný rozdiel to nie je. Kontrola cez Gemini nebola možná (kredit).
- Kolo 21 je uložené v `out/kratka/verzie/K-LinkedIn_kolo21_77s_*.mp4` a v commite `23b5a20`.

## Kolo 21 (29. 9. 2026): "napísať kľúčové slovo" a plynulý spoj hudby pri 0:55

Samuel: sedí to viac-menej; v 0:51 doplniť "Potom stačí napísať kľúčové slovo"; v 0:55 sa hudba nejako sekne, dvakrát
zahrá to isté a nenaväzuje pekne.

- Hlas: Gemini TTS je nedostupný (vyčerpaný kredit), preto je slovo "kľúčové" vystrihnuté z vety hlavnej verzie
  `public/vo/lines/F3-Vyhladavanie-0.wav` ("Stačí zadať kľúčové slovo.", 0,8275-1,390 s: uzáver "ť", "kľúčové" a začiatok
  "s", -1,7 dB) a vložené do `K-F3-Vyhladavanie-0.full.wav` medzi 1,230 s (ticho uzáveru "ť") a 1,280 s (vnútri "s"),
  prelínačky 5 a 12 ms -> `public/vo-kratka/lines/K-F3-Vyhladavanie-0.kluc.full.wav` (+0,5 s). Ten istý hlas; výška "kľú"
  173 -> 142 Hz (prízvuk na novom slove), okolie 145-157 Hz. Prepis vety bez chyby. "aj cestu k nej." o 0,5 s neskôr
  (6,365 s klipu), klip F3 aj film majú rovnakú dĺžku. Nadpis kroku "Napísať kľúčové slovo" (`Kratka.tsx`).
- Hudba, príčina: strihy `K_kolo15` rátali so 104 BPM (mriežka 2,108 + n x 2,3077 s), skladba má 105,00 BPM. Druhý skok
  (75,95 -> 129,03 s skladby, vo filme 55,5 s) padol z 0,78 doby taktu 20, hneď po crashi na začiatku novej frázy, do 1,67
  doby taktu 43, teda doprostred taktu a o necelú dobu posunutý: zaseknutie a opakovanie.
- Hudba, oprava: `music_edit.py` (variant `K`) na skutočnej mriežke (takt 2,2856 s, doba 1 taktu 0 = 29,793 s, osemtaktové
  frázy od taktov 4, 12, 20, ... 44): úvod ako v kole 15 (takty -13 až -11 so začiatkom skladby, potom -1), takty 0-19
  (koniec frázy), rovno pokojná časť od taktu 44 (začiatok frázy) po záverečný akord (takt 51) a doznenie. Tempo 0,99037:
  nástup kapely 9,23 s, pokojná časť presne na začiatku prelínačky do ponuky (55,39 s), záverečný akord 71,55 s (predtým
  ~72,9 s). Mix ako v kole 15 (`--gain -7 --range 0`).
- Kontroly: fáza dôb v edite je pred oboma spojmi aj za nimi rovnaká (do 7 ms), skok na spojoch 243 a 117 (bežná doba 1:
  medián 130, max 383), bez lupnutí, pokojná časť od prvého taktu po spoji. Film 76,8 s, -16,0 LUFS, true peak -1,4 dBFS;
  obraz sa od kola 20 líši len v zábere vyhľadávania, hlas len v 48-54 s; prepis finálneho mixu zachytí novú vetu celú.
  Kontrola cez Gemini nebola možná (kredit).
- Kolo 20 je uložené v `out/kratka/verzie/K-LinkedIn_kolo20_77s_*.mp4` a v commite `c69580d`.

## Kolo 20 (29. 9. 2026): domček v logu vpravo dole, "archives" malým, hudba z kola 15

Samuel: ostávame pri hudbe z kola 15 (hudbu teraz nemeníme). Posúdiť a zapracovať: v logu vpravo dole doplniť domček za
čiarou ako v podpise mailu (domček | assetin) a či písať "archives" s malým a.

- Posúdenie domčeka: dáva zmysel. Domček je jediný grafický znak, ktorý ľudia poznajú z avatara na LinkedIne a z podpisov,
  v rohu sa spozná rýchlejšie ako samotné slovo a roh je teraz zmenšenina veľkého loga (domček | assetin | archives).
  Jediná daň je šírka: znak je o 66 px širší (x 819-1030 namiesto 885-1030), v F1 preto mobil o 50 px vľavo.
- Posúdenie "archives": v logu áno. Slovo assetin je logotyp malými písmenami, "Archives" s veľkým A pôsobilo ako logo
  a k nemu popis; malé písmená robia z domčeka, assetin a archives jeden celok (ako pri iných značkách s logotypom malými
  písmenami a menom produktu v logu, napr. amazon business). V bežnom texte (titulky, príspevky, web) ostáva
  "Assetin Archives" s veľkými písmenami, lebo je to vlastné meno vo vete.
- `LinkedIn.tsx`: `BrandRow` = domček (`LogoMark`, 0,9 F) | čiara 2 px vysoká ako písmo, rozostup 0,3 F (pomery veľkého
  loga) | assetin; slovo assetin ostáva presne na mieste (účiara 57 px nad spodkom, 48 px od pravého okraja). Na svetlom
  pozadí domček `BRAND[700]` a čiara `INK[300]` ako vo veľkom logu, na tmavom úvode domček `BRAND[400]` (ako "in") a čiara
  biela 45 %. `Lockup`: "archives". `PHONE_TO.x` 100 -> 50 (ľavý okraj mobilu pri nadpise kroku), medzera mobil - domček 28 px.
- Hudba: znova kolo 15 (`bed.wav`, `--variant K_kolo15`, predvolené `--gain -7 --range 0`); zvuk filmu sa s kolom 15 zhoduje
  (rozdiel -104 dB), hlasová stopa renderu je zhodná bit po bite.
- Kontroly: porovnanie snímok po 1,5 s s kolom 15: zmena len v rohu (domček a čiara, x 818-871), vo veľkom logu pri 0:10
  a na konci a v polohe mobilu pri 0:32; stills všetkých scén bez kolízie s logom. Film 76,8 s, -15,9 LUFS, true peak -1,4 dBFS.
  Kontrola cez Gemini nebola možná (vyčerpaný kredit projektu).
- Kolo 18 je uložené v `out/kratka/verzie/K-LinkedIn_kolo18_77s_*.mp4` a v commite `b10d893`.

## Kolo 19 (29. 9. 2026): technická hudba (rozpracované, vyčerpaný kredit Gemini)

Samuel: inú hudbu, viac profi a technickú, nie len výťahové piano; kolo 18 znie neprofesionálne ako z anime.

- Kolo 18 je uložené: `out/kratka/verzie/K-LinkedIn_kolo18_77s_*.mp4`, skladba `public/music/bed_kratka_kolo18.*`, strih
  `K_kolo18` (pokojnejší strih `K_kolo18a`) v `src/copy/music_kratka.json`; zostavenie po premenovaní overené (rozdiel zvuku
  -91 dB). Aktuálna hudba LinkedIn verzie ostáva kolo 18.
- Pokus 1 (moderná minimalistická elektronika: syntetizátor v 16-tinách, pad, sub basa, bicie s rim clickom): afro pop
  a dancehall, na začiatku vyhovorený podpis producenta "SK on the Beats" (4,0-8,5 s, potvrdený prepisom Whisper), Gemini
  funky 6-7/10, profesionalita 3-7/10. Nepoužitý (odložený mimo gitu).
- Pokus 2 (technologická hudba "ako video SaaS produktu", kick, snare, hi-hat v osminách): lo-fi chillhop s vokálnymi
  útržkami a swingom (vo výškach 75 % nástupov na 16-tinách mimo osmín, oneskorené o 36 ms), Gemini funky 5-7/10. Nepoužitý.
- Poučenie z kôl 16-19: pri elektronike s bicou súpravou Lyria skĺzne do popových žánrov (dance pop, afro pop, chillhop),
  slová "minimal, elegant" s klavírom a sláčikmi dávajú neoklasickú baladu. Pripravený pokus 3 (v `prompt`): bez bicej
  súpravy, pulzujúca sekvencia v osminách, pady, hlboká sub basa, tikajúca perkusia v 16-tinách ako hodiny, bez melódie.
- Doterajšia hudba `bed.wav` má 105,00 BPM (doba 0,57140 s, doba v 57,220 s, plná kapela od 57,22 s), nie 104 BPM; stará
  mriežka 2,108 + n x 2,3077 s sa od skutočnej rozchádza až o pol doby. Pre ďalší strih `bed.wav` treba novú mriežku.
- Blokované: Gemini API vracia `402 RESOURCE_EXHAUSTED` (predplatený kredit projektu v AI Studio je vyčerpaný), nejde generovať
  hudbu (Lyria) ani robiť kontroly cez Gemini. Po dobití kreditu: `python3 scripts/music.py --prompt-file
  src/copy/music_kratka.json --out public/music/bed_kratka.wav`, potom rozbor, strih na takty a mix ako v kolách 16-18.

## Kolo 18 (29. 9. 2026): pokojná, pozitívna hudba bez funky rytmu (kolo 17 príliš funky)

Samuel: kolo 17 je až moc funky a stráca profesionalitu; MP4 vraj nemá zvuk.

- Zvuk MP4: stopa je v poriadku (AAC LC stereo 48 kHz ako v kolách 15 a 16, okolo -18 dB RMS po celej dĺžke, kanály bez
  protifázy, korelácia L/R 0,92). Pravdepodobne stlmený prehrávač (náhľad v aplikácii, tichý režim telefónu).
- Príčina funky: v kole 17 gitara s tlmeným rytmom, basa a groove so swingom. Meranie nástupov (`onsets`, poloha v mriežke
  16-tín): v kole 17 padá na 16-tiny mimo osmín 36-38 % nástupov a sú oneskorené o 36-43 ms (swing), v kole 16 22-35 %.
- Tri pokusy Lyria (prompty a poznámky v `_prompt` v `src/copy/music_kratka.json`):
  - pokus 1 (klavírne osminové akordy, pad, synth basa, kick na každú dobu, hi-hat): dance pop, 16-tiny mimo osmín 42-61 %,
    Gemini funky 6/10, úvod 8 taktov so stúpaním; nepoužitý;
  - pokus 2 (štýl kola 16 s pozitívnou náladou: jasný klavír, husle a violy, pad, basa, tlmený kick a hi-hat, 104 BPM):
    neoklasická balada s rovným rytmom (16-tiny mimo osmín 21-35 %), bicie až v závere skladby, na konci osemtaktových fráz
    (takty 2-3, 18-19, 26-27) činelový nábeh a crash; použitý ako `public/music/bed_kratka.wav` (skladba kola 17 je
    `bed_kratka_kolo17.*`, variant `K_kolo17`);
  - pokus 3 (pulz: klavírne osminy, basa v osminách, kick na 1 a 3, bez činelov): znova dance pop (tlieskanie, 16-tiny mimo
    osmín 43-52 %), stúpajúce šumy, crashe a zvonkové arpeggio; nepoužitý (prvá požiadavka vrátila len text bez audia).
- Strih pokusu 2 (`music_edit.py`, variant `K`, od kola 19 `K_kolo18`): 104,03 BPM, takt 2,3071 s, doba 1 taktu 0 = nástup basy v 11,0069 s,
  harmonický cyklus 8 taktov od taktu -4, na 7. a 8. mieste cyklu sú čisté len takty 10-11. Úvod -4 až -1 (klavír), nástup
  basy 0-1, 10-11 namiesto 2-3 (nábeh a crash), 4-11, bicie 28-33 (bez nábehu a crashu v taktoch 26-27) od ukážky aplikácie,
  10-11, pod ponukou pokojná časť s basou 20-23, bicie 28-31 a záverečný akord 34 (tvrdý strih, bez nábehu z taktu 33).
  Kontrola: žiadny nábeh ani crash na strihoch, skoky na strihoch ako na rovnakých dobách v skladbe, bez lupnutí.
- Pokojnejší strih (`K_18A`, bicie až pred výzvou) Gemini hodnotil ako smutnejší než kolo 16 (nálada 4-7/10, priemer 5,
  "kontemplatívne"), preto bicie hrajú už od ukážky aplikácie (priemer 7).
- Zladenie: tempo 0,9997, začiatok 2 ms: nástup basy 9,23 s (0,3 s pred zeleným prechodom), ponuka 55,39 s, záverečný akord
  73,85 s na logu. Mix `--range 2 --gain -6.4`: úvod -18,4, klavír -18,4, bicie -16,3, 10-50 s -17,7 LUFS (ako doteraz),
  ponuka -17,3.
- Kontroly: film 76,8 s, -16,0 LUFS, true peak -1,8 dBFS; technická kontrola bez chýb, hlas 5/5, prepis zachytí všetky vety
  (aj pod bicími). Kontrola hudby: bez šumov, trblietok, zvonkov aj stúpaní, strihy nepočuť, 9/10. Gemini, vždy jedna
  skladba, 4 merania: kolo 18 nálada 6-8 (priemer 7), funky 1-2; kolo 17 nálada 7-8, funky 5-6; kolo 16 nálada 6-7, funky
  1-3. Opis nástrojov si Gemini vymýšľa aj pri jednej skladbe (kolu 17 raz pripísal píšťalku, akustickú gitaru a zvonkohru),
  rozhodujú merania a ucho.
- Kolo 17 je uložené v `out/kratka/verzie/K-LinkedIn_kolo17_77s_*.mp4` a v commite `ff62227`.

## Kolo 17 (29. 9. 2026): optimistickejšia hudba (kolo 16 príliš smutné)

Samuel: hudba kola 16 je až príliš smutná.

- Príčina: prompt kola 16 (reflective, cinematic, felt piano, low strings, pomalé akordy) tlačí do melanchólie. Gemini
  (nálada 1 = smutná, 10 = optimistická): kolo 16 5-6/10, doterajšia hudba 7-8/10.
- Nová skladba `public/music/bed_kratka.wav` (kolo 16 je `bed_kratka_kolo16.wav`, variant `K_kolo16`): nálada doterajšej hudby
  (optimistická, istá, durová tónina), jasné akordy klavíra, čistá gitara, basa, bicie, 110 BPM, prísne bez ľudského hlasu,
  bez tlieskania a činelových nábehov. Pokus 1 mal náladu správne (8/10), ale v úvode spievané "ooh", tlieskanie a stúpajúce
  šumy; pokus 2 je čisto inštrumentálny, úvod len akordy klavíra (0-8,5 s bez vysokých frekvencií).
- Aj pokus 2 má prechodové efekty: pri nástupe kapely (takt 0) sa výšky otvoria filtrom, v taktoch 15-16 filtrový výkyv,
  na konci taktu 28 stúpajúci šum. Strih (`music_edit.py`, teraz aj s polovicami taktov a tvrdým strihom): úvod takty -4 až
  -1, nástup kapely taktom 4 namiesto 0 (rovnaké akordy, podobnosť 0,99, tvrdý strih na dobe), groove 1-11, potom rovno
  druhá časť s melódiou 16-23 (namiesto taktu 16 s filtrom hrá takt 20 s rovnakými akordmi, takty 12-15 vypadli), pod
  ponukou mostík 24-27 (bicie sa stíšia), dvakrát prvá polovica taktu 28 (bez šumu), 29-31 (bicie späť pred výzvou)
  a záverečný akord (takt 36). Kontrola: žiadny nábeh šumu pred nástupmi, skoky na strihoch v rozsahu bežných dôb.
- Zladenie: 20 taktov groove presne od nástupu kapely (9,23 s) po ponuku (55,39 s), preto tempo 0,945 (efektívne 104 BPM ako
  doterajšia hudba); záverečný akord 73,85 s na logu. Mix `--range 6 --gain -5.5` (groove pod rečou -17,7 LUFS ako doteraz,
  úvod o ~2,5 LU tichší, ponuka o ~2,5 LU tichšia).
- Kontroly: film 76,8 s, -16,0 LUFS, true peak -1,7 dBFS; technická kontrola bez chýb, hlas 5/5, prepis zachytí všetky
  vety. Samostatná kontrola hudby kola 17: bez šumov, trblietok, zvonkov aj stúpaní, strihy nepočuť, 9/10 (úvod ale opísala
  ako gitaru; cielená otázka na samotný úvod: klavír, bez bicích). Nálada v porovnaní troch skladieb (Gemini, pokus 2 pred
  strihom aj po ňom, vždy v dvoch poradiach): kolo 17 8/10 vo všetkých štyroch, kolo 15 7-8/10, kolo 16 4-7/10
  (najčastejšie 5). "Prémiovosť" v tých istých porovnaniach: kolo 15 6-9/10, kolo 17 4-9/10, po strihu vybral ako
  najvhodnejšiu dvakrát kolo 15. Ako spoľahlivé to neberiem: tá istá neupravená skladba dostala podľa poradia 9 alebo 6
  a efekty (zvonkohra, tlieskanie, vokálne útržky) pripisuje raz jednej, raz inej skladbe, aj smutnej hudbe kola 16.
  Rozhodne ucho; záloha je doterajšia hudba bez trblietok a stúpaní (strihom na takty).
- Kolo 16 je uložené v `out/kratka/verzie/K-LinkedIn_kolo16_77s_*.mp4` a v commite `81d2f78`.

## Kolo 16 (29. 9. 2026): nová, profesionálnejšia hudba len pre LinkedIn verziu

Samuel: hudbu v LinkedIn videu prispôsobiť, aby viac sedela; začiatok a "efekty iskier" vadia, skúsiť inú, profesionálnejšiu
verziu vhodnú kvalitnému produktu.

- Rozbor doterajšej hudby (skladba `bed.wav` z hlavnej verzie, v LinkedIn verzii zostrihaná): na začiatku šum a vzdušný
  nádych s trblietkami (0-2,5 s filmu 70-90 % zvuku nad 5 kHz), pred zmenami stúpajúce šumy a obrátené činely, uprostred
  zvonkohra; štýl akustická gitara, lúskanie a rovný beat (Gemini: "detská, magická ako z fotobanky").
- Nová skladba len pre LinkedIn: `public/music/bed_kratka.wav` (Lyria, prompt v `src/copy/music_kratka.json`, `scripts/music.py
  --prompt-file src/copy/music_kratka.json --out public/music/bed_kratka.wav`); pôvodná `bed.wav` a hlavná verzia sú bez zmeny.
  Pokus 1 (prompt so zoznamom zakázaných zvukov) mal stále stúpajúce šumy a štýl lo-fi popu, pokus 2 (presný zoznam nástrojov,
  zmeny len pridaním nástroja na dobu) má pokojný klavír v úvode, nástup kapely presne v 9,5 s, pravidelný groove, pokojnejšiu
  pasáž a záverečný akord; stúpajúce šumy pred zmenami Lyria pridala aj tak (spektrum: pred taktmi 0, 8, 12, 20, 24, 32).
- Strih na takty (`scripts/music_edit.py`, plán v `music_kratka.json` K.edit): 105,14 BPM, takt 2,2827 s zmeraný na kicku
  (bez posunu v celej skladbe). Takty so šumom sú nahradené taktmi s rovnakým akordom (4-taktová fráza D, A, Hmi, G): úvod
  D A D A (takty -4 a -3 dvakrát, A -> D do nástupu kapely), v groove namiesto 7, 11 a 19 takt 3, namiesto 12 (činel po nádychu)
  takt 16, v pokojnej časti namiesto 23 znova 22, po druhom groove rovno záverečný akord (takt 32). Strih je vždy na dobe 1
  a nový takt sedí presne v mriežke: kde je pred ním v skladbe čistý takt, prelínačka 60 ms končí na dobe (úder ostane celý),
  kde bol pred ním šum, starý úsek dozvie 15 ms pred dobou a nový nabehne za 4 ms. Kontrola: žiadny takt so stúpajúcim šumom,
  spektrálny skok na strihoch ako na tých istých dobách v nahrávke (bez lupnutí), úvod 1-2 % zvuku nad 5 kHz.
- Zladenie s filmom: tempo 0,9891, začiatok 2 ms; nástup kapely 9,23 s (0,3 s pred zeleným prechodom), pokojná časť od 55,39 s
  (začiatok prelínačky do ponuky), záverečný akord 73,85 s (záverečné logo). Mix `--range 6` (úvod o ~4 LU tichší ako groove,
  nástup kapely pri logu je počuť) a `--gain -5` (nová skladba je pri rovnakom nastavení o 2 LU tichšia; groove pod ponukou
  -17,7 LUFS ako doteraz, schválený pomer k hlasu).
- Kontroly: film 76,8 s, -15,9 LUFS, true peak -1,6 dBFS; technická kontrola bez chýb, hlas 5/5, prepis hotového mixu zachytí
  všetky vety. Kontrola hudby (Gemini): bez šumov, trblietok, zvonkov aj stúpaní, strihy nepočuť, "prémiové a zdržanlivé"
  8,5/10. Slepé porovnanie starej a novej hudby v oboch poradiach: obakrát nová ("elegantná, teplý klavír, zdržanlivé
  bicie"; stará "trblietavé zvonky a rušivé stúpania ako z fotobanky").
- Kolo 15 (doterajšia hudba) je uložené v `out/kratka/verzie/K-LinkedIn_kolo15_77s_*.mp4` a v commite `1ccb9e3`
  (mix: `--music public/music/bed.wav --variant K_kolo15`).

## Kolo 15 (28. 9. 2026): most "S nami ho nájdete za pár sekúnd.", pod logom "Prvé dokumenty zadarmo a nezáväzne", web pri výzve

Samuel: namiesto hodín dať most, ktorý problém vyrieši, a v obraze ponuku zadarmo a nezáväzne; namiesto "Prvá krabica"
radšej "Prvé dokumenty zadarmo a nezáväzne"; most "S nami ho nájdete za pár sekúnd"; doterajšiu verziu zaistiť, nech je
určite uložená.

- Uložená verzia kola 14 (75,3 s): video `out/kratka/verzie/K-LinkedIn_kolo14_75s_1080p.mp4` (a náhľad 540p) je v tejto
  vetve (bajtovo rovnaké ako v commite `6eb819e`, git ho uloží ako ten istý objekt), zdroj v commite `6eb819e`, na review
  stránke ostáva ako "Kolo 14 (uložená verzia)". Git značku sa pushnúť nedá (prostredie smie pushovať len do vetvy, 403).
- Úvod: "Hľadanie môže trvať hodiny." je tretia veta C2 (tá istá nahrávka z kola 6, `K-C2-Hladanie-2.full.wav`), 0,42 s
  po "zložke", počas návratu zložiek, viek a krabíc (1:1, 1120 ms; v kole 12 1,75x). Zložky sú hore počas "...alebo
  v zložke" a pauzy (0,74 s). Chvíľa s otáznikom a hodinami vypadla. Pomalý nájazd na policu (+3,5 % za sekundu, spolu ~11 %) ide
  od konca prechodu na policu cez vetu o hodinách až pod zelený prechod, aby polica nestála. Veta C2 o sklade je bez
  0,36 s ticha na konci (titulok ďalšej vety hneď). Strih C2 -> C4: zmena obrazu medzi susednými snímkami 0,17-0,21 ako
  pred ním aj za ním (bez skoku).
- Most: nová veta Gemini "S nami ho nájdete za pár sekúnd." (`K-C4-Cena-0.most.wav`; pokyn: pokojný, istý obrat od
  problému k riešeniu, bez pauzy vo vete, jemný dôraz na "pár sekúnd"; šesť pokusov, všetky s bezchybným prepisom;
  vybraný s čisto klesajúcim koncom vety a 5,4 slabiky/s, ostatné končili stúpavo alebo pomalšie). Zelený prechod začína
  110 ms po slove "hodiny" (koniec C2), hlas mosta o 0,3 s, logo sa poskladá počas vety. Titulok mosta je vidieť aj počas
  prechodu: biely na tmavej aj zelenej, stmavne, keď cez neho prejde biela vrstva (`subInk`, predtým boli titulky počas
  prechodu skryté). "Predstavujeme vám..." ide 0,42 s po moste.
- C4 v LinkedIn: scéna stojí na prvom obraze (polica ako koniec C2), kým ju zelená celú neprekryje, potom skočí na predel
  (5600 + d ms scény) a beží 1:1; logo odíde ako v kole 14 5,35 s po začiatku vety "Predstavujeme vám..." (`K_C4_H` 4850).
- Pilulka pod logom: rovnaká zelená pilulka s fajkou ako výzva na konci (spoločný `FreePill`), 40 px, "Prvé dokumenty
  zadarmo a nezáväzne", len v obraze bez hlasu, 0,3 s po začiatku vety "Predstavujeme vám..." (0:12,4), odíde s logom
  (vidieť ~5,3 s). Rozloženie: logo 372 px, slogan, pilulka 600 px, archív -> katalóg 752 px, titulky 1060 px.
- Web pri výzve: www.assetin.sk v obrysovej pilulke pod "Zadarmo a nezáväzne" (ako na záverečnom logu), 0,45 s po slove
  "zadarmo".
- Čas: logo o 0,4 s skôr (0:10,2 namiesto 0:10,6), film 76,7 s (+1,4 s za vetu mosta), všetko od predstavenia ďalej
  o 1,43 s neskôr.
- Hudba: druhý strih o takt neskôr (skok z konca taktu 31 na takt 55, na hranici 4-taktovej frázy od nástupu kapely
  v takte 12). So strihom z kola 14 by tempo muselo byť 0,948 a hudba by začala pred filmom. Hudba od 0,25 s tempom
  0,9986: plná kapela 0,3 s pred zeleným prechodom, prechodový takt 55 na začiatok prelínačky do ponuky.
- Kontroly: film 76,7 s, -15,9 LUFS, true peak -1,4 dBFS; technická kontrola bez chýb, hlas 5/5; prepis úvodu v hotovom
  mixe sedí (most zrozumiteľný aj s hudbou). Zmenili sa len súbory experimentu (LinkedIn.tsx, Kratka.tsx, scenár, hudba,
  hlas K), pôvodné kompozície ich nepoužívajú.
- Test na mobile (4 snímky za sekundu, s otázkami navyše na text pod logom a na opakovanie ponuky, ktoré mohli navádzať):
  obaja pochopili podstatu, správca prevzal most do vlastného zhrnutia ("za pár sekúnd nájdete presnú policu"). Pilulka
  v 0:12 obom pôsobí predčasne a trochu reklamne ("ešte neviem, o čo ide"), na konci pri výzve im pomáha; pozerali však
  celé video, kým na LinkedIn väčšina do výzvy v 1:11 nedopozerá (preto je pilulka skoro). Zatváranie krabíc 0:07-0:09 je
  obom stále trochu pomalé, zelený prechod pri 4 snímkach za sekundu prudký. Web pri výzve vidia, chceli by aj priamy
  kontakt (telefón, e-mail alebo odkaz v príspevku). Dĺžka podľa nich 40-50 s.

## Kolo 14 (28. 9. 2026): spoločná plošina kancelárie a skladu, logo vpravo dole, návrh verzie do minúty

Samuel: plošina skladu vyzerá úplne inak ako v kancelárii a zdá sa, že odtiaľ vypadne skriňa so šanónmi; k bezpečnosti
zatiaľ nič konkrétne nemáte, prispôsobíte sa zákazníkovi; logo vpravo dole bez domčeka, písmom a výškou nech pekne
sedí; čo vyhodiť, ak má byť video do minúty a prečo (len napísať, nemeniť, neskracovať).

- Príčina: pri prestrihu dole (3,45-4,35 s) boli na obraze dve samostatné dosky nad sebou (každá scéna má vlastnú
  podlahu, kancelária navyše orezaná inak ako sklad), kancelária s vyhodenými šanónmi pri prednej hrane pôsobila ako
  polica nad skladom. `Office` a `Warehouse` v `C2_Hladanie` dostali voliteľné `floor` (predvolene true, hlavná verzia
  bez zmeny); LinkedIn kreslí jednu spoločnú plošinu (`SharedFloor`): zadný roh = zadný roh podlahy kancelárie, predný
  roh = predný roh podlahy skladu, farby #263246 / #131F31 / ISO.edge a hrúbka 8 cm ako `Floor`, vybledne so skladom
  (6600-7100 ms času skladu). Kamera ide pri prechode po tej istej podlahe, meranie pohybu bez skokov.
- Značka: vpravo dole len slovo assetin písmom veľkého loga (Manrope 800, -0,02 em), 42 px, 48 px od pravého okraja
  ako nadpis kroku zľava, spodok písmen 57 px od spodku ako vrch písmen nadpisu od vrchu. F1: mobil 740 px, posunutý
  doľava (x 100), aby sa so značkou neprekrýval.
- Bezpečnosť bez zmeny ("V súlade s vašimi bezpečnostnými požiadavkami"). Hlas, hudba a dĺžka ako v kole 13 (75,3 s).
- Návrh verzie do minúty (nič nie je zmenené, na review stránke): bez slidu "Kde to beží" (-7,9 s), bez vety
  "Človek každú hodnotu overí..." (-4,4 s), kratšia veta o QR bez vymenovania (-3,5 s, nová veta), fotenie bez hlasu
  a záver kratšie (-1,1 s): 58,4 s. Ostáva otázka a hľadanie, logo so sľubom, QR a fotka, aplikácia sama prečíta text,
  hľadanie s cestou, "Kto to spracuje" a prvý krok zadarmo.
- Test na mobile (4 snímky za sekundu): technická kontrola bez chýb, hlas 5/5. Logo vpravo dole: správca
  "decentné, neprekáža, dostatočne čitateľné", laik "decentné", na bielom občas zaniká a v mobile ho môže prekryť
  ovládanie LinkedIn. Plošina: obom pôsobí ako ostrov v tme (tak vyzerá aj pôvodná verzia), správca by chcel schody do
  suterénu alebo jednoduchý strih. Laik: potvrdenie údajov (0:41-0:45) je zbytočne dvakrát (podporuje návrh do minúty).

## Kolo 13 (28. 9. 2026): živšie hodiny, mäkší prechod na logo, priblížená aplikácia, prelínanie do kratšej ponuky

Samuel: hodiny oživiť priblížením; prechod do ponuky prelínaním, nie prebliknutie; zelený prechod na logo zapracovať;
dĺžku ponuky vhodne skrátiť; okno aplikácie nemusí byť celé vidieť, kľudne ho zväčšiť, orezať inak aj mobil;
k bezpečnosti "v súlade s vašimi bezpečnostnými požiadavkami"; logo vpravo hore je teraz malé.

- C4: po usadení kamery (1100 ms klipu) pomalé priblíženie otáznika a hodín, 1,45 -> 1,7x do 2700 ms, bod medzi nimi
  (scéna 955 x 500) ostáva na mieste (`C4_GROUP_Q`, `C4_PUSH_CAM`). Zelený prechod 800 ms namiesto 480 (krivka
  0.45/0/0.25/1, mäkká horná hrana 110 px, biela 220 ms za zelenou), začína stále v 1950 ms (110 ms po "hodiny");
  scéna C4 zbelie pod zelenou o 320 ms neskôr (`K_C4_D` -2250, `K_C4_H` 3000, všetko po logu v rovnakom čase), logo
  sa skladá v 2610 ms pri "Predstavujeme vám".
- F24 a F3: vlastný `LiFootage` namiesto `DesktopFootageClip` (pôvodný komponent sa nemení): záznam v okne je
  priblížený asi 2,1x (výrez 840 px zdroja) a výrez ide za hlasom (kľúče `F24_VIEWS`, `F3_VIEWS`, ease-in-out):
  nadpis na fotke, návrh názvu projektu, lupa na fotke pri "overí", tlačidlá pri "potvrdí"; hľadané slovo, výsledok
  ZL_03, pri "aj cestu k nej" drobček PL_01 / KR_01 / ZL_03 (620 px, ~2,8x). Zvýraznenia a kliky sa kreslia v px
  okna. Pri 1,6x (prvý pokus) bolo okno podľa správcu stále "extrémne drobné".
- F1: mobil 800 px (predtým 575), presahuje dolný okraj rámca, displej začína tesne nad hľadáčikom (orez 250 px záznamu
  namiesto 115), dokument je asi 1,4x väčší a spúšť je stále v obraze.
- Prelínanie F3 -> C8: nový kľúč `xfadeIn` v `LiDef` (klip sa prekryje s predchádzajúcim, `Series.Sequence` s
  `offset`, `liFrames` a `liStarts` s prekrytím), celý rámec ponuky sa 500 ms prelieva cez posledný obraz F3 (F3 už
  nevybledne, nadpis kroku ostáva, prvý slide ponuky je hotový od začiatku). Najmenej obsahu v strede obrazu počas
  prechodu 3,1 % (v kole 12 0 %, čistá biela).
- C8: nová veta Gemini "Aplikácia funguje v súlade s vašimi bezpečnostnými požiadavkami, online u nás alebo na vašej
  infraštruktúre." (4 pokusy, prepis bez chýb; hodnotenie Gemini dalo všetkým 10/10, vybraná s_1 podľa merania:
  čistý začiatok, prirodzený nádych 0,22 s za "požiadavkami"), v zelenom páse "V súlade s vašimi bezpečnostnými
  požiadavkami". Veta od 6,05 s (slide odíde 0,36 s po predchádzajúcej vete), výzva od 13,98 s (karty ešte 0,9 s po
  vete, predtým 1,32 s). Ponuka o 0,6 s kratšia, film o 1,1 s kratší.
- Značka vpravo hore: domček 46 px, text 42 px (predtým 32 a 30).
- Hudba: `delay` 0,532 s, `tempo` 0,9875: plná kapela ~9,62 s (0,3 s pred zeleným prechodom), prechodový takt 55 od
  ~53,96 s = začiatok prelínania do ponuky (53,93 s). Film 75,3 s, 133 slov.
- Test na mobile (4 snímky za sekundu): technická kontrola bez chýb, hlas 5/5. Nástup loga správca hodnotí
  "profesionálne, moderne a korporátne, žiadny lacný efekt" (v kole 12 "sekol scénu"), laikovi je prechod do bielej
  stále trochu prudký. Logo vpravo hore laik "decentné, dobre čitateľné", správca skôr periférne. Celé okno aplikácie
  je obom stále drobné, karty pod ním "výborne čitateľné". Pomalé priblíženie pri hodinách a 0,5 s prelínanie pri
  4 snímkach za sekundu nevidia (0:07-0:10 obaja stále vnímajú ako pomalšie, správca prelínanie ako skok). Dĺžka podľa
  nich 45-60 s.

## Kolo 12 (28. 9. 2026): plynulé 0:07-0:10, prirodzene nadväzujúci hlas pri vyhľadávaní

Samuel: 0:07 až 0:10 je teraz rozsekané, čo predtým nebolo, zložky sa až moc rýchlo vrátia do krabice atď.; pri 0:53
sa pri "konkrétnej položke" hlas sekne a potom pokračuje "aj cestu k nej", to je v poriadku, len by to malo lepšie
nadväzovať.

- Príčiny (meranie zmeny obrazu medzi snímkami, 30 fps, bez titulkov): v kole 11 sa zložky, veká a krabice vracali 3x
  (0,37 s, najväčší pohyb v celom úvode) a začiatok C4 mal skok: mapa času `[800, 1350] -> [900, 2600]` prehrala 1,25 s
  scény za 3 snímky (hrot 7,6x oproti susedným snímkam v 8,43 s). Pri hlase bol strih v 4,62 s pôvodnej nahrávky priamo
  v spojení "položke aj": koniec slova v plnej hlasitosti (-16 dB) stíchol za 40 ms do úplného ticha a "aj" nastúpilo
  z ticha naraz.
- C2: návrat 1120 ms scény za 640 ms (1,75x, `C2_BACK`), chvíľa so zložkami hore 150 ms (`C2_HOLD`, v kole 11 50 ms).
  Obe zmeny rýchlosti sú vo chvíľach, keď sa v sklade nič nehýbe. Veta o sklade od 4,2 s (slová sedia na obraz). C2 8,0 s
  (+0,37 s), pauza pred "Hľadanie..." 0,85 s.
- C4: `C4_Cena` dostal voliteľné `clockAt` (predvolene 2600, hlavná verzia bez zmeny, 20 snímok pôvodných klipov je
  na pixel rovnakých s `ea5550e`). LinkedIn: hodiny 1400 ms scény (`K_C4_CLOCK`), scéna beží rovnomerne 1,55x
  (kamera scény 0-1700 ms za 1100 ms spolu s kamerou rámu `c4Cam`), od 950 ms sa rýchlosť plynulo vráti na 1:1
  (1250 ms), preskočí sa len 600 ms, `K_C4_D` -2570 (d - preskok ostáva -3170, všetko po hodinách v rovnakom čase klipu).
  Otáznik 8,68 s, hodiny 8,87 s, zelený prechod 9,92 s. Po zmene je jediný hrot na strihu C2 -> C4 výmena titulku,
  obraz sa na strihu zmení menej ako pri bežnom pohybe (0,27).
- F3: nová veta Gemini "Potom stačí napísať slovo a aplikácia ukáže údaje o konkrétnej položke... aj cestu k nej."
  s prirodzenou pauzou (4 pokusy, prepis bez chýb, vybraná f_3: "položke" doznie celé, melódia na konci mierne stúpa ako
  pri čiarke). Rez v tichu 70 ms pred "aj" (5,26 s), pauza 0,7 s (prirodzená 0,49 s, v kolách 10 a 11 1,2 s). Karta
  nájdenej zložky o 0,15 s skôr (vidno ju 3,6 s), F3 o 0,3 s kratšie (záznam drží 5,35 s), ticho na konci F3 ostáva.
- Hudba: `mix-music.mjs` dostal voliteľné kľúče cfg `delay` a `tempo` (hlavná verzia ich nemá). Strihy ako v kole 11,
  hudba od 0,43 s s tempom 0,9765: plná kapela ~9,62 s (0,3 s pred zeleným prechodom), prechodový takt 55 od ~54,46 s
  = začiatok ponuky (54,43 s). Film 76,4 s, 131 slov.
- Hodnotenie modelom je pri týchto jemných veciach nespoľahlivé: Gemini pri slepom porovnaní dvoch nahrávok (aj dvoch
  videí) vybral v oboch poradiach tú prvú. Rozhodovalo meranie (zmena obrazu medzi snímkami, obálka hlasitosti, výška
  hlasu). Test na mobile bez návodných otázok: technická kontrola bez chýb (hlas 5/5), hlas pri 0:50 nikto nespomenul,
  0:07-0:10 nikto nevníma ako sekané, obaja skôr ako čakanie pri hodinách. S návodnou otázkou obaja pri kole 11 aj 12
  "znie zlepene". Ďalšie návrhy (oživiť chvíľu s hodinami, prechod do ponuky bez bielej, pomalší zelený prechod) sú
  otázky na review stránke.

## Kolo 11 (28. 9. 2026): podlaha, dlhšia chôdza, otáznik a hodiny naraz, "napríklad", zelené potvrdenie, logo vpravo hore

Samuel: spodok úvodu je rozmazaný (posunúť); panáčik v sklade nech ide o 0,5-1 s dlhšie (nie pomalšie); otáznik
a hodiny naraz, nech sú vidieť dosť dlho; v oblúkoch mobilu sú stále biele miesta; pri údajoch povedať "napríklad" (nie
len tieto, podľa toho, čo je na fotke); zelený obdĺžnik zarovnať ako okno nad ním; človek hodnotu "prípadne opraví"
alebo potvrdí a obdĺžnik má potom zozelenať s fajkou; "Bezpečne" oddeliť od volieb; QR na poslednej krabici je iný
ako na ostatných; v celom videu malé logo domček + assetin vpravo hore.

- C2: kamera o 125 px vyššie (`C2_CAM` ty 450), okno úvodu 90-1040 px s prechodom 30 px: podlaha kancelárie končí
  vlastnou hranou v obraze (predtým sa spodok rozmazal v prechode okna), stred skladu `WH_C` [1200, 425]. Chôdza od
  parametra 0,32 (ľavý okraj, ešte počas prechodu dole, od 4100 ms) rovnakou rýchlosťou, ~1,75 s (predtým 1,05 s);
  veta o sklade od 4,0 s, statická chvíľa so zložkami 50 ms a vrátenie krabíc 3x. C2 7,6 s.
- C4: nová mapa času sceny `C4_MAP` [[0, 0], [550, 1100], [800, 1350], [900, 2600]]: otáznik 1:1 pri "Hľadanie"
  (0,55 s), hodiny hneď za ním (0,9 s, predtým pri slove "hodiny" 1,45 s); `K_C4_D` -1470 (o 550 ms viac), takže
  zelený prechod aj všetko po hodinách ostáva v rovnakom čase klipu.
- F1: čierne pozadie displeja (`PhoneFrame` dostal voliteľné `screenBg`, predvolene biele), v zaoblení rohov už nie je
  biela. C8: nálepka QR na krabici v pôvodnej veľkosti ako v C5 (voliteľné `qrScale` v `ArchiveBox` z kola 9 vypadlo,
  súbor je zhodný s `main`).
- F24: nové vety Gemini "Aplikácia z fotky sama prečíta text a navrhne údaje, ktoré na nej nájde, napríklad názov
  projektu, autora alebo rok." (7,8 s) a "Človek každú hodnotu overí a prípadne opraví alebo potvrdí." (4,4 s; predtým
  vystrihnutá z F4), vybrané zo 4 a 3 pokusov, prepis bez chýb. Záznam: pokoj na fotke 6,6 s (predtým 5,55), lupa
  1,25x (predtým 2x) počas "overí a prípadne opraví", 0,25 s pred prijatím; klik na prijatie v 12,0 s pri "potvrdí".
  Karta s údajmi (aj karta zložky, hľadané slovo a cesta v F3) má šírku a okraje okna aplikácie (1032 px); pri
  potvrdení zelené pozadie, zelený okraj, veľká fajka a "Potvrdené". F24 12,75 s.
- C8: "Bezpečne" je samostatný zelený pás (`SafeBanner`), voľby Online u nás / Na vašej infraštruktúre sú pod ním
  spolu v sivom rámci.
- Značka: vpravo hore v celom videu (okrem záverečného loga a veľkého loga v C4) domček + assetin (32 px, text 30 px),
  zarovnaná s nadpisom kroku; dole vpravo už nie je.
- Hudba: strihy `[[6.72, 27.49], [73.65, 129.03]]`, tempo 0,97: plná kapela ~9,25 s (na doznení "hodiny", 0,3 s pred
  zeleným prechodom), prechodový takt 55 od ~54,4 s = začiatok ponuky. Film 76,3 s, 131 slov.
- Test na mobile: technická kontrola bez chýb (hlas 5/5). Laik: sklad v podobnej mierke ako kancelária, čisto; správca:
  čas na čítanie "nastavený optimálne". Obaja: zelený prechod v 0:09 prudký, celé okno aplikácie drobné, ponuka
  0:54-1:08 trochu dlhá, dĺžka podľa nich 45-50 s.

## Kolo 10 (28. 9. 2026): sklad ako kancelária, tesnejšie rozloženie, "Názov projektu", čas na čítanie

Samuel: scéna v sklade je rozmixovaná a inak priblížená ako kancelária, majú byť rovnako a pohyb rovnako rýchly
(panáčika prípadne pustiť neskôr); v kontrole "Názov projektu" namiesto "Hodnota"; horný nadpis aj obsah pod ním sú
príliš odsadené, kompozíciu lepšie vymyslieť; pri 1:02 je to prikrátko, zanalyzovať, či je každý záber dosť dlho na
prečítanie a či niektoré nie sú zbytočne dlhé.

- C2: jedna kamera pre kanceláriu aj sklad (`C2_CAM`, bez pomalého nájazdu), prestrih dole je čisté posunutie. Plátno
  skladu je zväčšené o 1,09 (sklad 1,7 px/cm, kancelária 1,96 px/cm, panáčik 1,4 vs 1,25: mierka sveta aj panáčik do
  6 %). Panáčik počas prestrihu stojí v polovici uličky (parameter chôdze 0,5) a potom ide k regálu rovnakou rýchlosťou
  a s rovnakým rozbehom ako v kancelárii (342 px za 0,8 s ease-in-out, tu 411 px za 1,05 s; čas skladu je prepočítaný
  po snímkach), dôjde pri "na polici". Vnútornú kameru skladu (6300-7200 ms) ruší obal okolo scény vo vnútri orezaného
  plátna; kamera pásu prejde na samotnú policu až keď palety, ostatné regály a panáčik vyblednú (koniec ako v kole 9,
  C4 bez zmeny). `C2_Hladanie` dostal len export `PATH`. C2 7,3 s.
- Rozloženie: nadpis kroku 48 px od vrchu (predtým 80), okno aplikácie 138 px (36 px pod nadpisom, predtým 222),
  detail pod oknom od 736 px a väčší (Názov projektu 48 px, hľadané slovo 54 px, karta zložky a cesta na šírku
  1000 px), titulky 1060 px (predtým 1080, ďalej od lišty prehrávača LinkedIn). Mobil v F1 od 138 px, krabica v C5
  o 30 px vyššie, karty ponuky o 20 až 40 px vyššie a o kúsok väčšie, prvý krok vycentrovaný.
- F24: "Názov projektu" namiesto "Hodnota", názov sa láme "Novostavba bytového domu / SLNEČNÁ 12, BRATISLAVA".
  Test prvého renderu: dlhý statický úsek pri "navrhne údaje: názov projektu, autora, rok" (7,6 s) pôsobí pomaly, preto
  sa pod názvom pri slove "autora" vysunie Autor (DOMINIS PROJEKT, s.r.o., v zázname Generálny projektant) a pri "rok"
  Rok (2018, v zázname Dátum 2018-05-01); mená osôb z titulnej strany nie sú.
- Čas na čítanie (text v obraze bez titulkov, orientačne 0,8 s + 1 s na 3 slová a aspoň 0,5 s po dohovorení): krátke
  boli karta nájdenej zložky (19 slov, 2,4 s, zmizla pri dohovorení), Kde to beží (1:02, všetky karty 3,5 s, 0,1 s
  po vete) a Kto to spracuje (0 s po vete); dlhé bolo ticho pri mobile (3,2 s). Úpravy: veta vo vyhľadávaní rozdelená
  pred "aj cestu k nej." (celá nahrávka v `K-F3-Vyhladavanie-0.full.wav`, rez v 4,62 s medzi slovami; prvý rez v 4,46 s
  bol v uzávere hlásky k v slove "položke", odhalila ho technická kontrola) s pauzou 1,2 s, záznam F3 o 1,2 s dlhší
  (karta 3,8 s, 1,4 s po vete); v ponuke 0,6 s po prvom slide a 1,2 s po Kde to beží (4,7 s, 1,3 s po vete);
  záznam mobilu od 7,8 s (o 0,5 s kratší), prvá veta F24 o 0,1 s skôr, záver 3,0 s. Názov projektu v F24 (7,6 s)
  a C5 (9,7 s) sú dlhšie, ale nesie ich hlas.
- Hudba: strihy ako v kolách 8 a 9, tempo 0,97 (dolná hranica): plná kapela ~9,25 s = začiatok zeleného prechodu,
  prechodový takt 55 od ~52,0 s = začiatok ponuky (51,83 s). Film 73,8 s, 122 slov.
- Test na mobile (Gemini tentoraz so 4 snímkami za sekundu, predtým asi 1): technická kontrola bez chýb (hlas 5/5).
  Laik: sklad "v podobnom štýle a mierke", pohyb "primerane svižný", nič chaotické, rozloženie vyvážené bez hluchého
  priestoru, "všetko sa stíhalo dočítať"; správca: texty v kartách majú primeraný čas, sklad mu však príde z väčšej
  diaľky (v zábere je panáčik v kancelárii 172 px a v sklade 182 px, sklad má menšie a početnejšie predmety). Obaja:
  výzva s jednou krabicou presvedčivá, zelený prechod v 0:09 pôsobí na mobile prudko, 0:04-0:09 pomalšie, celé okno
  aplikácie drobné; laikovi "infraštruktúra" IT-čkárska; dĺžka podľa nich 45-60 s.

## Kolo 9 (28. 9. 2026): prirodzená chôdza v sklade, bez duplicity o fotke, údaje zložky, infraštruktúra, jedna krabica

Samuel: panáčik v sklade ide extrémne rýchlo (prípadne skúsiť sklad a kanceláriu vedľa seba, nie pod sebou), hodiny
jemne skrátiť; "Fotka je dôkaz a ostáva pri zázname" pri 0:45 je duplicita (posúdiť, ktorú vetu vyhodiť); pri
"vodovod" čaká konkrétne údaje zo zložky (povolenie vodovodnej prípojky); ponuku začať infraštruktúrou ("funguje
bezpečne podľa vašich požiadaviek, online u nás alebo na vašej infraštruktúre"); výzva na obmedzený rozsah je suchá,
posúdiť "jednu krabicu".

- C2: kancelária a sklad majú vlastný čas (`LI_C2`, `Office` a `Warehouse` z `C2_Hladanie` len exportované, scéna sa
  nemení). Kancelária 1:1, prestrih dole 0,9 s ako v pôvodnej, sklad 1:1 od 4,5 s svojho času (v kole 8 prestrih
  a chôdza 2,2x): panáčik vojde počas prestrihu, po ňom ešte ~0,9 s ide uličkou k regálu a dôjde k nemu pri "na
  polici", prehľadávanie krabíc 1:1; statická chvíľa so zložkami hore 780 -> 150 ms a vrátenie krabíc 2,5x. Veta
  o sklade od 3,8 s (predtým 3,95 s), pauzy v reči 0,65 s po otázke a 0,67 s pred "Hľadanie...". C2 7,37 s (kolo 8:
  7,25 s), zelený prechod ostáva v 9,3 s. Prvý render kola 9 (C2 8,0 s, bez skrátenia) mal pred "Hľadanie..." 1,2 s
  ticha a obaja testeri ho cítili ako hluché miesto 0:07-0:09. Vedľa seba som neskúšal: na výšku 4:5 by obe polovice
  mali 540 px a panáčik by bol ešte menší; dve scény naraz (kolo 3, pod sebou) pôsobili chaoticky.
- C4: predel do loga o 0,1 s skôr (`K_C4_D` -2020, zelený prechod 1950 ms po začiatku C4, 110 ms po slove "hodiny"),
  "Predstavujeme vám..." od 2650 ms.
- F24: veta "Fotka je dôkaz a ostáva pri zázname." aj panel s fotkou vypadli (nahrávka F4-Kontrola-1 len po
  "potvrdí", 2,7 s), klip končí 0,75 s po prijatí hodnoty (`K_F24_END`). Nechal som kontrolu človekom (dôvera), fotku
  vidieť pri vete "Aplikácia z fotky sama prečíta text". F24 10,5 s (kolo 8: 13,4 s).
- F3: pod výsledkom karta nájdenej položky so skutočnými údajmi zo záznamu (ZL_03 Zložka, Projekt pre stavebné
  povolenie 05/2018, Novostavba bytového domu SLNEČNÁ 12, BRATISLAVA, "Doplnenie vodovodnej prípojky podľa požiadavky
  investora" so zvýrazneným "vodovod"), pri "údaje o konkrétnej položke".
- C8: nová veta "Aplikácia funguje bezpečne podľa vašich požiadaviek, online u nás alebo na vašej infraštruktúre."
  (6,3 s) a výzva "Začnime jednou krabicou, zadarmo a nezáväzne." (3,8 s, teplejší tón); Gemini, 4 pokusy na vetu,
  prepis bez chýb, vybrané podľa porovnania s referenčnou vetou. Slide Kde to beží: karta Bezpečne (podľa vašich
  požiadaviek) pri "bezpečne", pri "online" prídu karty Online u nás (bez vlastných serverov) a Na vašej infraštruktúre
  (na vašich serveroch). Slide Prvý krok: krabica z C5 (`ArchiveBox`, nový voliteľný `qrScale` 1,4, inde 0,62),
  nálepka QR na ňu dopadne pri "krabicou", zelená pilulka "Zadarmo a nezáväzne" pri "zadarmo". Posúdenie: "jedna
  krabica" amatérsky neznie, keď je to prvý krok (nie celá ponuka); je konkrétna a divák si ju vie predstaviť, pôvodná
  verzia mala tiež "pilot na jednej krabici". C8 17,2 s (kolo 8: 15,2 s).
- Hudba: rovnaké strihy ako v kole 8 `[[6.72, 27.49], [71.34, 129.03]]`, tempo 0,987: plná kapela ~9,1 s tesne pred
  zeleným prechodom (9,32 s), prechodový takt 55 (bez bicích) od ~51,1 s = začiatok ponuky (51,2 s), pokojný záver od
  ~53,4 s. Film 71,7 s, 122 slov.
- Test na mobile (finálny render): technická kontrola bez chýb (hlas 5/5). Obaja pochopili podstatu, pri "vodovod"
  vymenujú údaje zložky a cestu k nej. Výzva: laik "veľmi férovo, nenásilne, znižuje strach", správca "veľmi konkrétne,
  nízka bariéra vstupu". "Na vašej infraštruktúre" správca rozumie presne, laik vďaka "Na vašich serveroch", ale znie
  mu to IT-čkársky. Chôdzu Gemini spoľahlivo neposúdi (video vidí zhruba po sekundách): v prvom renderi ju správca
  opísal ako prirodzenú, vo finálnom obaja ako statickú. Stále: sklad 0:05-0:09 pomalší, celé okno aplikácie
  0:32-0:43 drobné, bezpečnosť konkrétnejšie (šifrovanie, GDPR, prístupové práva), dĺžka podľa nich 45-60 s.

## Kolo 8 (28. 9. 2026): menej textu v obraze, kratší úvod, pokojnejšia veta o QR, väčší mobil, web na konci

Samuel: vynechať "Vy viete, že tam niekde je."; sklad, keď tam panáčik hľadá, nie je dosť priblížený; web na konci určite
áno; pri 0:26 povie vety strašne rýchlo; pri predstavení (prvá biela) je veľa priestoru, kde sa nič nedeje; mobil pri 0:31
je zle orezaný a malý (titulky tam nie sú); v obraze je veľa textu, zjednodušiť na nadpis, obsah a prepis hlasu, značku
dať malú dole pod titulky doprava; posúdiť.

- Posúdenie rozloženia: súhlasím. Názov fázy s bodkami, štítky nad detailmi, značka hore a web dole opakovali to, čo
  hovorí hlas a nadpis; na mobile to bolo päť vrstiev textu naraz. Ostal nadpis kroku (80 px od vrchu, bez fázy
  a bodiek), obsah a titulky; značka je malá a tlmená v pravom dolnom rohu pod titulkami, web len na záverečnom zábere.
  Pravý dolný roh pri zastavení videa prekryje lišta prehrávača LinkedIn, preto je značka len doplnok, nie výzva.
- C2: "Vy viete, že tam niekde je." vystrihnutá (veta o sklade od 1,95 s pôvodnej nahrávky C2-Hladanie-1), otázka od
  0,25 s, veta o sklade od 3,95 s. Scéna C2 v sklade rýchlejšie (`C2_FAST`, Freeze, scéna sa nemení): prestrih a chôdza
  2,2x, kamera na policu 1,4x, prehľadávanie krabíc 1:1, zatváranie 1,9x. Priblíženie: sklad 1,5x, polica s krabicami
  1,8x (predtým 1,3x), C4 z 1,8x na skupinu regál, otáznik, hodiny. C2 7,25 s namiesto 9,7 s.
- C5: dve samostatné vety s pauzou 0,9 s pred "Mobilom", obe pokojnejšie (Gemini s pokynom na pokojné tempo a pauzy
  v zozname, QR "kju ár" overené prepisom, vybrané z 6 a 3 pokusov): prvá 8,1 s namiesto 6,6 s. Scéna stojí dvakrát
  (`K_C5_HOLDS`: 0,7 s po nálepke na krabici, 4,15 s po nálepkach na zložkách): nálepka na krabicu pri "krabica",
  nálepky na zložky pri "zložka", mobil tesne pred "Mobilom". C5 13,25 s.
- Logo: pod logom pri "Z vášho archívu urobíme prehľadný digitálny katalóg" Váš archív -> Digitálny katalóg (ikona pri
  "archívu", šípka pri "urobíme", katalóg pri "prehľadný"), odíde s logom (`C4Promise`).
- F1: mobil 575 x 1040 px (predtým 442 x 800), od nadpisu po značku dole. C9: web www.assetin.sk pod sloganom.
- Hudba: strihy `[[6.72, 27.49], [71.34, 129.03]]`, pulz (takt 11) ~6,8 s, plná kapela ~9,2 s tesne pred zeleným
  prechodom (9,32 s), pokojný záver ~54,1 s = začiatok ponuky (54,03 s). Film 72,5 s.
- Test na mobile: technická kontrola bez chýb (hlas 5/5, plná kapela nameraná v 9,20 s). Obaja pochopili podstatu,
  že štruktúra nie je pevne daná, aj cestu k položke; ponuka "prehľadná, jasné karty"; posledný záber s webom "čistý,
  web výrazný". Nástup loga laik: "profesionálne, čisto a moderne, zelená príjemne predelila úvod od riešenia", správcovi
  príde v 10. sekunde priskoro. Obaja: biely preblik pri prechode z mobilu do aplikácie (0:31-0:33); po teste mobil
  vybledne za 0,25 s (predtým 0,5 s) a okno F24 je hneď bez vyblednutia z bielej (`enter` vypadol). Stále: polica
  s hodinami 0:04-0:08 a potvrdzovanie údajov 0:36-0:45 im prídu pomalé, laikovi "infraštruktúra", bezpečnosť
  konkrétnejšie (GDPR, servery, prístupové práva), dĺžka podľa nich 40-50 s.

## Kolo 7 (28. 9. 2026): "každá položka" a nie pevná štruktúra, údaje o položke, ponuka na troch slidoch

Samuel: pri 0:22 povedať, že QR dostane každá položka, či polica, šanón alebo zložka, a že to nie je pevne dané; pri
0:50 aplikácia ukáže konkrétne údaje o položke a cestu ku konkrétnej položke; koniec (ponuka) je prehustený, rozdeliť na
viac slidov.

- C5: "Každá položka, či už polica, krabica, šanón alebo zložka, dostane QR kód, podľa toho, ako máte archív
  usporiadaný. Mobilom potom odfotíme titulnú stranu dokumentu." (Gemini). Prvé tri pokusy vyslovili QR po slovensky
  ("kvé er"), s doplnkom `styleExtra` k vete vyšli 3 z 5 po anglicky ("kju ár", overené prepisom), vybraný podľa
  intonácie a dĺžky (10,2 s). Ikony pri svojich slovách, QR pri "dostane QR kód", pri "podľa toho, ako máte archív
  usporiadaný" dva príklady usporiadania (polica, krabica, zložka; potom polica a šanón), ostatné na chvíľu stlmené.
  Scéna C5 stojí 2,75 s po dopade poslednej nálepky (`K_C5_HOLDS`, 4000 ms scény), mobil príde na konci prvej vety.
  Krok "Odfotiť titulnú stranu" je pri tretej časti vety. C5 11,15 s namiesto 8,4 s.
- F3: "Potom stačí napísať slovo a aplikácia ukáže údaje o konkrétnej položke aj cestu k nej." (Gemini, z troch pokusov).
  Pod oknom po hľadanom slove karta nájdenej položky podľa záznamu aplikácie (ZL_03, Zložka, nájdené v "Údaje" a "Text
  z fotky" = v aplikácii Metadáta a OCR, príloha = fotka titulnej strany), potom "Cesta k položke" Polica PL_01 -> Krabica KR_01 -> Zložka ZL_03 (drobček
  z aplikácie, bez kroku Dokument). V zázname sa zvýrazní najprv výsledok, potom drobček. Kroky: Napísať slovo, Údaje
  o položke, Cesta k položke.
- C8 na troch slidoch s posunom doľava a názvom nad obrazom ako v ostatných častiach (Ako začať: Kto to spracuje, Kde
  to beží, Prvý krok): väčšie karty (58 px), "alebo" medzi nimi, na druhom slide aj "Vždy bezpečne...", na treťom len
  výzva (bez titulku, jej slová sú na karte). Časy viet sa nemenia.
- C9 3,3 s namiesto 3,6 s (film musí ostať okolo 72,9 s, aby hudba sedela, pozri nižšie).
- Hudba: strihy `[[9.03, 27.49], [69.03, 129.03]]` (v druhom strihu o takt menej), plná kapela stále tesne pred
  zeleným prechodom (11,75 s), pokojný záver od začiatku ponuky (54,37 s). Plná kapela musí padnúť na prechod pri tempe
  ~0,97, čo pri 26 vystrihnutých taktoch dáva film okolo 72,9 s. Film 72,9 s.
- Výsledok: `out/kratka/K-LinkedIn_1080p.mp4` 73,0 s, -16 LUFS, hudba tempo 0,971; technická kontrola bez chýb (hlas 5/5).
- Test na mobile: obaja pochopili, že štruktúra nie je pevná ("prispôsobí sa to tomu, ako máte archív usporiadaný"),
  že aplikácia ukáže nájdenú položku, jej údaje a fotku a cestu PL_01 -> KR_01 -> ZL_03; ponuku na slidoch hodnotia
  "veľmi pekná, čistá a dobre čitateľná, žiadny chaos" a "prehľadná, čistá". Laik nerozumel štítkom "Metadáta" a
  "OCR" na karte položky, po teste sú na karte "Údaje" a "Text z fotky". Stále: regály a hodiny 0:06-0:11 pomalé,
  skok do bielej pri logu správcovi prudký, bezpečnosť by chceli konkrétnejšie, dĺžka podľa nich 40-50 s.

## Kolo 6 (28. 9. 2026): priblížený úvod, "Hľadanie môže trvať hodiny", nový nástup loga

Samuel: nie je na začiatku málo vidieť panáčika, nemá zmysel priblížiť?; "hľadanie môže trvať hodiny", nie "trvá";
okolo 0:11 je zbytočne veľa voľného času; logo okolo 0:14 nemá "horieť", ale prísť profesionálnejšie.

- Priblíženie: rámec 4:5 má nad a pod pásom 16:9 voľné miesto, panáčik v kancelárii mal na mobile asi 12 x 32 px.
  Kamera rámca (`Cam`, `camShift`, nové `s` v `shift`) priblíži kanceláriu 1,45x a pomaly na 1,75x (panáčik a skriňa),
  pri prestrihu do skladu späť na 1,3x (sklad, polica), v C4 na 1,45x na skupinu regál, otáznik, hodiny. Okno pásu
  v úvode `INTRO_WIN` 110-1060 px; pod bielou v C4 znova pás, aby okraj tmavej scény nebol na bielej vidieť.
- Veta "Hľadanie môže trvať hodiny." je nová (Gemini, tri pokusy, vybraný podľa intonácie, prepis OK), v C4 od 0 ms,
  reč 0,5 s po konci vety C2 (predtým 2,1 s ticha). C2 je o 0,3 s kratšie (9,7 s).
- Tempo C4: `K_C4_FAST` prehrá začiatok scény C4 rýchlejšie cez `Freeze` (kamera 1700 ms scény za 1100 ms, otáznik
  pri "Hľadanie", hodiny pri "hodiny"), pauza `K_C4_HOLDS` vypadla, scéna `C4_Cena` sa nemení (d -1920, h 3320).
  C4 9,37 s namiesto 10,7 s.
- Logo: namiesto bieleho svetla zo stredu (pôsobilo ako žiara) čistý prechod zdola nahor: zelený pás značky a 220 ms za
  ním biely (ostré hrany, 480 ms, od 11,75 s), nad značkou aj webom rámca (nová vrstva `top`). Pod bielou sa scéna C4
  prelinie do bielej a rámec prepne farby. Logo sa poskladá (`Lockup` s `build`): čiary narastú, domček dosadne,
  "assetin" a "Archives" vyjdú zospodu z masky a zosvetlia sa, slogan sa dotiahne. Titulok pred prechodom vybledne
  (`subsOut`), malý riadok značky hore je počas veľkého loga skrytý (`rowOut`). Veta "Predstavujeme vám..." 2750 ms.
- Hudba: strihy `[[9.03, 27.49], [66.72, 129.03]]`, pulz (takt 11) ~9,2 s na konci vety o sklade, plná kapela ~11,6 s
  tesne pred zeleným prechodom (11,75 s), pokojný záver ~51,9 s = začiatok ponuky (51,6 s). Film 70,4 s.
- Test prvej verzie kola 6 (priblíženie 1,3-1,55x, biela 100 ms za zelenou): laikovi aj správcovi sa nástup loga páčil
  ("pekná a profesionálna", "čisto, budí dôveru"), obaja však panáčika stále vnímali ako drobného a laikovi skok z tmavej
  do bielej pripomínal záblesk; posudok "dizajnéra" (Gemini, snímky po 1 s) dal prechodu 5/10, polovičné písmená
  v maske videl ako chybu a malé logo hore ako duplicitu. Preto väčšie priblíženie, dlhšia celá zelená, zosvetlenie
  slov v maske a skrytý riadok značky.
- Výsledok: `out/kratka/K-LinkedIn_1080p.mp4` 70,5 s, -16 LUFS, hudba tempo 0,972; technická kontrola bez chýb (hlas 5/5),
  plná kapela nastúpi v 11,6 s (meranie basov), zelený prechod od 11,75 s. Nový plagát review stránky je priblížená
  kancelária (2,3 s).
- Test finálnej verzie na mobile: obaja pochopili podstatu, cestu PL_01 -> KR_01 -> ZL_03, obe voľby a skúšku zadarmo.
  Logo: laik "seriózne a profesionálne", správca "čisto a profesionálne"; obom je však skok z tmavej do bielej na mobile
  ostrý. Panáčik je podľa nich stále drobný a schematický, ale zrozumiteľný; úvod pri regáloch 0:04-0:11 im príde pomalý.
  Dĺžka podľa nich 35-45 s. Otvorené otázky (logo na zelenej, kratšia veta o sklade) sú na review stránke.

## Kolo 5 (28. 9. 2026): kratší problém a kratšia veta o prevádzke

Samuel: skrátiť vetu o infraštruktúre; posúdiť, či "Platíte dvakrát za to isté" treba ako hook, alebo stačí, že
ľudia nevedia dohľadať dokumenty; možno netreba ani nové vyhotovenie dokumentov.

- Posúdenie: hookom je úvodná otázka (prvé 3 s), veta o dvojitom platení prichádzala až okolo 16 s a predlžovala
  problém (správca v kole 3: "netreba ho dlho poúčať"). Bolesť "hľadanie trvá hodiny" pozná každý; cena nového
  vyhotovenia je argument pre toho, kto rozhoduje o rozpočte, patrí skôr do textu príspevku.
- C4: z hlasu ostáva "Hľadanie trvá hodiny." (vystrihnuté z nahrávky kola 1, celá je v `K-C4-Cena-0.full.wav`),
  `C4_Cena` nový voliteľný `cost={false}` skryje šípku, výkres, cenovky a "2x EUR", predel `d` -2200 (hneď po
  hodinách), pauza 500 ms pri hodinách (`K_C4_HOLDS`), pás sa počas problému posunie o 140 px (skupina regál,
  otáznik, hodiny na stred) a počas bielej sa vráti. C4 10,7 s namiesto 15 s.
- C8: "Aplikácia beží u vás alebo u nás, vždy bezpečne." (Gemini, prepis OK) namiesto 7,2 s vety o infraštruktúre;
  karty a pás "Vždy bezpečne a s rešpektom k vašim požiadavkám" ostávajú. C8 15,2 s namiesto 18,1 s.
- Hudba: strihy `[[11.34, 27.49], [66.72, 129.03]]`, pulz (takt 11) s vetou o hľadaní, plná kapela ~13,8 s (predel do
  bielej 13,9 s), pokojný záver od ~53,7 s = začiatok ponuky (53,2 s). Film 72 s.
- Po teste (obaja: prázdna biela pred logom 0:13-0:15 vyzerá ako chyba, laik: prázdna zelená 1:07-1:08 pred logom
  na konci): logo v C4 naskočí 380 ms po predele (keď svetlo zaplní obraz), slogan o 320 ms neskôr; v C9 je logo
  takmer hneď na strihu (`settle(frame, -250)`), slogan o 450 ms neskôr.
- Výsledok: `out/kratka/K-LinkedIn_1080p.mp4` 72,1 s, -16 LUFS; technická kontrola bez chýb (prechod pri 0:14
  plynulý, hlas 5/5), 20 snímok pôvodných klipov na pixel rovnakých ako `ea5550e` (aj po novom `cost` v `C4_Cena`).
- Test na mobile (pred opravou loga): obaja pochopili podstatu, čo dostane QR, cestu PL_01 -> KR_01 -> ZL_03 ->
  Dokument, obe voľby a že skúška je zadarmo. Úvod súvislý (správca: "trafilo to môj každodenný problém"), laikovi
  pomalý (sklad a hodiny 0:05-0:12). Okno aplikácie 0:32-0:52 je na mobile drobné, čitateľné sú len zväčšené výrezy.
  "Vždy bezpečne" im je málo (správca: zálohovanie, prístupové práva, šifrovanie, GDPR; laik: kto vidí citlivé
  zmluvy, kde sú dáta). Laikovi znie "na vašej infraštruktúre" na karte odborne. Na poslednom zábere by chceli web.
  Dĺžka podľa nich 35-45 s (laik), 45-60 s (správca).

## Kolo 4 (28. 9. 2026): úvod späť, hierarchia archívu, cesta k dokumentu, ostré detaily, dve voľby

Samuel: úvod s kanceláriou a archívom naraz je rozbitý a hektický (panáčikovia inak veľkí, prichádzajú inokedy a
inou rýchlosťou) a chýba pekný prestrih na policu k "Hľadanie trvá hodiny"; vysvetliť, že QR dostane aj šanón a
polica; po odfotení sa okolo 0:30 obraz rozbije a posunie dole; pri vyhľadávaní ukázať cestu k dokumentu cez
konkrétne police, krabice a šanóny; výstrižky sú rozmazané; Ako začať: na kľúč alebo vlastnými silami, na vašej alebo
našej infraštruktúre, vždy bezpečne s rešpektom k požiadavkám; "vyskúšajme to na obmedzenom rozsahu, zadarmo a
nezáväzne"; posledné logo super, len zvislá čiara nie je v strede; zatiaľ bez assetin.space? páči sa mu logo z riadku
značky hore (domček, assetin, Archives), ale "Archives" písmom z posledného záberu.

- Úvod: C2 v páse znova ako v kole 2 (obe vety, prestrih do skladu, kamera na policu = začiatok C4); `LI_C2` a export
  `Office`/`Warehouse` vypadli (C2_Hladanie.tsx je znova ako na `main`).
- C5: nová veta "Každá polica, krabica, šanón aj zložka dostane QR kód. Mobilom potom odfotíme titulnú stranu
  dokumentu." (Gemini, prepis OK) a vrstva `C5Hierarchy`: ikony Polica, Krabica, Šanón, Zložka pri svojich slovách,
  nálepky QR pri "dostane QR kód" (časy slov z `K-C5-Teren-0.words.json`).
- F1: `k-f1-sken` končí 8,97 s (od 8,98 s náhľad fotky Retake / Use Photo s fotkou posunutou nižšie), posledný záber
  fotoaparátu drží 0,9 s, pri spúšti biely blesk.
- Detaily pod oknom (`Panel`): text na fotke = výrez `public/footage/k-photo-title.png` zo záznamu mobilu
  (`src/sken-1.mp4`, 1206 x 2622, 8,93 s), pole s návrhom (`ValueField`, aj "Potvrdené" pri kliknutí) a vyhľadávanie
  (`SearchField`, "vodovod" sa píše 0,8-1,9 s ako v zázname) sú prekreslené písmom aplikácie (Inter). Živý výrez zo
  záznamu obrazovky 1920 x 1032 bol pri 3-4x zväčšení rozmazaný.
- F3: cesta k dokumentu (`DocPath`): Polica PL_01 -> Krabica KR_01 -> Zložka ZL_03 -> Dokument, kroky sa rozsvietia
  pri slovách "polici", "krabici", "dokument" (časy slov z nahrávky); záznam drží o 0,8 s dlhšie (`k-f3-search` 8,2 s).
- C8: "Kto to spracuje" (Služba na kľúč / Vlastnými silami), "Kde to beží" (U vás / U nás, na vašej / našej
  infraštruktúre), pás "Vždy bezpečne a s rešpektom k vašim požiadavkám" a výzva "Vyskúšajme to na obmedzenom rozsahu /
  Zadarmo a nezáväzne". Nové vety "Aplikácia beží na vašej infraštruktúre alebo na našej. Vždy bezpečne a s
  rešpektom k vašim požiadavkám." a "Vyskúšajme to na obmedzenom rozsahu, zadarmo a nezáväzne." (Gemini, prepis OK).
- Logo `Lockup`: domček | assetin | Archives (Manrope 800, "in" zelené) bez .space, rozostupy okolo čiar rovnaké
  (flex), v C4 ako vrstva na výšku (`C4_Cena` nový voliteľný `brand={false}` skryje lockup assetin.space; `tagline` z
  kola 3 vypadol) a na konci. Priblíženie pásu C4 z kola 3 vypadlo.
- Hudba: strihy `[[13.65, 25.19], [71.34, 129.03]]`, plná kapela ~18,0 s (prechod do bielej 18,2 s), pokojný záver od
  ~61,4 s (záver skladby má 17,7 s, ponuka a logo spolu 21,7 s). Film 79,2 s.
- Po teste (obaja: sivý prechod z tmavej do bielej pred logom 0:17 je sekaný, nadpis "Polica a krabica" ostane sám na
  bielej 0:56): biele svetlo sa rozlieha zo stredu ponad prelínačku pásu (C4 8150-8630 ms), rámec prepne farby, keď je
  celý biely (8520 ms); názov kroku na konci F3 vybledne spolu s obrazom (`labelOut`).
- Výsledok: `out/kratka/K-LinkedIn_1080p.mp4` 79,3 s, -16 LUFS; technická kontrola bez chýb (prechod pri logu plynulý,
  hlas 5/5), 20 snímok pôvodných klipov na pixel rovnakých ako `ea5550e`.
- Test na mobile (pred poslednými dvoma opravami): obaja pochopili úvod ("súvislý, plynulý, jasný príbeh"), čo dostane
  QR (polica, krabica, šanón, zložka), cestu PL_01 -> KR_01 -> ZL_03 -> Dokument, obe voľby a že skúška je zadarmo.
  Laikovi znie "na vašej infraštruktúre" odborne; obaja sa pýtali na GDPR, šifrovanie a prístupové práva; na poslednom
  zábere by chceli web; dĺžka podľa nich 45-60 s.

## Kolo 3 (28. 9. 2026): kratší úvod, bezpečnosť, skúška zadarmo, záver len logo

Samuel: úvod skrátiť (napadlo mu dať kancelársku a archívnu animáciu vedľa seba: hľadá sa v kancelárii aj v archíve),
obhliadka a pilot sú zadarmo a nezáväzné, rešpektujeme bezpečnostné požiadavky zákazníka (prvý zákazník: všetko na jeho
infraštruktúre a jeho zariadeniach), telefón na LinkedIn skôr nie, slogan zjednodušiť (napr. "Digitálny poriadok vo
fyzických dokumentoch"), pilot povedať jednoduchšie. Komentár na stránke: posledný záber je prehustený, má tam byť
jednoduché logo.

- Úvod `LI_C2`: dioramy kancelárie a skladu z C2 (`Office`, `Warehouse`, len export) naraz, pod sebou (vedľa seba by mala
  každá len 540 px, panáčik na mobile ~5 px), mierka 0,47, štítky "V kancelárii" a "V archíve", len otázka. 5,4 s
  namiesto 10 s; veta "Vy viete, že tam niekde je. V sklade..." vypadla. Strih do C4 (regál s "?").
- C8 na výšku: tri riadky podľa viet (na kľúč, softvér, bezpečne u vás) a zelená výzva "Obhliadka a skúška na jednej
  krabici / Zadarmo a nezáväzne". Hlas: "Archív vám spracujeme na kľúč." (vystrihnuté z C8-Pilot-0), "Alebo ho
  spracujete sami v našej aplikácii." (kolo 1) a nové "Aplikácia aj dáta môžu byť u vás, na vašich serveroch a
  zariadeniach." a "Začneme obhliadkou a skúškou na jednej krabici, zadarmo a nezáväzne." (Gemini, prepis OK).
- Slogan `SLOGAN` = "Digitálny poriadok v papierovom archíve" pod lockupom v C4 (`C4_Cena` nový voliteľný `tagline`)
  aj na konci. C9 len logo a slogan na zelenej, hlas "Assetin Archives." (vystrihnuté z C9-Outro-0), bez titulkov.
- Telefón nie (LinkedIn, kontakt je v príspevku). PDF z Samuelovej správy neprišlo, veta o bezpečnosti vychádza z
  brožúry v `src/copy/sk.ts` (S10 "Rozhodnú vaše bezpečnostné požiadavky", "Nasadíme aplikáciu do vášho prostredia").
- Hudba: nové strihy na takt `[[6.72, 22.88], [69.03, 129.03]]`: tichý začiatok pod otázkou, pulz s vetou o hľadaní,
  plná kapela (takt 12) ~0,1 s pred prechodom do bielej, pokojný záver pod ponukou. Úvod 5,4 s je najkratší, pri ktorom
  plná kapela padne na logo (celé takty).
- Po teste (obaja: 0:14-0:19 prázdna biela a malé logo, laik: 0:45 biela diera pred vyhľadávaním): pás C4 sa po prechode
  do bielej priblíži 1,9x okolo loga a sloganu (`zoom` v `LiDef`, pred krabicou C5 sa vráti), okno F24 na konci
  nevybledne (DesktopFootageClip `seconds` + 1 s) a F3 nadväzuje v tom istom okne bez `enter`.
- Výsledok: `out/kratka/K-LinkedIn_1080p.mp4` 72,7 s, -16 LUFS; technická kontrola bez chýb (hlas 5/5, prechody v hudbe
  plynulé), 20 snímok pôvodných klipov na pixel rovnakých ako `ea5550e`. Test na mobile (finálna verzia): obaja pochopili
  úvod aj ponuku, prvý krok "obhliadka a skúška na jednej krabici, 0 €"; bezpečnosť upokojila, laikovi (malá firma) znie
  "na vašich serveroch" vzdialene; posledný záber čistý, no chceli by na ňom web; prechod do bielej pri logu stále
  pôsobí prázdne; dĺžka podľa nich 40-50 s (Samuel určil okolo 70 s).
- Upratanie: klipy 16:9 `K_LIST`, `K-Full`, `KratkaFull.tsx` a 16:9 varianty v `Kratka.tsx` vypadli (nový hlas by im
  nesedel); zmeny zo 1. kola v zdieľaných súboroch, ktoré už nič nepoužíva (`F2_Metadata` priblíženie, `C9_Outro` cta,
  `C8_Pilot` export kariet, `F1_Sken` phase), sú vrátené na stav z `main`. `scripts/kratka-stills.mjs` robí stills
  K-LinkedIn podľa času vo filme.

## Kolo 2 (27. 9. 2026): jediná krátka verzia je LinkedIn 4:5

Samuel: teaser je príliš krátky (zmazať), krátka verzia okolo 70 s je dĺžkou v poriadku. Na LinkedIn treba, aby bolo
aplikáciu dostatočne vidieť a aby nemala stále orezané okraje. Ostáva iba LinkedIn verzia.

Rozbor verzie 4:5 z kola 1: 16:9 film bol v 4:5 len pás 1080 x 608 pod stálym nadpisom, okno aplikácie malo 776 px
(vedľa neho panel krokov) a priblíženie 1,5x v okne stále orezávalo okraje aplikácie (text useknutý na kraji okna).
Na mobile má celé 4:5 video ~390 px, takže text aplikácie je aj pri celej šírke ~3 px: čitateľný môže byť len zväčšený detail.

Riešenie (kompozícia `K-LinkedIn`, `src/scenes/kratka/LinkedIn.tsx`), nakreslené natívne na výšku:
- Záznamy aplikácie celé, bez priblíženia: okno na celú šírku (obsah 1032 x 516 = celý záznam 1764 x 882), nad ním
  názov kroku (fáza, krok, body postupu), pod ním zväčšený detail skutočného záznamu (živý obraz, zelený rámik ako spot):
  F24 text na fotke -> návrh "Názov projektu: Novostavba bytového domu SLNEČNÁ 12, BRATISLAVA" (počas overenia
  a potvrdenia) -> text na fotke pri vete o dôkaze; F3 hľadané slovo (píše sa naživo) -> cesta PL_01 / KR_01 / ZL_03
  s popiskami polica, krabica, zložka.
- F1: mobil narastie z pozície na konci C5 (v páse) na veľký mobil na stred (442 x 800), skutočný fotoaparát 3,2 s.
- C2, C4, C5 v páse 16:9 na celú šírku, pozadie scény ide cez celú plochu (bez šedých pásov): `SceneFrameContext`
  v `Scene.tsx` (jednofarebné pozadie, bez päty), tmavé -> biele pozadie C4 synchronne so scénou. C5 bez panelu
  krokov (krok je nad obrazom) a pás sa na začiatku plynulo posunie tak, aby krabica bola na strede (a o 60 px nižšie).
- Okraj pásu nie je ostrá hrana: okno pásu má hore a dole mäkký prechod 26 px do pozadia (prestrih kancelária -> sklad
  v C2 a priblíženie skladu sa strácajú mäkko, zmizla aj sivá čiara na spodnej hrane počas bielej časti C4). C5 má väčšie
  okno (od nadpisu kroku po titulky) a scéna smie presiahnuť rámec 16:9 (`overflowVisible`), veko krabice pri priblížení
  kamery je celé. Kontrola: sken hrán pásu po snímkach (5 fps) bez orezaného obsahu.
- C8 karty pod sebou 1,3x, C9 nakreslené na výšku (lockup, slogan, výzva, web väčšie).
- Stály nadpis vypadol (miesto pre aplikáciu), hore malý riadok značky, dole veľké titulky 58 px a web.
- Titulky kreslí rámec (`Paced` má nový prop `subtitles`, klipy ho majú vypnutý), render už nepotrebuje `--props`.

Výsledok: `out/kratka/K-LinkedIn_1080p.mp4` (74,2 s, -16 LUFS), kontaktný hárok `out/kratka/K-LinkedIn-contact-sheet.png`.
Test na mobile (Gemini ako laik a správca, video 432 x 540): obaja pochopili celý postup, zväčšené detaily prečítali
("to zachránili"), samotné okno aplikácie je na mobile drobné; slová: správca ničomu, laik pilot a "Archív PD".
Opravené po teste: prázdna biela pred kartami ponuky, prázdno pod oknom na začiatku F24/F3, ostrá hrana pásu
(prestrih v C2, veko v C5, čiara v C4), bliknutie nadpisu kroku na strihu C5 -> F1. Ostáva (rozhodnutie Samuela):
úvod 18 s je podľa oboch na LinkedIn dlhý (pre mobil by chceli 35-45 s), dĺžku okolo 70 s však určil Samuel.
Teaser, krátka verzia 16:9 a verzie kola 1 sú v commite `b8552d5`.

## Rozbor pôvodnej verzie (kolo 48, 145,2 s)

- Hlas znie 112,8 zo 145,2 s (250 slov, 133 slov/min). Dĺžku určuje scenár, nie pauzy (skrátením páuz najviac ~15 s).
- Kam išiel čas: úvod a problém 28 s, predstavenie 7 s, ako to funguje 57 s (C5, F1, C6, F2, F4), databáza a hľadanie 25 s (C10, F3), ponuka a záver 29 s.
- "Spravíme to za vás" zaznie až v 1:57; Wistia radí dať podstatu do prvej polovice.
- Referencie k dĺžke: vysvetľujúce videá o produkte 60-90 s (~150 slov/min po anglicky), technický B2B produkt znesie 90-120 s.

## Výsledok kola 1 (nahradený kolom 2)

| Verzia | Dĺžka | Slov | Klipy |
|---|---|---|---|
| Pôvodná (kolo 48) | 145,2 s | 250 | C1 C2 C4 C5 F1 C6 F2 F4 C10 F3 C8 C9 |
| K, krátka | 73,9 s | 136 | K-C2 K-C4 K-C5 K-F1 K-F24 K-F3 K-C8 K-C9 |
| T, teaser | 31,0 s | 60 | T-C2 T-C4 T-C5 T-F3 T-C9 |
| K a T na výšku 4:5 (LinkedIn) | 73,6 s / 30,8 s | | kompozície K-LinkedIn, T-LinkedIn |

Filmy kola 1 sú v commite `b8552d5` (`out/kratka/K_1080p.mp4`, `T_1080p.mp4`, `K-LinkedIn_1080p.mp4`, `T-LinkedIn_1080p.mp4`).

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

Kolo 1: teaser do 30 s na reklamu, LinkedIn post okolo 45-60 s (4:5), krátka verzia 74 s na web a e-mail. Samuel v kole 2 rozhodol: iba LinkedIn verzia okolo 70 s. Otvorené otázky sú na review stránke (úvod, obhliadka zadarmo, práca na mieste, telefón, slogan, pilot/skúška).

## Ako to zopakovať

```bash
cd video && npm ci && pip install imageio-ffmpeg google-genai faster-whisper pillow numpy soundfile
export REMOTION_CHROME=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell
python3 scripts/kratka_lines.py                    # vety so `src` vyrezané z public/vo/lines -> public/vo-kratka/lines
node scripts/vo.mjs --engine gemini --reuse --script src/copy/vo_kratka.json --dir public/vo-kratka   # nové vety len ak chýbajú
python3 scripts/vo_check.py --script src/copy/vo_kratka.json --dir public/vo-kratka K-C4-Cena-0 ...   # kontrola prepisom
node scripts/cut-footage.mjs k-f1-sken k-f24-review k-f3-search   # VŽDY s id, bez nich sa prerobí aj pôvodné footage
npx remotion render K-LinkedIn out/kratka/K-LinkedIn_voice.mp4     # LinkedIn 4:5 jedným renderom (hlas, titulky)
python3 scripts/archives_logo.py                   # kolo 26 az 29: cesty a farby oficialneho loga z podklady/archives-logo-final -> src/scenes/kratka/archivesLogo.ts
python3 scripts/music_edit.py                      # kolo 21: hudba kola 15 (bed.wav) poskladana z taktov na mriezke 105 BPM, kolo 22 ticho do 2,27 s, kolo 23 stlmene vysky 2,2-5,3 s (kola 16 az 18: --variant K_kolo16, K_kolo17, K_kolo18)
node scripts/mix-music.mjs --video out/kratka/K-LinkedIn_voice.mp4 --out out/kratka/K-LinkedIn_1080p.mp4 --cfg src/copy/music_kratka.json --variant K --music public/music/bed_kratka_edit.wav   # kolo 21 az 23, aktualne (--gain -7 --range 0 ako kolo 15)
# node scripts/mix-music.mjs --video out/kratka/K-LinkedIn_voice.mp4 --out out/kratka/K-LinkedIn_1080p.mp4 --cfg src/copy/music_kratka.json --variant K_kolo15   # kolo 15 a 20: stare strihy bed.wav (104 BPM, spoj v 0:55 mimo dob)
# node scripts/mix-music.mjs --video out/kratka/K-LinkedIn_voice.mp4 --out out/kratka/K-LinkedIn_1080p.mp4 --cfg src/copy/music_kratka.json --variant K_kolo18 --music public/music/bed_kratka_kolo18_edit.wav --range 2 --gain -6.4   # kolo 18 (kolo 17: --variant K_kolo17, bed_kratka_kolo17_edit.wav, --range 6 --gain -5.5; kolo 16: --variant K_kolo16, bed_kratka_kolo16_edit.wav, --range 6 --gain -5)
```

Kontrolné stills `node scripts/kratka-stills.mjs [s ...]` (časy vo filme, do `out/kratka/stills`, nie sú v gite).

## Súbory

- Nové: `src/scenes/kratka/LinkedIn.tsx` (kompozícia K-LinkedIn 4:5, jediná krátka verzia), `src/kratkaList.ts` (`paced`, pauzy C4), `src/scenes/kratka/Kratka.tsx` (spoločné dáta: C4 so sloganom, kroky, spoty, kliky), `src/copy/vo_kratka.json`, `src/copy/music_kratka.json` (kolo 16 aj prompt a plán strihu hudby), `scripts/kratka_lines.py`, `scripts/kratka-stills.mjs`, `scripts/music_edit.py` (kolo 16), `scripts/archives_logo.py` a `src/scenes/kratka/archivesLogo.ts` (kolo 26, oficiálne logo; od kola 27 z `podklady/archives-logo-final/`), `public/music/bed_kratka.*` (kolo 16), `review-kratka/index.html`, `public/vo-kratka/`, `public/footage/k-*.mp4`, `out/kratka/`.
- Zdieľané súbory dostali len voliteľné parametre s predvolenou hodnotou hlavnej verzie: `Paced` (`audio`, `subtitles`), `Scene` (`SceneFrameContext`: jednofarebné pozadie, bez päty a bez orezania na rámec 16:9 len vnútri LinkedIn rámca), `Subtitles` (scenár K vedľa hlavného), `C4_Cena` (`d`, `h`, `brand`, `cost`, kolo 12 `clockAt`), `C5_Teren` (`steps`, `phase`), `cuts.json` (nové kľúče `k-*`), skripty `vo.mjs`, `vo_check.py` (`--script`, `--dir`) a `mix-music.mjs` (`--list`, `--clips`, `--out`, `--cfg`, `--variant`, `--video`, kolo 12 kľúč `delay` v cfg); kolo 9 až 11: `C2_Hladanie` (export `Office`, `Warehouse` a `PATH`, kolo 14 ich `floor`), `Device` (`PhoneFrame` `screenBg`).
- Kontrola: 20 snímok pôvodných klipov (C2, C4, C5, C8, C9, F1, F4) z commitu `ea5550e` a z tejto vetvy je na pixel rovnakých; dĺžky kompozícií bez zmeny.
- Jediná zmena správania pôvodnej cesty: `mix-music.mjs` dáva tichému klipu (C1) stopu v rozložení kanálov ostatných klipov (stereo namiesto mono). Zvuk je ticho, výsledok rovnaký.
