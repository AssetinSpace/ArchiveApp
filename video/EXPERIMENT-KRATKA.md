# Experiment: kratšie video pre LinkedIn (27. 9. 2026)

Vetva `claude/video-assets-archives-exp-la1hts`, vychádza z `main` (commit `ea5550e`, kolo 48).
Review stránka experimentu: https://claude.ai/artifact/Y6R9zZWRh7VNqCNk9dnjg3
(hlavná review stránka R2aK5Ms7zxVvtKM4SjHCJa ostala bez zmeny).

## Zadanie a rozhodnutia Samuela

- Zistiť, ako video zefektívniť, aby bolo kratšie, zrozumiteľné pre bežného laika a stále vysvetlilo všetko; posúdiť dĺžku.
- Nové vety tým istým hlasom smú byť. Cieľ je LinkedIn post, ktorý zaujme hneď, "možno ešte kratšie".
- Dĺžka: okolo 75 s a k tomu 30 s teaser. Ponuku (C8) nechal na mňa.
- Pôvodnú verziu nechytať, je to vstup. Hlas a hudbu negenerovať znova (existujúce nahrávky sa len strihajú).

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
node scripts/mix-music.mjs --video out/kratka/K-LinkedIn_voice.mp4 --out out/kratka/K-LinkedIn_1080p.mp4 --cfg src/copy/music_kratka.json --variant K
```

Kontrolné stills `node scripts/kratka-stills.mjs [s ...]` (časy vo filme, do `out/kratka/stills`, nie sú v gite).

## Súbory

- Nové: `src/scenes/kratka/LinkedIn.tsx` (kompozícia K-LinkedIn 4:5, jediná krátka verzia), `src/kratkaList.ts` (`paced`, pauzy C4), `src/scenes/kratka/Kratka.tsx` (spoločné dáta: C4 so sloganom, kroky, spoty, kliky), `src/copy/vo_kratka.json`, `src/copy/music_kratka.json`, `scripts/kratka_lines.py`, `scripts/kratka-stills.mjs`, `review-kratka/index.html`, `public/vo-kratka/`, `public/footage/k-*.mp4`, `out/kratka/`.
- Zdieľané súbory dostali len voliteľné parametre s predvolenou hodnotou hlavnej verzie: `Paced` (`audio`, `subtitles`), `Scene` (`SceneFrameContext`: jednofarebné pozadie, bez päty a bez orezania na rámec 16:9 len vnútri LinkedIn rámca), `Subtitles` (scenár K vedľa hlavného), `C4_Cena` (`d`, `h`, `brand`, `cost`, kolo 12 `clockAt`), `C5_Teren` (`steps`, `phase`), `cuts.json` (nové kľúče `k-*`), skripty `vo.mjs`, `vo_check.py` (`--script`, `--dir`) a `mix-music.mjs` (`--list`, `--clips`, `--out`, `--cfg`, `--variant`, `--video`, kolo 12 kľúč `delay` v cfg); kolo 9 až 11: `C2_Hladanie` (export `Office`, `Warehouse` a `PATH`, kolo 14 ich `floor`), `Device` (`PhoneFrame` `screenBg`).
- Kontrola: 20 snímok pôvodných klipov (C2, C4, C5, C8, C9, F1, F4) z commitu `ea5550e` a z tejto vetvy je na pixel rovnakých; dĺžky kompozícií bez zmeny.
- Jediná zmena správania pôvodnej cesty: `mix-music.mjs` dáva tichému klipu (C1) stopu v rozložení kanálov ostatných klipov (stereo namiesto mono). Zvuk je ticho, výsledok rovnaký.
