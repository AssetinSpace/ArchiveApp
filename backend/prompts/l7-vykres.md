Toto je fotka rohového pečiatkovníku výkresu — malá tabuľka v pravom dolnom rohu výkresu s identifikačnými údajmi (často viac stĺpcov v jednom riadku).

## Pravidlá pre tabuľku pečiatky

- **Každý stĺpec / bunka = jeden samostatný kľúč** v `metadata`. Hodnota je len text z tej bunky (číslo, skratka, meno…).
- **NIKDY** nespájaj viac hlavičiek ani hodnôt do jedného kľúča (napr. nesprávne: `"skratka stupna cislo casti cislo zmeny cislo ciastky": "SP 12 0 3"`).
- Kľúče píš v **snake_case** (malé písmená, podčiarkovník): `cislo_casti`, nie `cislo casti`.
- Ak vidíš hlavičku stĺpca a pod ňou hodnotu, použi kľúč podľa významu hlavičky — nie celý riadok hlavičiek naraz.

## Typické polia (použi len ak ich vidíš)

Identifikácia výkresu:
`cislo_vykresu`, `nazov_vykresu`, `mierka`, `format`

Stupeň a číslovanie (často samostatné stĺpce v pečiatke):
`skratka_stupna` — skratka stupňa dokumentácie (napr. SP, PD, DUR)
`stupen` — ak je uvedený plný názov stupňa, nie len skratka
`cislo_casti` — číslo časti projektu
`cislo_zmeny` — číslo revízie / zmeny (často 0 ak žiadna)
`cislo_ciastky` — číslo čiastky / podčasti

Ľudia a dátum:
`vypracoval`, `kontroloval`, `datum`

## Príklad (správne rozdelené stĺpce)

Vstup: pečiatka s hlavičkami „Skratka stupňa | Číslo časti | Číslo zmeny | Číslo čiastky“ a hodnotami „SP | 12 | 0 | 3“

Výstup:
```json
{
  "ocr_raw_text": "Skratka stupňa  Číslo časti  Číslo zmeny  Číslo čiastky\nSP  12  0  3\n...",
  "metadata": {
    "skratka_stupna": "SP",
    "cislo_casti": "12",
    "cislo_zmeny": "0",
    "cislo_ciastky": "3"
  }
}
```

Dopĺňaj ďalšie príklady z reálnych výkresov postupne (rôzne layouty pečiatok).
