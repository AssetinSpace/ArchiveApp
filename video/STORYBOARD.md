# Storyboard – Assetin Archives (kolo 16)

Stav: ☐ still na schválenie · ☑ still schválený · ▶ animácia hotová · 🎞 finálne MP4

Zásady: ilustrácia na celú plochu v jednej mierke (1 jednotka = 1 cm, viď README),
jediný text v obraze (≤ 7 slov) v caption zóne y 860–980, do ktorej ilustrácia
nesiaha (kontroluje `scripts/check-stills.mjs`); QR čierno-biele, zelená len na
dianí okolo (rámik skenu, blesk, glow); žiadna simulácia UI aplikácie – klipy →📹
končia nájazdom do obrazovky zariadenia a posledný frame je čistá plocha =
strihový bod pre footage; náhľad Full má tvrdé strihy. Titulky v obraze sú od kola 9 vypnuté.

| ID | Klip | Pozadie | Dej | Text v obraze | Dĺžka | Stav |
|---|---|---|---|---|---|---|
| C1-Intro | Intro | navy | Lockup podľa assetin-design-kitu: stohovaný logotyp „assetin“ / „.space“ vypláva, zvislý oddeľovač sa nakreslí, „Archives“ vyjde spoza neho; hold; „Archives“ sa zasunie späť, oddeľovač sa stiahne, logotyp sa priblíži a vybledne do navy | – | 5 s | ☐ ▶ |
| C2-Kancelaria | Skriňa pri stole | navy | Zelený panáčik príde ku skrini (stolička pred stolom), otvorí krídlo (otáča sa okolo pántu), vnútri šanóny so štítkami, rolky, listy; hľadá („?“ nad hlavou sa jemne vznášajú), vyhadzuje veci – šanón so štítkom, rolka a papiere vyletia oblúkom a dopadnú pred skriňou | 3 s „Dokumentáciu máte. Nikto ju nevie nájsť.“ | 8 s | ☐ ▶ |
| C3-Sklad | Sklad → regál | navy | Sklad je na scéne hneď; zelená postavička klučkuje uličkou (cesta pod objektmi) a zastaví pred stredným regálom, dva „?“; kamera nájde na jeho hornú policu s dvoma krabicami (regál bez vrchnej dosky, vidno do krabíc), sklad vybledne; prvá krabica: veko sa odklopí, vidno dno a zložky vnútri, zložky sa postupne vyberú a vrátia (pri prvej zložke vyletí bublinka „?“ a zanikne), veko dole; to isté druhá; nič sa nenašlo, väčší „?“ | 3 s „V sklade to nie je lepšie.“ · 10,5 s „Je to niekde tam.“ | 13 s | ☐ ▶ |
| C4-Cena | 2× | navy | Začína rovnakým regálom ako koniec C3; regál sa odsunie doľava, vedľa neho veľký „?“, vedľa hodiny rovnakej veľkosti s točiacou sa ručičkou (hľadanie trvá), šípka k výkresu s pečiatkou (rýchlejšie spraviť nanovo); veľké cenovky pod regálom a výkresom; „2× €€€“ dole v strede | 5,8 s „Zaplatené dvakrát za tú istú dokumentáciu.“ | 9 s | ☐ ▶ |
| C5-Teren →📹 | V sklade | biela | Zatvorená krabica, priletí hárok nálepiek A4, z neho odletí QR na krabicu; veko sa otvorí, zložky vyjdú a z hárku priletia QR na každú zložku; zložky majú štítky s textom; predná sa vytiahne z krabice, mobil sa k nej priblíži a zameria na štítok, blesk, ID ZL_12; kamera nájde na zložku s mobilom a potom nájazd do displeja → biely frame = strih do reality (footage fotenia štítku) | 5 s „Nalepiť QR, odfotiť. Celá práca v teréne.“ | 10 s | ☐ ▶ |
| C6-Spracovanie →📹 (?) | Fotka → aplikácia | biela | Bez zmeny; možno vypadne a footage pôjde rovno za C5 | 3 s „Text z fotky rozpozná a navrhne údaje.“ | 7 s | ☐ ▶ |
| C7-Hierarchia →📹 | Hierarchia + sken | biela | Začína tou istou krabicou ako C5 (KR_01), kamera sa oddiali, vedľa sa objavia dve rovnaké krabice s medzerou a KR_01 sa do nej zaradí; nad ňou vyrastie prázdna polica (2 rady), pod ňou zložky a dokumenty; mobil naskenuje krabicu, vetva sa zvýrazní zelenou čiarou; kamera nájde späť na policu, krabice sa do nej poukladajú (všetky s menším QR); mobil vľavo hľadá a nájde KR_01 – tá krabica sa zvýrazní (obrys, značka), ostatné stmavnú; strom vybledne, mobil nájde na celý frame → footage | 3 s „Každá položka má svoje miesto.“ | 12 s | ☐ ▶ |
| C8-Pilot | Jedna krabica | biela | Bez zmeny (upraví sa neskôr) | 2 s „Začneme jednou krabicou.“ | 7 s | ☐ ▶ |
| C9-Outro | Outro | zelená | Logo, wordmark, „Assetin, s. r. o.“, web. Bez kontaktov | – | 5 s | ☐ ▶ |

