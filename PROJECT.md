# Warehouse Document Archive — PROJECT.md
> Živý dokument. Aktualizovať po každom rozhodnutí alebo sprinte.
> Verzia 1.0 FINAL — Všetky otázky uzavreté. Nula otvorených blockerov. Cursor Sprint 1 môže začať.

---

## 1. Kontext a cieľ

**Situácia:**
3 fyzické sklady, každý s cca 30 paletami plnými projektovej dokumentácie.
Dokumenty sú rôznych formátov (A4–A0+, atypické rozmery).
Obsah paliet nie je zdokumentovaný — nevieme čo kde je.

**Kto to rieši:**
Konzultant (1 osoba) zodpovedný za celú správu informácií v archíve.
Appku používa primárne on, v teréne, s tabletom/telefónom.

**Ultimátny cieľ (ďaleká budúcnosť):**
Jedna filtrovateľná databáza prepojených dokumentov s metadátami,
kde sa dá vyhľadať napríklad "kolaudačné rozhodnutie pre objekt X od projektanta Y".

**Cieľ dnes (MVP):**
Vedieť čo kde fyzicky je.
Každá paleta, krabica a zložka má jednoznačné ID.
K zložke je priradená fotografia štítku.
Výstup: exportovateľný inventár.

---

## 2. Zásadné rozhodnutia (log)

| # | Rozhodnutie | Dôvod | Dátum |
|---|---|---|---|
| 1 | Metadáta sa neštandardizujú vopred | Štítky sú random, schéma vznikne po prvých 50–100 zložkách | — |
| 2 | Každá zložka dostane vlastné ID + QR | Jednoznačná referencia bez závislosti na obsahu štítku | — |
| 3 | Granularita MVP = zložka, nie dokument | Dokumenty vnútri zložky sú fáza 2 | — |
| 4 | QR povinný na krabicu, voliteľný na zložku | Krabíc je menej, zložiek príliš veľa na povinné QR | — |
| 5 | Foto je primárny zdroj pravdy, OCR je surový text vedľa fotky | OCR sa neinterpretuje — slúži len pre fulltext search | — |
| 7 | Foto storage = Cloudflare R2 (nie lokálny filesystem) | Efemérny filesystem na cloude by spôsobil stratu fotiek pri reštarte. R2 free tier 10 GB pokryje celý projekt. | — |

---

## 3. Fyzická hierarchia

```
Sklad              (3 sklady, označené A / B / C)
└── Paleta         (~30 ks / sklad, QR odporúčaný)
    └── Krabica    (QR povinný — primárna scan jednotka)
        └── Zložka (QR voliteľný, ID povinné — KONTAJNER, nie list)
            └── Dokument   (fáza 2 — model to unesie, teraz nevypĺňame)
                └── Výkres (fáza 3)
```

**Architektonické rozhodnutie — homogénny strom:**
Každá úroveň je `Item` s `parent_id`. Typ určuje `ItemType`, nie štruktúra tabuľky.
Zložka je plnohodnotný kontajner — nie listový uzol. Jej deti (dokumenty)
zatiaľ nevznikajú, ale model to unesie bez budúcej zmeny schémy.

Fáza 2 = len nové `ItemType` záznamy (DOKUMENT, VYKRES) + UI pre ich vytváranie.
Žiadna migrácia dátového modelu nebude potrebná.

**Atypické kontajnery (tubusy, role, voľné dokumenty):**
Neriešime špeciálne. Vytvorí sa Item typu KRABICA s popisným názvom (napr. "Tubus" alebo "Voľné výkresy"). Žiadny extra typ v MVP.

---

## 4. Informačný model (MVP)

### 4.1 Každá položka (Item) má:
- `id` — UUID, generovaný systémom, interné DB ID
- `type_code` — SKLAD / PALETA / KRABICA / ZLOZKA (MVP). DOKUMENT / VYKRES prídu v fáze 2.
- `name` — ľudský názov, voliteľný (napr. "Krabica pri okne", "Paleta č.3")
- `parent_id` — UUID nadradenej položky (nullable = koreň stromu)
- `qr_code` — externý QR kód z nálepky, napr. `QR-000042` (nullable, unique)
- `note` — voľné textové pole, čokoľvek (nullable)
- `status` — NA_MIESTE / VYNESENE / NEZNÁME
- `created_at`, `updated_at`

