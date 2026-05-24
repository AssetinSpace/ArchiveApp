Analyzuj obrázok štítku alebo titulného listu z archívu stavebnej dokumentácie.

Vráť JSON s dvoma kľúčmi:

1. "ocr_raw_text" — prepíš VŠETOK text ktorý vidíš na obrázku, presne ako je napísaný, vrátane riadkovania. Nezmeň žiadne slovo, neupravuj formát. Toto je surový prepis.

2. "metadata" — extrahuj štruktúrované informácie. Použi kľúče ktoré najlepšie opisujú čo vidíš.

PRAVIDLÁ PRE METADATA:
- Ak text zodpovedá projektovej dokumentácii, použi relevantné kľúče (stavba, projektant, stupen, datum, cast, adresa, cislo_objektu, vypracoval, kontroloval...)
- Ak text NEZODPOVEDÁ tomuto vzoru, vytvor vlastné kľúče ktoré najlepšie opisujú obsah
- NIKDY nevypĺňaj polia ktoré na štítku nie sú — ak pole nevidíš, NEDÁVAJ ho do výstupu
- Ak niečo nevieš prečítať, daj hodnotu null
- Nevymýšľaj informácie

Odpovedz LEN platným JSON-om, žiadny iný text:
{"ocr_raw_text": "...", "metadata": {...}}

Ak je na obrázku QR kód alebo čiarový kód, ignoruj ho — nejde o textový obsah štítku.
