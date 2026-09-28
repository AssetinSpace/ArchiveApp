# Experiment: kratšie video pre LinkedIn (27. 9. 2026)

Vetva `claude/video-assets-archives-exp-la1hts`, vychádza z `main` (commit `ea5550e`, kolo 48).
Review stránka experimentu: https://claude.ai/artifact/Y6R9zZWRh7VNqCNk9dnjg3
(hlavná review stránka R2aK5Ms7zxVvtKM4SjHCJa ostala bez zmeny).

## Zadanie a rozhodnutia Samuela

- Zistiť, ako video zefektívniť, aby bolo kratšie, zrozumiteľné pre bežného laika a stále vysvetlilo všetko; posúdiť dĺžku.
- Nové vety tým istým hlasom smú byť. Cieľ je LinkedIn post, ktorý zaujme hneď, "možno ešte kratšie".
- Dĺžka: okolo 75 s a k tomu 30 s teaser. Ponuku (C8) nechal na mňa.
- Pôvodnú verziu nechytať, je to vstup. Hlas a hudbu negenerovať znova (existujúce nahrávky sa len strihajú).

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
node scripts/mix-music.mjs --video out/kratka/K-LinkedIn_voice.mp4 --out out/kratka/K-LinkedIn_1080p.mp4 --cfg src/copy/music_kratka.json --variant K
```

Kontrolné stills `node scripts/kratka-stills.mjs [s ...]` (časy vo filme, do `out/kratka/stills`, nie sú v gite).

## Súbory

- Nové: `src/scenes/kratka/LinkedIn.tsx` (kompozícia K-LinkedIn 4:5, jediná krátka verzia), `src/kratkaList.ts` (`paced`, pauzy C4), `src/scenes/kratka/Kratka.tsx` (spoločné dáta: C4 so sloganom, kroky, spoty, kliky), `src/copy/vo_kratka.json`, `src/copy/music_kratka.json`, `scripts/kratka_lines.py`, `scripts/kratka-stills.mjs`, `review-kratka/index.html`, `public/vo-kratka/`, `public/footage/k-*.mp4`, `out/kratka/`.
- Zdieľané súbory dostali len voliteľné parametre s predvolenou hodnotou hlavnej verzie: `Paced` (`audio`, `subtitles`), `Scene` (`SceneFrameContext`: jednofarebné pozadie, bez päty a bez orezania na rámec 16:9 len vnútri LinkedIn rámca), `Subtitles` (scenár K vedľa hlavného), `C4_Cena` (`d`, `h`, `brand`, `cost`), `C5_Teren` (`steps`, `phase`), `cuts.json` (nové kľúče `k-*`), skripty `vo.mjs`, `vo_check.py` (`--script`, `--dir`) a `mix-music.mjs` (`--list`, `--clips`, `--out`, `--cfg`, `--variant`, `--video`).
- Kontrola: 20 snímok pôvodných klipov (C2, C4, C5, C8, C9, F1, F4) z commitu `ea5550e` a z tejto vetvy je na pixel rovnakých; dĺžky kompozícií bez zmeny.
- Jediná zmena správania pôvodnej cesty: `mix-music.mjs` dáva tichému klipu (C1) stopu v rozložení kanálov ostatných klipov (stereo namiesto mono). Zvuk je ticho, výsledok rovnaký.