### 4.2 Každá fotka (Photo) má:
- `id`
- `item_id` — väzba na položku
- `storage_url` — plná R2 URL pre zobrazenie (signed URL generovaná on-demand)
- `storage_key` — R2 object key (napr. `photos/2024/QR-000023-001.jpg`) pre správu súboru
- `ocr_raw_text` — surový text vrátený Tesseract (nullable)
- `ocr_status` — PENDING / DONE / FAILED
- `created_at`

> Backend nikdy neukladá fotku lokálne. Upload = priamy stream do R2.
> Pre zobrazenie sa generuje časovo obmedzená signed URL (15 min).
> DB neobsahuje binárne dáta — len referencie.

### 4.3 Čo zatiaľ NIE JE v modeli (fáza 2):
- Štruktúrované metadáta (projektant, rok, typ dokumentu...) — vzniknú po analýze OCR korpusu
- Prepojenia medzi dokumentmi
- Pohybový log / výpožičky
- Používatelia a oprávnenia

### 4.4 Metadátová stratégia — dvojkroková:
> **Krok 1 (teraz):** "Capture first" — každá zložka má foto + OCR raw text.
> Žiadna štruktúra sa nevynucuje. Fulltext search cez surový OCR text stačí
> na základné vyhľadávanie.
>
> **Krok 2 (po ~200 zložkách):** Analyzovať OCR korpus — aké slová sa opakujú,
> aké vzory existujú — a z toho odvodiť štruktúrované metadátové polia.
> Až vtedy pridať voliteľné štruktúrované polia do modelu.

### 4.5 OCR workflow — dvojfázový (terén vs. doma)

**Terén (sklad, telefón, slabé pripojenie):**
Upload fotky = okamžitý. `ocr_status = PENDING`. Žiadne čakanie, ide sa ďalej.

**Doma / kancelária (batch post-processing):**
Spustiť `npm run ocr:batch` — prejde všetky fotky s `PENDING`, spustí
Tesseract lokálne, uloží `ocr_raw_text`, nastaví `DONE`.

OCR teda nie je súčasť upload flow — je to samostatný krok ktorý beží
kedy je to pohodlné. Appka funguje plne aj bez OCR textu (hľadanie
cez `note` a `name` stále funguje).

**OCR služba pre MVP:** Tesseract (open source, self-hosted, zadarmo).
Prepnutie na Google Cloud Vision je zmena jedného service súboru — rozhodnutie
sa odloží na moment keď budeme mať reálne dáta a budeme vedieť
či Tesseract presnosť stačí.

---

## 5. Kľúčové use cases (MVP)

### UC-1: Inventarizácia v teréne
```
Prídem k palete
→ Naskenujem / vytvorím QR krabice
→ Odfotím krabicu (vonkajší popis ak existuje)
→ Otvorím krabicu → prechádzam zložkami
→ Každej zložke priradím ID (naskenujem alebo vytvorím QR)
→ Odfotím štítok zložky
→ Pridám voliteľnú poznámku
→ Ďalšia zložka
```
**Výstup:** Krabica je zaznamenaná v systéme, zložky sú fotené.

### UC-2: Nájsť kde niečo je
```
Viem že hľadám "kolaudáciu pre objekt Modrý kríž"
→ Otvorím search → zadám kľúčové slovo
→ Systém vráti zložky ktorých fotky alebo poznámky obsahujú text
→ Vidím lokáciu: Sklad A → Paleta 7 → Krabica 23
```

### UC-3: Scan v sklade
```
Som fyzicky pri krabici
→ Naskenujem QR kód krabice
→ Vidím zoznam všetkých zložiek v tejto krabici s ich fotkami
→ Nájdem čo hľadám bez otvárania
```

### UC-4: Export inventára
```
Chcem report pre klienta / pre seba
→ Kliknem Export
→ Stiahnem Excel/CSV s: ID, typ, lokácia, status, poznámka, odkaz na foto
```

---

## 6. Čo NIE JE cieľom MVP (out of scope)