Celkovo 76 s animácie + footage podľa strihu.

## Stills a kontrola

`out/stills/<ID>_1.png` (začiatok akcie), `_2.png` (stred), `_3.png` (koniec / strihový bod).
`npm run stills` po renderi spustí `scripts/check-stills.mjs` – hlási, ak ilustrácia
zasahuje do pásu nad caption zónou. Titulky v obraze sú zatiaľ vypnuté (doriešia sa neskôr); zapne ich `--props='{"captions":true}'` alebo `CAP=1 npm run render`.

## Footage z aplikácie

1. C5, C6, C7 končia čistým framom (displej mobilu / okno aplikácie na celú plochu). V strihu za ne nadväzuje footage.
2. Alternatíva v Remotione: **FootageFrame** vloží footage do rámika zariadenia. Súbor do `public/footage/` (necommituje sa):
   `npx remotion render FootageFrame out/mp4/F1.mp4 --props='{"src":"footage/kr01.mp4","device":"phone","enter":true,"exit":false,"seconds":8}'`
   – `enter` = rámik sa na začiatku zmenší z celého framu do zariadenia, `exit` = opak; `device` = `phone` alebo `window`.

## Voliteľné (mimo jadra, starý layout)

S04-Pokusy (Excel a skener), S10-Nasadenie (U nás / U vás) vo Folder „Optional“.

## Pripomienky

- kolo 1: „vyzerá ako prezentácia, priveľa textu, nie je miesto na footage“ → kolo 2.
- kolo 2: „mierka ikon nesedí, chýba kancelária, texty sa prekrývajú s ikonami, simulácia UI je zbytočná (príde footage), zelené QR, presahy medzi scénami“ → kolo 3 (tento stav).
- kolo 3 + oprava QR/kancelárie: schválené → Fáza 2 (finálne MP4).
- kolo 4 až 16 (pripomienky z review stránky, viď FEEDBACK.md): zapracované; nové MP4 na review stránke.

## Review stránka

Všetky klipy prehrateľné v prehliadači s pripomienkami ku každému:
https://claude.ai/artifact/R2aK5Ms7zxVvtKM4SjHCJa (súkromná, vlastník + zdieľaní).
Pripomienky sa ukladajú do databázy stránky (kolekcia `feedback`, doc = ID klipu + `general`)
a Claude si ich číta priamo odtiaľ.

## Odovzdanie do strihu (Fáza 2)

Všetko 1920×1080, 30 fps, H.264, yuv420p (obmedzený rozsah), bez zvuku.

| Súbor | Obsah |
|---|---|
| `out/mp4/C1-Intro.mp4` … `C9-Outro.mp4` | klipy bez textu v obraze (titulky vypnuté, doriešia sa neskôr) |
| `out/mp4/Full_1080p.mp4` | všetkých 9 klipov za sebou, tvrdé strihy, 76 s – kontrola tempa |
| `out/mp4/Full_preview_540p.mp4` | to isté v polovičnom rozlíšení |
| `out/mp4/F_phone_enter.mp4`, `F_window_enter.mp4` | placeholder rámika zariadenia (8 s), do ktorého sa v Remotione dá vložiť footage |
| `out/stills/contact-sheet.png` | stredný frame každého klipu v mriežke |

Strihové body: C5, C6 a C7 končia na čistej ploche (displej mobilu / okno aplikácie na celý frame) –
tam nadväzuje footage z aplikácie na celú plochu. Ak má footage bežať v rámiku zariadenia, použiť
`FootageFrame` (viď vyššie) s `enter: true`, aby rámik nadviazal na koniec klipu.
