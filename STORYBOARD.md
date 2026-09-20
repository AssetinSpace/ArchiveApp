# Storyboard – Assetin Archives (kolo 2: „video, nie slajdy“)

Stav: ☐ still na schválenie · ☑ still schválený · ▶ animácia hotová · 🎞 finálne MP4

Zásady kola 2: ilustrácia na celú plochu, jediný text v obraze (≤ 7 slov, nastúpi
až po akcii), žiadna pätka ani kicker, pomalý pohyb kamery, príbuzné scény spojené
do jedného záberu. Klipy →📹 končia nájazdom do obrazovky zariadenia; posledný frame
je čistá plocha = strihový bod pre footage z aplikácie.

| ID | Klip | Pozadie | Dej (kamera) | Text v obraze | Dĺžka | Stav |
|---|---|---|---|---|---|---|
| C1-Intro | Intro | navy | Logo sa nakreslí, wordmark, titul, zelený pás | – | 4 s | ☐ ▶ |
| C2-Problem | Sklad → krabica | navy | Široký záber skladu, postavička klučkuje, „?“ vyskakujú; kamera nájde (2,6×) k jednej krabici na palete; krabica sa otvorí, zložky sa striedavo dvíhajú, počítadlo beží | 3 s „Dokumentáciu máte. Nikto ju nevie nájsť.“ · 11 s „Je to niekde tam.“ | 14 s | ☐ ▶ |
| C3-Cena | 2× | navy | Veľké 2× v strede, paleta s cenovkou „skladovanie“ + výkres s cenovkou „nové zameranie“ | 4 s „Zaplatené dvakrát za tú istú dokumentáciu.“ | 7 s | ☐ ▶ |
| C4-Teren →📹 | V sklade | biela | Dlaždica z webu ako hrdina (veko, zložky, QR), hárok nálepiek, mobil odfotí štítok (blesk, rámik), ID KR_01; nájazd do displeja mobilu → biely frame | 5 s „Nalepiť QR, odfotiť. Celá práca v teréne.“ | 10 s | ☐ ▶ |
| C5-Spracovanie →📹 | Fotka → údaje → potvrdenie | biela | Fotka štítku, OCR riadky vychádzajú, chipy „návrh“; bez strihu ✓ ✎ ✕, Rok 2016→2018, „návrh“→„overené“; okolo chipov sa objaví okno aplikácie a nájde na celý frame | 4 s „Text z fotky rozpozná a navrhne údaje.“ · 10 s „Platné až po kontrole človekom.“ | 14 s | ☐ ▶ |
| C6-Vysledok →📹 | Hierarchia → tabuľka | biela | Strom paleta→krabica→zložka→dokument, QR doskočia, sken rozsvieti vetvu; kamera sa posunie, prichádza okno s tabuľkou: dotaz, filter, breadcrumb PL/KR/ZL; nájazd do okna | 3 s „Každá položka má svoje miesto.“ · 11 s „Od dotazu k policovému miestu jeden krok.“ | 14 s | ☐ ▶ |
| C7-Pilot | Jedna krabica | biela | Zatvorená krabica, QR doskočí, ikony 1·2·3 (lupa · krabica · ponuka) | 2 s „Začneme jednou krabicou.“ | 7 s | ☐ ▶ |
| C8-Outro | Kontakt | zelená | Logo, firma, web, kontakty | – | 5 s | ☐ ▶ |

Celkovo ~75 s animácie (Full preview s prelínaním 72 s) + footage podľa strihu.

## Stills

`out/stills/<ID>_1.png` (začiatok akcie), `_2.png` (stred), `_3.png` (koniec / strihový bod).
Verzia bez textu: `npx remotion still <ID> out/x.png --frame=<n> --props='{"captions":false}'`.

## Footage z aplikácie

1. Klipy C4, C5, C6 končia čistým framom (displej mobilu / okno aplikácie na celú plochu). V strihu za ne nadväzuje footage.
2. Alternatíva v Remotione: kompozícia **FootageFrame** vloží footage do rámika zariadenia v štýle videa. Súbor do `public/footage/` (necommituje sa) a:
   `npx remotion render FootageFrame out/mp4/F1.mp4 --props='{"src":"footage/kr01.mp4","device":"phone","enter":true,"exit":false,"seconds":8}'`
   – `enter` = rámik sa na začiatku zmenší z celého framu do zariadenia (nadväzuje na koniec C4/C5/C6), `exit` = opak; `device` = `phone` alebo `window`.

## Voliteľné (mimo jadra, starý layout)

S04-Pokusy (Excel a skener), S10-Nasadenie (U nás / U vás). Kompozície vo Folder „Optional“; ak sa majú do videa, prerobia sa do jazyka C-klipov.

## Pripomienky

- kolo 1: „vyzerá ako prezentácia, priveľa textu, nie je miesto na footage“ → kolo 2 (tento stav).
- kolo 2: _čaká na spätnú väzbu k stills a `out/mp4/Full_preview_540p.mp4`; finálne MP4 až po schválení (Fáza 2)._