- Skenovanie obsahu dokumentov — len štítky zložiek
- Interpretácia OCR textu / extrakcia štruktúrovaných polí (to je fáza 2)
- Viacero používateľov / autentifikácia
- Výpožičkový systém s termínmi
- Prepojenie na externé systémy
- Mobilná app (stačí responzívny web)
- Preskladávanie paliet (to je fyzická operácia, nie IT)

---

## 7. Tech stack (rozhodnuté)

| Vrstva | Technológia | Poznámka |
|---|---|---|
| Frontend | Vite + React + TypeScript | Responzívny web — funguje na telefóne aj PC |
| Backend | Node.js + Express + TypeScript | |
| Databáza | PostgreSQL + Prisma ORM | |
| Hosting | Railway alebo Render (cloud VPS) | ~5–10€/mes, HTTPS automaticky |
| Foto storage | Cloudflare R2 | Free tier 10 GB, egress zadarmo, S3-kompatibilné API. Backend streamuje priamo do R2, DB ukladá R2 URL. Žiadny lokálny filesystem. |
| QR scan | zxing-js (browser kamera) + manuálny vstup | Funguje v mobile Chrome bez inštalácie |
| OCR | Tesseract (self-hosted, open source) | Batch script, spúšťa sa doma na PC |
| Auth | MVP: HTTP Basic Auth (1 env premenná) → Fáza 2: Microsoft OAuth (passport-azure-ad) | MS OAuth = klient sa prihlási firemným MS365 účtom, žiadne nové heslá |
| Export | CSV / Excel generovaný na backende | |

---

## 8. Sprint plán

### Sprint 0 — Príprava (pred kódom)
- [ ] Nakúpiť QR nálepky (odporúčam 200 ks pre začiatok, napr. Avery L4732)
- [ ] Otestovať tlač QR — rozmer, čitateľnosť telefónom na rôznych vzdialenostiach
- [ ] Vytvoriť GitHub repozitár (private, monorepo `frontend/` + `backend/`)
- [ ] Vytvoriť Railway projekt + PostgreSQL addon + Cloudflare R2 bucket
- [ ] Nastaviť doménu (CNAME na Railway)
- [ ] Urobiť "suchý beh" — prejsť jednu reálnu krabicu perom a papierom, zaznamenať čo vidíme na štítkoch
- [ ] Rozhodnúť OQ-9 (kde beží Tesseract)
- **Výstup:** Infraštruktúra pripravená, vieme čo je reálne na štítkoch, Cursor môže začať

### Sprint 1 — Základ (core data model + základné API)
**Cieľ:** Môžem vytvoriť položku, priradiť jej rodičovskú položku, uložiť poznámku. Appka je chránená.
- [ ] Prisma schema: Item, ItemType, QRTag, Photo
- [ ] HTTP Basic Auth middleware (BASIC_AUTH_USER + BASIC_AUTH_PASS z env)
- [ ] API: POST /items, GET /items/:id, PATCH /items/:id
- [ ] API: GET /items/:id/children, GET /items/:id/path
- [ ] Seed: ItemTypes + 3 sklady + pár paliet ako testovací fixture
- [ ] UI: jednoduchá stránka — vytvor položku, vyber rodiča zo zoznamu
- **Testovací scenár:** Vytvoriť Sklad A → Paleta 1 → Krabica 3 → Zložka 001 a zobraziť celú path. Overiť že bez hesla appka vráti 401.

### Sprint 2 — QR + Scan flow
**Cieľ:** Môžem naskenovať QR kód a dostať sa k položke. V teréne.
- [ ] QR generovanie + tlač (PDF s QR štítkami)
- [ ] Kamerový scanner v UI (zxing-js)
- [ ] Flow: scan → ak voľný QR → priraď k položke / ak obsadený → otvor položku
- [ ] UI: Scan stránka + Item detail stránka (info, status, parent, children)
- **Testovací scenár:** Vytlačiť 5 QR, nalepiť na krabice, naskenovať → vidieť obsah

### Sprint 3 — Fotky + OCR batch
**Cieľ:** Odfotím štítok v teréne (okamžite), OCR prebehne neskôr doma ako batch.
- [ ] Multipart upload fotky — rýchly, neblokujúci, `ocr_status = PENDING`
- [ ] `npm run ocr:batch` script — Tesseract na všetky PENDING fotky, uloží `ocr_raw_text`
- [ ] UI: upload fotky v Item detail, náhľad fotky, zobrazenie OCR textu ak existuje
- [ ] Badge "čaká na OCR" ak `ocr_status = PENDING`
- [ ] Voľné textové pole `note` editovateľné inline
- **Testovací scenár:** Nafotiť 10 zložiek v teréne → doma spustiť batch → skontrolovať výsledky Tesseract

### Sprint 4 — Search + Export
**Cieľ:** Môžem nájsť zložku podľa čohokoľvek čo je na štítku, a exportovať inventár.
- [ ] Search endpoint: ILIKE / PostgreSQL fulltext cez `name`, `note`, `ocr_raw_text`
- [ ] UI: search bar + výsledky s lokáciou path + náhľad fotky
- [ ] Export: CSV so všetkými položkami (ID, typ, lokácia, status, note, ocr_text snippet)
- [ ] UI: stránka "Obsah krabice" — scan krabice → zoznam zložiek s fotkami a OCR textom
- [ ] Po dokončení: analýza OCR korpusu — aké slová sa opakujú → návrh metadátovej schémy
- **Testovací scenár:** Nájsť zložku podľa mena projektanta alebo názvu objektu z OCR textu

---

## 9. Otvorené otázky

| # | Otázka | Kto rozhodne | Priorita |
|---|---|---|---|
| OQ-1 | ~~Formát ID?~~ **ROZHODNUTÉ: UUID = interné DB id. QR kód formát `QR-000001` až `QR-999999` (6 číslic, sekvenčný) = externý identifikátor na nálepke. 999 999 kódov pokryje projekt s veľkou rezervou.** | — | — |
| OQ-2 | ~~QR nálepky?~~ **ROZHODNUTÉ: Tlačiť vopred v dávkach (napr. 100 ks), importovať ako FREE, nalepiť fyzicky pred skenovaním, priradiť pri skenovaní v teréne.** | — | — |
| OQ-3 | ~~Voľné dokumenty a tubusy?~~ **ROZHODNUTÉ: Neriešime v MVP. Ak treba, vytvorí sa Item typu KRABICA s názvom "Tubus" alebo "Voľné". Žiadny špeciálny typ.** | — | — |
| OQ-4 | ~~Atypické kontajnery fyzicky?~~ **ROZHODNUTÉ: Viď OQ-3. Krabica s popisným názvom stačí.** | — | — |
| OQ-5 | ~~Kde beží appka?~~ **ROZHODNUTÉ: Cloud VPS — Railway alebo Render (~5–10€/mes). Telefón v teréne cez mobilné dáta / hotspot. PC doma pre OCR batch. Budúci skener = PC pripojený na cloud.** | — | — |
| OQ-6 | ~~OCR služba?~~ **ROZHODNUTÉ: Tesseract, batch, po návrate zo skladu.** | — | — |
| OQ-7 | Ručne písané štítky — ak Tesseract presnosť bude nízka, riešiť manuálnym prepísaním do `note`? | Konzultant | Nízka |
| OQ-8 | Pečiatka s číslom ako fallback — zaviesť ako oficiálny backup postup? | Konzultant | Nízka |
| OQ-9 | ~~Kde beží Tesseract?~~ **ROZHODNUTÉ: Na Railway serveri. nixpacks.toml pridá Tesseract ako system dependency. OCR batch sa volá cez API endpoint POST /ocr/process-pending — spustíš z PC prehliadačom alebo curl príkazom.** | — | — |
| OQ-10 | **Auth stratégia — ROZHODNUTÉ:** Sprint 1 = HTTP Basic Auth (1 env premenná, 20 minút). Fáza 2 = Microsoft OAuth cez `passport-azure-ad` — klient sa prihlási firemným MS365 účtom. Fáza 3 = roly (konzultant / klient read-only / admin). | — | — |

---

## 10. Definícia "hotovo" pre MVP

MVP je hotové keď:
1. Všetky krabice v jednom sklade sú zaznamenané v systéme s lokáciou
2. Každá zložka má ID a aspoň jednu fotku štítku
3. Systém vráti lokáciu (sklad → paleta → krabica) keď zadám QR kód zložky
4. Export do CSV funguje
5. Appka je použiteľná na mobile v sklade (responzívna, rýchla)

---

## 11. Infraštruktúra a GitHub workflow

### Repozitár
```
GitHub: private repo  "warehouse-archive"
├── frontend/         Vite + React + TypeScript
├── backend/          Node.js + Express + TypeScript + Prisma
├── scripts/          ocr-batch.ts, export.ts, import-qr.ts
├── PROJECT.md        tento dokument
└── .env.example      zoznam potrebných env premenných
```

### Deploy pipeline
```
Cursor (lokálny vývoj)
    │  git push → GitHub (private)
    │  automatický webhook
    ▼
Railway
    ├── Backend service  (Node.js, auto-deploy z /backend)
    ├── PostgreSQL addon  (managed, zálohy automaticky)
    └── Vlastná doména   (CNAME → Railway, HTTPS automaticky)

Cloudflare R2
    └── Bucket: warehouse-photos  (fotky, trvalé, egress zadarmo)
```

### Doména
Ak máš existujúcu doménu: pridaj CNAME záznam `archiv.tvojadomena.sk → Railway URL`.
Ak nemáš: `porkbun.com` alebo `namecheap.com`, ~8–12€/rok.
Nastaviť hneď od začiatku — Railway URL je nepraktická na mobile.

### Env premenné (`.env` na Railway, lokálne v `.env.local`)
```
DATABASE_URL          PostgreSQL connection string (Railway dá automaticky)
R2_ACCOUNT_ID         Cloudflare account ID
R2_ACCESS_KEY_ID      R2 API kľúč
R2_SECRET_ACCESS_KEY  R2 API secret
R2_BUCKET_NAME        warehouse-photos
R2_PUBLIC_URL         https://... (pre signed URLs)
BASIC_AUTH_USER       meno pre HTTP Basic Auth (MVP)
BASIC_AUTH_PASS       heslo pre HTTP Basic Auth (MVP)
```

### Postup nastavenia (Sprint 0, pred prvým commitom)
1. Vytvoriť GitHub repo, naklónovať lokálne
2. Vytvoriť Railway projekt → Add PostgreSQL → skopírovať `DATABASE_URL`
3. Vytvoriť Cloudflare účet → R2 → nový bucket → API token
4. Nastaviť doménu (CNAME)
5. `.env.example` commitnúť do repo, `.env.local` nikdy (gitignore)
6. Prvý commit: len prázdna štruktúra + PROJECT.md → verify že Railway deploy prebehol

---


## 12. Prenositeľnosť a export dát

**Princíp:** Práca konzultanta musí byť odovzdateľná IT tímu objednávateľa
bez závislosti na akejkoľvek platforme alebo vendorovi.

### Čo PostgreSQL umožňuje (kedykoľvek, bez poplatku):

| Formát | Príkaz / nástroj | Kto to otvorí |
|---|---|---|
| SQL dump | `pg_dump` | Každý Postgres klient (pgAdmin, DBeaver, psql) |
| CSV sada | `COPY TO` | Excel, Python, R, Access, ktokoľvek |
| JSON strom | export skript (Sprint 4) | Každý moderný systém, akýkoľvek jazyk |

### Čo dostane IT tím objednávateľa:
1. `dump.sql` — kompletná databáza (schéma + dáta), importovateľná do akéhokoľvek PostgreSQL
2. `export.json` — hierarchický strom všetkých položiek s metadátami a OCR textom
3. `photos/` — stiahnutý R2 bucket s fotkami (rclone, jeden príkaz)
4. `README.md` — popis schémy, ako importovať, ako sa orientovať v dátach

### Architektonické pravidlo (platí od Sprintu 1):
> Nikdy nedenormalizovať. Každá informácia žije na jednom mieste,
> prepája sa cez UUID. Žiadne kopírované hodnoty.
> Toto zaručuje konzistentnosť exportu kedykoľvek počas projektu.

### Kedy sa export pripraví:
- Sprint 4: JSON export endpoint (živý, volateľný cez API)
- Fáza odovzdania: SQL dump + foto archív + README balík

---

*Posledná aktualizácia: v1.0 FINAL — všetky OQ uzavreté, nula blockerov*
*Ďalší krok: Cursor prompt pre Sprint 1 →*
