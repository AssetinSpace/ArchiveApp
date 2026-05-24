# ArchiveApp — PROJECT.md
> Živý dokument. Aktualizovať po každom rozhodnutí alebo sprinte.
> Verzia 2.12.0 — Post-Sprint 8 údržba: Excel-style filtre a zoradenie stĺpcov v inventárnej tabuľke (URL stav); export CSV s celým OCR textom a klikateľnými URL fotiek.

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

| # | Rozhodnutie | Dôvod |
|---|---|---|
| 1 | Metadáta sa neštandardizujú vopred | Štítky sú random, schéma vznikne po prvých 50–100 zložkách |
| 2 | Každá zložka dostane vlastné ID + QR | Jednoznačná referencia bez závislosti na obsahu štítku |
| 3 | Granularita MVP = zložka, nie dokument | Dokumenty vnútri zložky sú fáza 2 |
| 4 | QR povinný na krabicu, voliteľný na zložku | Krabíc je menej, zložiek príliš veľa na povinné QR |
| 5 | Foto = primárny zdroj pravdy, OCR = surový text pre search | OCR sa neinterpretuje — len fulltext search |
| 6 | Foto storage = Cloudflare R2 | Efemérny filesystem na Railway by spôsobil stratu fotiek |
| 7 | UUID interné + QR-000001 externé | UUID = DB, QR kód = fyzická nálepka |
| 8 | Tesseract OCR na Railway serveri, batch cez API endpoint | Bez inštalácie na PC, volá sa z browsera |
| 9 | HTTP Basic Auth pre MVP, MS OAuth pre fázu 2 | Solo MVP nevyžaduje komplexnú auth |
| 10 | Frontend = Cloudflare Pages, Backend = Railway | Statický build na Pages, API na Railway |
| 11 | Domény: archiveapp.assetin.space (frontend), archiveapp-api.assetin.space (backend) | Čisté oddelenie frontend/backend |
| 12 | Railway prešiel na Railpack builder — nixpacks.toml ignorovaný | Railway zmenil default builder v 2025, riešené cez railpack.json deploy.aptPackages |
| 13 | OCR lang = slk+eng, PSM 1 (auto OSD) | Slovenské štítky s diakritikou, PSM 1 zvláda rotáciu fotiek (chrbet zložky 90°) |
| 14 | Search cez `unaccent` extension + ILIKE, nie tsvector | Jeden riadok migrácie, čisté raw SQL, dostatočné pre ~5000 záznamov. GIN/tsvector ostáva ako TD-10 ak bude treba |
| 15 | CSV export = UTF-8 s BOM, oddelovač `;`, CRLF | Default Excel SK — bez BOM stratí diakritiku, bez `;` zlúči stĺpce, bez CRLF prerieduje riadky |
| 16 | Export fotiek: verejná URL (`R2_PUBLIC_URL`) alebo signed URL len pri výbere stĺpcov odkazov | UI používa 15 min signed URL. CSV/JSON export odkazov: preferuje trvalú verejnú URL; bez `R2_PUBLIC_URL` signed URL na 7 dní (dostatočné na otvorenie exportu, nie na dlhodobú archiváciu). Hromadný download fotiek = rclone (§11). |
| 17 | Sprint 4 endpoints používajú `prisma.$queryRaw` | Prisma neumožňuje volať `unaccent()` ani `WITH RECURSIVE` priamo v `where` — raw SQL je čistejšie ako Unsupported workaround |
| 18 | ~~Auto-name z pozície v hierarchii~~ (**deprecated v 2.9**) | Nahradené rozhodnutím #29 — generovaný `name` podľa `kind` + počtu súrodencov. `auto_name` stĺpec ostáva v DB pre legacy záznamy, pre nové položky sa negeneruje. |
| 19 | ~~LLM title extraction~~ (Sprint 5, **zrušené v 2.8**) | Nahradené rozhodnutím #27 — metadata-only |
| 20 | ~~Potvrdiť OCR title → `name`~~ (Sprint 5, **zrušené v 2.8**) | `name` ostáva len ručný popis; štruktúrované info ide do JSONB metadata |
| 21 | JSONB `metadata` pole pripravené pre Sprint 6, nenaplňuje sa v Sprint 5 | Schéma metadata sa odvodí z analýzy ~200 reálnych OCR textov po field work — predčasná štandardizácia by viedla k zlej štruktúre |
| 22 | Gemini 2.5 Flash namiesto Claude Haiku pre LLM title extraction | 6–7× lacnejší (~$0.27 za celý archív batch), dostatočná kvalita pre OCR text extraction zo slovenských stavebných štítkov. Free tier pre testovanie, platená úroveň pred ostrým nasadením. |
| 23 | Photo má `photo_type` enum LABEL/OVERVIEW; LABEL ide do OCR pipeline, OVERVIEW slúži ako vizuálna referencia (krabica/paleta) | V teréne konzultant často odfotí aj samotnú krabicu/paletu, nielen štítok — bez rozlíšenia by tieto fotky inflovali PENDING/FAILED OCR štatistiky a LLM batch by ich zbytočne ťahal. OVERVIEW dostane pri uploade rovno `ocr_status = DONE` aby PENDING count zodpovedal reálnej fronte štítkov; OCR endpointy navyše filtrujú `photo_type = 'LABEL'` (dvojitá ochrana proti legacy dátam). |
| 24 | Metadata extraction = separátny LLM call od `ocr_title` (paralelné workflows) | Halucinácia v jednom poli (napr. dátum) nesmie zrušiť potvrdený titul. Stavy `metadata_status` (NONE → EXTRACTED → REVIEWED) bežia nezávisle od `ocr_title_status`, vlastný route `/api/llm-metadata/*`, vlastná admin stránka `/admin/llm-metadata`. Konfirm metadata neprepisuje `name`. |
| 25 | Metadata JSONB hybrid schéma — prompt dáva **príklady** typických polí, LLM môže pridať ďalšie kľúče; backend ukladá permisívne | Štítky sú variabilné (rozhodnutie #1). UI/export majú labels pre odporúčané polia (stavba, cast, …); neznáme kľúče sa zobrazia a dajú editovať v review. Známe polia log bez warning, neznáme s warning. |
| 26 | Items table tree-style ostáva default; Sprint 7 metadata stĺpce sa pridávajú do existujúceho `ItemsDataTable` s warning štýlom pre `EXTRACTED` hodnoty (žltkasté pozadie + badge „návrh") | Konzistentnosť cez celý produkt — žiadna paralelná „flat 17-stĺpcová" tabuľka. Default sú nové stĺpce skryté (úzke obrazovky), konzultant si zapne v "Stĺpce ▾". Viditeľnosť stĺpcov v localStorage (`archiveapp_items_table_columns_v1`); filtre a zoradenie v URL (`cf`, `sort`) — pozri #40. |
| 27 | **Metadata-only** — LLM title workflow (`ocr_title`, `/admin/llm-titles`) zrušený | Jeden AI kanál: hybrid JSONB metadata z OCR. `name` len ručne (voliteľne), identita = `auto_name` + QR. Prompt dáva príklady polí (nie povinnú 7-polovú schému), LLM môže pridať ďalšie kľúče. Search prehľadá celé `metadata` cez `jsonb_each_text`. Export: každý metadata kľúč = vlastný stĺpec (`meta_stavba`, …); voliteľne `metadata_json`; dialóg výberu stĺpcov pred CSV/JSON. |
| 28 | **Flexibilná 7-úrovňová hierarchia** — `type_code` enum nahradený dvojicou `level` (Int 1–7) + `kind` (String, otvorený) | Terénny test odhalil že fyzická realita skladu nezodpovedá pevnému enum: existujú ohradky, police s vlastnými kódmi, rôzne typy kontajnerov. `level` = nemenná pozícia v strome, `kind` = fyzický typ objektu — predvolené hodnoty v UI, ale konzultant môže napísať čokoľvek. Legacy záznamy dostanú `level` a `kind` z `type_code` cez migráciu. |
| 29 | **Generovaný `name` podľa `kind` + počtu súrodencov** namiesto `auto_name` reťazca | `auto_name` (`sklA_pal003_kra007`) bol redundantný — breadcrumb z `parent_id` poskytuje tú istú informáciu čitateľnejšie. Nový generovaný name je jednoduchý: `polica_5`, `krabica_12`, `zlozka_7`. Sledovaný cez `name_source` enum (GENERATED / OCR / MANUAL). |
| 30 | **`name_source`** — nové pole sledujúce pôvod názvu položky | Tri stavy: `GENERATED` (automatický pri vytvorení), `OCR` (navrhnutý z OVERVIEW fotky, konzultant potvrdil), `MANUAL` (konzultant prepísal ručne). Pre L2/L3 po OVERVIEW fotke systém navrhne nastavenie `name` z OCR — rovnaký banner pattern ako `metadata_status = EXTRACTED`. |
| 31 | **`kind` je otvorený String v DB, nie Prisma enum** | UI ponúka dropdown s predvolenými hodnotami per level. Posledná možnosť vždy „Vlastné…" — otvorí textové pole. Backend uloží čokoľvek bez validácie. Žiadna migrácia ak sa v teréne objavia nové typy. Predvolené hodnoty per level: L1=SKLAD, L2=OHRADKA/CAST, L3=POLICA/PALETA/REGAL, L4=KRABICA/TUBA, L5=ZLOZKA/EUROOBAL/ZAKLADAC, L6=EUROOBAL/OBALKA, L7=DOKUMENT/VYKRES. |
| 32 | **Zóny hierarchie**: L1–L4 = lokácia, L5–L6 = kontajner (metadata ✓), L7 = listový node | L1–L4 popisujú kde niečo fyzicky je. L5–L6 sú kontajnery obsahu — tu žijú metadata (stavba, projektant, rok…). L7 je listový node: fotí sa prvá strana dokumentu (LABEL foto → OCR → metadata), nemá deti, QR sa neprideľuje. L6 je voliteľný sub-kontajner (euroobal vo zložke) — väčšina ciest pôjde L4→L5→L7. |
| 33 | **L7 je súčasťou MVP** (nie fáza 2) s obmedzeným scope | L7 (dokument/výkres) sa fotí (prvá strana), OCR prebehne, metadata sa extrahujú rovnako ako pre L5/L6. Rozdiel: L7 nemá deti (listový node), QR sa neprideľuje, OVERVIEW foto nemá zmysel. Granularita obsahu krabice sa teda zvýšila: krabica → zložka → dokument je plne funkčný strom v MVP. |
| 34 | **Gemini 2.5 Flash Vision namiesto Tesseract** — jeden batch call vráti `ocr_raw_text` + `metadata` JSONB naraz | Tesseract zlyháva na malých písmenách, tabuľkových bunkách a mixed-case texte (napr. „Ing. VÁRY" v rohových pečiatkovníkoch). Gemini Vision číta obrázky natívne, rozumie layoutu a kontextu tabuľky. Jeden API call namiesto dvoch služieb (Tesseract→text + Gemini text→metadata). `ocr_raw_text` sa vždy zachováva pre fulltext search a zálohu. Batch model ostáva nezmenený (terén=upload+PENDING, doma=batch process). Tesseract ostáva v `railpack.json` ako offline fallback — prepnutie cez `OCR_ENGINE` env premennú. Manuálny review (`metadata_status` workflow EXTRACTED→REVIEWED) ostáva povinný. Existujúci `GEMINI_API_KEY` podporuje Vision — žiadna zmena v kľúčoch ani billing. |
| 35 | **Prompt registry** — `backend/prompts/` MD súbory per level+kind, backend skladá `base.md` + `{level-kind}.md` | Štítky v archíve majú rôzne vizuálne formáty: chrbtica zložky (L5) ≠ titulný list (L7 DOKUMENT) ≠ rohový pečiatkovník (L7 VYKRES). Prompt musí obsahovať reálne príklady z archívu aby Gemini nehalucinoval. Súbory sa dopĺňajú postupne z terénneho skenovania. Ak súbor pre daný level+kind neexistuje, fallback na samotný `base.md`. Zmena promptu = git commit, žiadny redeploy kódu. |
| 36 | **Soft delete položiek** — `deleted_at` timestamp, bez hard delete z DB | Omyl v teréne nesmie stratiť históriu. Export/search/inventory filtrujú `deleted_at IS NULL`. Fotky v R2 a QR väzby ostávajú (TD-8 cleanup R2 až neskôr). |
| 37 | **Kaskádové mazanie vetvy** — `DELETE /items/:id?cascade=true` | Položka s deťmi sa inak nedá zmazať. Rekurzívny CTE nastaví `deleted_at` na celej podstrome. UI: ✕ v tabuľke + „Zmazať vrátane podradených" v detaile, confirm s počtom potomkov (`GET …/descendants/count`). |
| 38 | **Obnova zmazaných položiek zatiaľ nie** — žiadny koš v UI, žiadny `restore` endpoint | Archivácia = soft delete. Obnova je možná len manuálne v DB (`deleted_at = NULL`) alebo zo zálohy `pg_dump`. Plný workflow (koš, cascade restore, validácia rodiča/QR/názvu) = TD-21, riešiť po field work / na požiadanie. |
| 39 | **Export CSV — voliteľné stĺpce OCR (celý text) a URL skenu** | `ocr_raw_text` = plný `ocr_raw_text` z hlavnej LABEL fotky (fallback OVERVIEW / zreťazenie viacerých). `scan_photo_url` = jedna klikateľná URL hlavnej fotky. `photo_urls` = všetky fotky položky (riadky oddelené `\n` v bunke). Stĺpec `photos` (detail) obsahuje aj `url`. Mapovanie kľúčov → SK popisky zdieľané medzi tabuľkou a exportom (`metadataLabels`). |
| 40 | **Inventárna tabuľka — filtre a zoradenie per stĺpec v URL** | Excel-style hodnotové filtre (checkbox zoznam unikátnych hodnôt + počty, vrátane „(Prázdne)“) a A→Z / Z→A zoradenie cez menu v hlavičke stĺpca (`ItemsTableColumnHeader`). Funguje pre základné stĺpce aj dynamické `meta_*`. Strom pri filtroch zobrazí zhodné položky + predkov; zoradenie rekurzívne na každej úrovni stromu. URL: `cf=kind~SKLAD,KRABICA;meta_stavba~foo` a `sort=name` / `sort=-created_at`. Výber viditeľných stĺpcov ostáva v localStorage (`archiveapp_items_table_columns_v1`), filtre/sort v URL (zdieľateľný odkaz). Stĺpce `expand` a `delete` bez filtra. |

---

## 3. Fyzická hierarchia

```
L1  Sklad              (označenie manuálne, napr. "HBR")
└── L2  Časť / Ohradka (QR odporúčaný; name z OCR štítku na dverách alebo manuálne)
    └── L3  Polica     (QR odporúčaný; name z OCR hrany police, napr. "S-HBR-AS-2-02")
        └── L4  Krabica (QR povinný — primárna scan jednotka)
            └── L5  Zložka / Zakladač (kontajner, metadata ✓)
                └── L6  Euroobal / Obálka (voliteľný sub-kontajner, metadata ✓)
                    └── L7  Dokument / Výkres (listový node, foto prvej strany, metadata ✓)
```

**Pravidlá stromu:**
- `level` je Int 1–7, určuje pozíciu v hierarchii, nikdy sa nemení po vytvorení
- `kind` je String — predvolené hodnoty v UI, vlastný text povolený
- L6 je voliteľný — väčšina ciest: L4 → L5 → L7
- L7 nemá deti (backend odmietne POST /items s parent na L7)
- Každá úroveň je `Item` s `parent_id` — homogénny strom

**Atypické kontajnery (tubusy, voľné dokumenty):**
Riešia sa cez `kind` = "Tuba" alebo "Voľný dokument" na príslušnom leveli — žiadna špeciálna logika.

---

## 4. Informačný model (MVP)

### 4.1 Item
- `id` — UUID (interné)
- `level` — Int 1–7, pozícia v hierarchii, **immutable** po vytvorení (nové pole v 2.9)
- `kind` — String, fyzický typ objektu, predvolené hodnoty per level, vlastný text povolený (nové pole v 2.9)
- `name` — ľudský názov; pri vytvorení = generovaný (`polica_5`), nahraditeľný OCR návrhom alebo manuálne
- `name_source` — `GENERATED` / `OCR` / `MANUAL` (nové pole v 2.9)
- `type_code` — **deprecated** (ostáva v DB pre legacy záznamy, v UI skryté)
- `parent_id` — UUID rodiča (nullable = koreň)
- `qr_code` — externý kód z nálepky, napr. `QR-000042` (nullable, unique)
- `note` — voľné textové pole (nullable)
- `status` — NA_MIESTE / VYNESENE / NEZNAME
- `auto_name` — **deprecated** (ostáva v DB pre legacy záznamy, pre nové položky sa negeneruje)
- `metadata` — JSONB, default `{}`. Aktívne pre L5, L6, L7. Pre L1–L4 prázdne.
- `metadata_status` — `NONE` / `EXTRACTED` / `REVIEWED`
- `deleted_at` — soft delete (nikdy hard delete)
- `created_at`, `updated_at`

### 4.2 QRTag
- `id` — UUID
- `code` — napr. "QR-000001" (unique)
- `status` — FREE / ASSIGNED
- `assigned_item_id` — nullable UUID
- `created_at`

### 4.3 Photo
- `id` — UUID
- `item_id` — väzba na Item
- `storage_key` — R2 object key (napr. `photos/2026/{itemId}/{uuid}.jpg`)
- `ocr_raw_text` — surový Tesseract text (nullable, `@db.Text`)
- `ocr_status` — PENDING / DONE / FAILED
- `photo_type` — LABEL / OVERVIEW. Pre L7 vždy LABEL (prvá strana dokumentu). Pre L2/L3 OVERVIEW → po OCR navrhne name update (nie metadata).
- `created_at`
- `deleted_at` — soft delete

**Signed URL** sa NEUKLADÁ v DB. Generuje sa on-demand.

### 4.4 Metadátová stratégia
**Capture first, classify later:**
- L1–L4: foto (OVERVIEW), OCR navrhne `name`, žiadne štruktúrované metadata
- L5–L7: foto (LABEL), OCR → Gemini → JSONB metadata (stavba, projektant, rok…)

### 4.5 OCR + Metadata workflow (Gemini Vision)
- **Terén:** upload foto → `ocr_status = PENDING` → okamžitý return
- **Doma:** `POST /api/ocr/process-pending` → Gemini 2.5 Flash Vision → jeden call vráti `ocr_raw_text` + `metadata` JSONB → uloží oboje, `metadata_status = EXTRACTED`
- **Engine:** `OCR_ENGINE=gemini` (default), `OCR_ENGINE=tesseract` (fallback — len OCR, bez metadata)
- **Prompt:** `base.md` + `{level}-{kind}.md` z `backend/prompts/` — príklady per typ štítku
- **L2/L3 OVERVIEW:** po spracovaní zobrazí banner „Nastaviť názov na [OCR text]?" — konzultant potvrdí alebo upraví → `name_source = OCR`
- **Review povinný:** `metadata_status` workflow EXTRACTED → REVIEWED sa nemení. Gemini výstup = návrh, nie finálny stav.

### 4.6 Prompt registry (`backend/prompts/`)
```
backend/prompts/
├── base.md              ← spoločné pravidlá (nevymýšľaj, daj null, vráť JSON)
├── l5-zlozka.md         ← príklady štítkov na chrbte zložky
├── l7-dokument.md       ← príklady titulných listov projektov
└── l7-vykres.md         ← príklady rohových pečiatkovníkov
```
Backend skladá: `base.md` + súbor pre `{level}-{kind}`. Ak neexistuje → len `base.md`.
Dopĺňanie príkladov = git commit, žiadny redeploy kódu.

### 4.7 Name generation
Pri `POST /api/items`:
1. Zistiť `kind` z requestu (povinné)
2. Spočítať súrodencov rovnakého `kind` pod rovnakým `parent_id`
3. `name = "{kind_lowercase}_{count+1}"` napr. `polica_5`, `zlozka_12`
4. `name_source = GENERATED`
5. Konzultant môže kedykoľvek prepísať → `name_source = MANUAL`

### 4.8 Archivácia a mazanie (soft delete)

**Čo sa deje pri zmazaní**
- Položka: `Item.deleted_at = now()` — riadok ostáva v PostgreSQL.
- Fotka: samostatný soft delete (`Photo.deleted_at`) — mazanie položky **nezmazá** fotky automaticky.
- QR: `Item.qr_code` a `QRTag.assigned_item_id` ostávajú; zmazaná položka sa nezobrazuje v UI, nové priradenie QR vyžaduje aktívnu položku.
- Export / search / inventárna tabuľka: len `deleted_at IS NULL`.

**API (implementované)**
| Metóda | Endpoint | Popis |
|---|---|---|
| `DELETE` | `/api/items/:id` | Zmazanie listovej položky (bez aktívnych detí). |
| `DELETE` | `/api/items/:id?cascade=true` | Soft delete položky + celého podstromu (rekurzívne). |
| `GET` | `/api/items/:id/descendants/count` | Počet všetkých nezmazaných potomkov (pre confirm v UI). |
| `DELETE` | `/api/photos/:id` | Soft delete jednej fotky. |

**UI (implementované)**
- `ItemsDataTable` — stĺpec ✕; pri vetve oranžové ✕ + confirm s počtom potomkov; mobile: väčší tap target, sticky stĺpec, `pointer` handlery proti scroll kontajneru.
- `ItemDetailPage` — sekcia „Zmazať položku"; s deťmi tlačidlo „Zmazať vrátane podradených (N)".

**Obnova (zatiaľ mimo produktu)**
- V aplikácii **nie je** obrazovka Koš ani tlačidlo Obnoviť.
- Manuálna obnova: SQL `UPDATE "Item" SET deleted_at = NULL WHERE …` (pri kaskáde obnoviť celú vetvu + skontrolovať, že rodič nie je zmazaný).
- Havária / starý stav: `pg_dump` záloha (§11), nie beh aplikácie.
- **Budúce TD-21:** `POST /items/:id/restore?cascade=true`, admin Koš, kontroly (živý rodič, konflikt `name` pod rodičom, QR už priradený inde).

### 4.9 Export stĺpcov (CSV / JSON)

**API:** `GET /api/export/columns` (katalóg), `GET|POST /api/export/csv`, `GET|POST /api/export/json` (`format`: `tree` | `flat`).

**Skupiny stĺpcov:** položka (`id`, `path`, `level`, `kind`, …), metadata (`meta_{kľúč}` z JSONB), fotky/OCR, technické (`metadata_json`, dátumy).

**Fotky / OCR (voliteľné v dialógu exportu):**
| ID | Popis |
|---|---|
| `ocr_text_preview` | Prvých ~100 znakov (jedna riadok) |
| `ocr_raw_text` | Celý OCR text hlavnej skenovacej fotky |
| `scan_photo_url` | Jedna URL — hlavná LABEL fotka (klikateľné v Exceli) |
| `photo_urls` | Všetky fotky položky, URL oddelené novým riadkom |
| `photos` | JSON pole s `storageKey`, `url`, `ocrRawText`, … |

**URL fotiek:** `R2_PUBLIC_URL` + `storage_key` → trvalý odkaz; inak signed URL (7 dní) generovaná pri exporte.

### 4.10 Inventárna tabuľka — filtre a zoradenie stĺpcov

**Komponenty:** `ItemsDataTable`, `ItemsTableColumnHeader`, `itemsTableColumnFilter.ts`, `itemsTableCellValue.ts`, `useItemsTableUrlState`.

**Globálne filtre (URL, existujúce):** `s` (text), `levels`, `status`, `hasQr`, `hasPhoto`.

**Filtre stĺpcov (URL `cf`):** multi-select hodnôt per stĺpec; unikátne hodnoty s počtom položiek; prázdne bunky ako `(Prázdne)` (`__empty__` interné). Podporované stĺpce: `level`, `kind`, `name`, `name_source`, `metadata_status`, `qr_code`, `status`, `note`, `children`, `photos`, `created_at`, `updated_at`, ľubovoľné `meta_{kľúč}`.

**Zoradenie (URL `sort`):** jeden aktívny stĺpec; `sort=columnId` (vzostupne) alebo `sort=-columnId` (zostupne). Triedenie súrodencov v strome; podstromy rekurzívne rovnakým pravidlom. Dátumy numericky, text `sk` locale.

**UI:** tlačidlo ▾ v hlavičke → menu (portal, reposition pri scroll/resize); sekcie Zoradiť + Filtrovať; vyhľadávanie v zozname hodnôt; Všetko / Nič; indikátor aktívneho filtra/zoradenia (▲/▼). Fullscreen režim tabuľky zachovaný.

**Vymazanie filtrov:** „Vymazať filtre“ resetuje globálne aj `cf` + `sort`.

---

## 5. Kľúčové use cases (MVP)

### UC-1: Inventarizácia v teréne
```
Prídem k poličke → odfotím hranu (OVERVIEW) → OCR navrhne name "S-HBR-AS-2-02" → potvrdím
→ skenuj QR krabice → otvor krabicu
→ každej zložke odfot štítok (LABEL) → OCR → metadata batch doma
```

### UC-2: Nájsť kde niečo je
```
Hľadám "kolaudáciu pre objekt X"
→ search → výsledky s lokáciou: Sklad HBR → Ohradka 24 → Polica S-HBR-AS-2-02 → Krabica krabica_7
```

### UC-3: Scan v sklade
```
Naskenuj QR krabice → vidím všetky zložky s fotkami → nájdem bez otvárania
```

### UC-4: Filtrovať inventár v tabuľke
```
Otvorím Položky → inventárna tabuľka
→ v hlavičke stĺpca „Druh" vyberiem len KRABICA a ZLOZKA
→ zoradím podľa „Názov" A→Z
→ URL obsahuje cf a sort — môžem poslať kolegovi odkaz s rovnakým výrezom
```

### UC-5: Export inventára
```
Export → dialóg výberu stĺpcov (všetko / výber / sync s tabuľkou inventára)
→ CSV (SK hlavičky, BOM, ;) alebo JSON (strom alebo plochý zoznam)
→ každý kľúč z JSONB metadata = samostatný stĺpec; metadata_json voliteľné
→ voliteľne: OCR text (celý), odkaz na sken (foto), odkazy na všetky fotky — klikateľné v Exceli ak je R2_PUBLIC_URL
```

### UC-6: Zmazať chybnú vetvu v teréne
```
Omylom vytvorená paleta s krabicami → v zozname položiek ✕ (alebo detail)
→ confirm „zmazať aj N podradených" → celá vetva v koši (soft delete)
→ v exporte/search už nie je; obnova zatiaľ len cez DB zálohu (TD-21)
```

---

## 6. Out of scope (MVP)

- Skenovanie celého obsahu dokumentov (len prvá strana pre L7)
- Viacero používateľov / role
- Výpožičkový systém s termínmi
- Prepojenie na externé systémy
- Natívna mobilná app (responzívny web stačí)
- Obnova zmazaných položiek z UI (koš / restore) — **odložené**, pozri §4.8 a TD-21

---

## 7. Tech stack

| Vrstva | Technológia | Stav |
|---|---|---|
| Frontend | Vite + React + TypeScript | ✓ live |
| Backend | Node.js + Express + TypeScript + Prisma | ✓ live |
| Databáza | PostgreSQL (Railway addon) | ✓ live |
| Frontend hosting | Cloudflare Pages | ✓ live |
| Backend hosting | Railway (Railpack builder) | ✓ live |
| Foto storage | Cloudflare R2 (archiveapp-photos) | ✓ live (Sprint 3a) |
| QR scan | @zxing/browser (kamera) + manuálny input | ✓ live |
| OCR | ~~Tesseract 5.3.0~~ → Gemini 2.5 Flash Vision, batch endpoint, `OCR_ENGINE` env switch | ✓ live (Sprint 8, Tesseract fallback) |
| Auth MVP | HTTP Basic Auth | ✓ live |
| Auth fáza 2 | Microsoft OAuth (passport-azure-ad) | ⬜ po MVP |
| Search | Fulltext ILIKE cez name, note, celé JSONB metadata, ocr_raw_text + `strip_diacritics()` | ✓ live (Sprint 4 + 7 + 2.8) |
| Export | CSV/JSON: výber stĺpcov, `meta_*`, OCR celý text, URL fotiek (`R2_PUBLIC_URL` / 7d signed), `GET/POST /export/*` | ✓ live (Sprint 4 + 2.11) |
| Inventárna tabuľka | Strom + výber stĺpcov (localStorage), Excel-style filtre/zoradenie per stĺpec (URL `cf`, `sort`), fullscreen | ✓ live (Sprint 7 + 2.11 + 2.12) |
| Name generation | `kind_lowercase + počet súrodencov` pri POST /items | ✓ live (Sprint 8) |
| LLM Metadata | ~~Separátny Gemini text call~~ → zlúčený s Vision OCR do jedného callu | ✓ live (Sprint 8; text fallback pre `OCR_ENGINE=tesseract`) |
| Prompt registry | `backend/prompts/` MD súbory per level+kind, base.md + {level-kind}.md | ✓ live (Sprint 8) |
| Hierarchia | 7 úrovní, level + kind, name_source | ✓ live (Sprint 8) |
| Mazanie položiek | Soft delete, kaskáda `?cascade=true`, počet potomkov | ✓ live (post-Sprint 8) |
| Obnova z koša | — | ⬜ TD-21 (zámerne odložené) |

---

## 8. Domény a infraštruktúra

```
archiveapp.assetin.space        → Frontend (Cloudflare Pages)
archiveapp-api.assetin.space    → Backend API (Railway)
```

### Railway env premenné
```
DATABASE_URL          postgresql://... (Railway PostgreSQL addon)
BASIC_AUTH_USER       admin
BASIC_AUTH_PASS       [silné heslo — uložené v heslovníku]
FRONTEND_URL          https://archiveapp.assetin.space
R2_ACCOUNT_ID         324e558ab210cbc41f1f20e2a3aa4a01
R2_ACCESS_KEY_ID      [z Cloudflare Account API tokenu]
R2_SECRET_ACCESS_KEY  [z Cloudflare Account API tokenu]
R2_BUCKET_NAME        archiveapp-photos
R2_PUBLIC_URL         [R2 public URL]
GEMINI_API_KEY        [API key z aistudio.google.com]
OCR_ENGINE            gemini   (alebo "tesseract" pre fallback)
NODE_ENV              production
```

### Cloudflare Pages env premenné
```
VITE_API_URL          https://archiveapp-api.assetin.space/api
```

### R2 CORS Policy
```json
[{
  "AllowedOrigins": ["https://archiveapp.assetin.space", "http://localhost:5173"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3600
}]
```

### Railway build/deploy config
```
Root directory:       backend
Build command:        npm install && npx prisma generate && npm run build
Pre-deploy command:   npx prisma migrate deploy
Start command:        npx tsx prisma/seed.ts && node dist/index.js
```

### Cloudflare Pages build config
```
Framework preset:     React (Vite)
Root directory:       frontend
Build command:        npm run build
Build output dir:     dist
```

### GitHub repo
```
AssetinSpace/ArchiveApp (private)
├── frontend/         Vite + React + TypeScript
├── backend/          Node.js + Express + TypeScript + Prisma
│   ├── railpack.json deploy.aptPackages: tesseract-ocr, tesseract-ocr-eng, tesseract-ocr-osd, tesseract-ocr-slk
│   ├── prompts/      Gemini Vision prompt súbory (base.md + per level-kind)
│   └── src/types/node-tesseract-ocr.d.ts
├── PROJECT.md        tento dokument
└── .env.example      template env premenných
```

---

## 9. Sprint plán

### Sprint 8 — Flexibilná hierarchia + Gemini Vision OCR ✓ HOTOVÝ

**Backend — hierarchia:**
- ✓ Prisma migrácia `add_level_kind_name_source`; `type_code` / `auto_name` deprecated nullable
- ✓ Migrácia dát zo `type_code` → `level` + `kind`
- ✓ `services/nameGeneration.ts`
- ✓ `POST /api/items` — level/kind, validácia `level <= parent.level + 1`, `name_source`
- ✓ `PATCH /api/items/:id/name`, `POST confirm-ocr-name`, `POST dismiss-ocr-name`
- ✓ Export CSV/JSON — `level`, `kind`, `name_source`, dynamické `meta_*`; `GET/POST /api/export/*`, `GET /export/columns`; dialóg výberu stĺpcov
- ✓ Search — `kind` v ILIKE

**Backend — Gemini Vision OCR:**
- ✓ `services/visionProcessing.ts` — Vision call → `ocr_raw_text` + `metadata`
- ✓ `services/promptLoader.ts` + `backend/prompts/` (base, l5-zlozka, l7-dokument, l7-vykres)
- ✓ `OCR_ENGINE` gemini (default) / tesseract; async batch cez `setImmediate`
- ✓ `services/ocr.ts` + `llmMetadata.ts` zachované ako fallback
- ✓ L2/L3 OVERVIEW → `processOverviewForName` pri `OCR_ENGINE=gemini`

**Frontend:**
- ✓ Create item — kind dropdown + vlastný typ, level z parenta
- ✓ ItemDetail — `name_source` badge, OCR name banner (L2/L3), `updateItemName`
- ✓ ItemsDataTable — `level`, `kind`, `name_source`
- ✓ OCR admin — engine badge, `item_kind` / `item_level` v recent

### Sprint 7 — JSONB Metadata Extraction ✓ HOTOVÝ
- ✓ Backend `services/llmMetadata.ts`, `routes/llmMetadata.ts`
- ✓ FE `LlmMetadataAdminPage.tsx`, `ItemDetailPage` MetadataBanner
- ✓ Search cez celé JSONB metadata

### Sprint 6 — Photo type LABEL vs OVERVIEW ✓ HOTOVÝ (field test ⬜)
- ✓ Prisma migrácia `add_photo_type`
- ✓ Backend routes/photos.ts, routes/ocr.ts
- ✓ Frontend PhotoUpload, PhotoGallery
- ⬜ Field test v sklade

### Údržba po Sprint 8 (máj 2026) ✓ čiastočne hotová

**Mazanie a archivácia**
- ✓ `DELETE /items/:id` + `?cascade=true` + `GET …/descendants/count`
- ✓ FE: mazanie v `ItemsDataTable` (vrátane mobile tap), `ItemDeleteSection` s kaskádou
- ⬜ Obnova zmazaných (koš, restore API) — TD-21
- ⬜ Dev skript na vyčistenie testovacích dát v DB (wipe) — len lokálne, nie produkcia

**Export a inventárna tabuľka (2.11)**
- ✓ `backend/src/services/exportColumns.ts` — katalóg stĺpcov, dynamické `meta_*`, skupina Fotky/OCR
- ✓ Nové export stĺpce: `ocr_raw_text`, `scan_photo_url`, `photo_urls` (+ existujúci `ocr_text_preview`, `photos` s poľom `url`)
- ✓ `buildPhotoUrlMap` — `getPublicUrlForKey` (`R2_PUBLIC_URL`) alebo signed URL 7 dní; async pred generovaním CSV/JSON
- ✓ `GET /api/export/columns`, `POST /api/export/csv|json` s `{ columns, format }`
- ✓ FE: `ExportColumnsModal`, `ColumnPickerModal`, sync „Ako v tabuľke inventára", prefs `archiveapp_export_columns_v1`
- ✓ FE: `ItemsTableColumnsModal`, metadata stĺpce v `ItemsDataTable`, zdieľané SK labely (`metadataLabels` BE+FE)
- ✓ OCR admin: error tracking / diagnostika (predchádzajúci commit)
- ⬜ Overiť v produkcii `R2_PUBLIC_URL` (trvalé odkazy v CSV) — bez neho odkazy expirujú po 7 dňoch

**Inventárna tabuľka — filtre a zoradenie (2.12)**
- ✓ `ItemsTableColumnHeader` — menu filter + sort (portal, mobil/desktop)
- ✓ `itemsTableColumnFilter.ts` — parsovanie/serializácia URL `cf` a `sort`, `sortInventoryTree`
- ✓ `itemsTableCellValue.ts` — hodnoty buniek pre filter/sort, vrátane `meta_*`
- ✓ `useItemsTableUrlState` — rozšírené o `columnFilters`, `tableSort`, `setColumnFilter`, `setTableSort`
- ✓ `ItemsDataTable` — krok filtrovania stĺpcov, rekurzívne zoradenie stromu, badge počtu aktívnych filtrov

### Sprint 5 — Auto-naming + LLM Title Extraction ✓ HOTOVÝ (auto_name deprecated v 2.9)

### Sprint 4 — Search + Export ✓ HOTOVÝ

### Sprint 3b — OCR ✓ HOTOVÝ

### Sprint 3a — Fotky + R2 ✓ HOTOVÝ

### Sprint 2 — QR + Scan flow ✓ HOTOVÝ (s bugmi TD-5/6/7)

### Sprint 1 — Dátový model + API ✓ HOTOVÝ

### Sprint 0 — Infraštruktúra ✓ HOTOVÝ

---

## 10. Definícia "hotovo" pre MVP

1. ⬜ Všetky krabice v jednom sklade zaznamenané s lokáciou *(field work)*
2. ⬜ Každá zložka má ID a aspoň jednu fotku štítku *(field work)*
3. ✓ Systém vráti lokáciu keď zadám QR kód zložky
4. ✓ Export do CSV funguje
5. ✓ Appka použiteľná na mobile v sklade

**Stav:** Technické MVP HOTOVÉ (3/5 bodov). Sprint 8 (hierarchia + Vision OCR) je predpoklad pre správny field work. Export inventára je použiteľný aj mimo appky (CSV s metadátami, voliteľne plný OCR text a odkazy na skeny). Inventárna tabuľka podporuje Excel-style filtre a zoradenie stĺpcov so zdieľateľným URL. Operatívne mazanie vetiev je pripravené; **obnova zmazaných** a **koš v UI** ešte nie — TD-21.

---

## 11. Prenositeľnosť a odovzdanie

IT tím objednávateľa dostane:
1. `dump.sql` — kompletná PostgreSQL databáza (pg_dump)
2. `export.json` — hierarchický strom s metadátami a OCR textom
3. `photos/` — R2 bucket stiahnutý cez rclone
4. `README.md` — popis schémy a postup importu

**Pravidlo:** Nikdy nedenormalizovať. Každá informácia žije na jednom mieste.

**Soft-deleted záznamy:** `pg_dump` obsahuje aj riadky s `deleted_at` — IT tím môže obnoviť stav SQL dotazom; aplikácia ich do exportu JSON/CSV neposiela.

---

## 12. Technický dlh

| # | Popis | Kedy |
|---|---|---|
| TD-1 | Bundle 862 KB (@zxing) — React.lazy pre ScanPage | Po MVP |
| TD-2 | qrcode package na FE aj BE — správne, dva runtime | Neriešiť |
| TD-3 | Basic Auth → MS OAuth keď sa zapojí klient | Fáza 2 |
| TD-4 | Railway — over billing/trial status | Čoskoro |
| TD-5 | Video preview čierne na ScanPage | Sprint 2 Bugfix |
| TD-6 | Chýba QR scan pri "Pridať podradeú položku" | Sprint 2 Bugfix |
| TD-7 | React Query neinvaliduje po vytvorení podradených položiek | Sprint 2 Bugfix |
| TD-8 | Orphan R2 objekty po soft delete foto — cleanup skript | Po MVP |
| TD-9 | Tesseract lokálne na Windows nie je v PATH — OCR sa testuje len na Railway | Nízka priorita |
| TD-10 | GIN index `to_tsvector('simple', unaccent(name‖note))` ak search > 500 ms | Sledovať po naplnení skladu |
| TD-11 | Search pagination (cursor alebo offset) keď výsledkov > 200 | Po naplnení skladu |
| TD-12 | `dump.sql` + `README.md` pre finálne odovzdanie IT tímu | Pred odovzdaním |
| TD-13 | LLM retry pre REJECTED items — re-extract s upraveným promptom | Po Sprint 8 |
| TD-14 | Gemini Batch Mode pre >100 položiek naraz | Na požiadanie |
| TD-15 | `type_code` a `auto_name` stĺpce odstrániť z DB po overení migrácie | 1 mesiac po Sprint 8 |
| TD-16 | `ocr_name_suggestion` stĺpec — zvážiť či nestačí len vrátiť z API bez uloženia | Pred Sprint 8 release |
| TD-17 | Cron job pre automatické spúšťanie process-pending na Railway | Po MVP ak bude treba |
| TD-18 | Odstrániť `services/llmMetadata.ts` a `services/llmTitle.ts` po overení zlúčeného Vision pipeline | 1 mesiac po Sprint 8 |
| TD-19 | Tesseract balíčky z `railpack.json` odstrániť ak sa fallback nepoužíva 3+ mesiace | Po stabilizácii Gemini Vision |
| TD-20 | Batch metadata extraction UI pre `OCR_ENGINE=tesseract` — `POST /api/llm-metadata/process` existuje v API ale nemá UI na stránke Spracovanie (odstránené v Sprint 8 refaktore). Pri Tesseract behu musí konzultant extrahovať metadata per-item cez Item detail → "Extrahovať metadata z OCR textu". Ak sa Tesseract path bude aktívne používať, pridať batch tlačidlo späť. | Nízka — iba pre tesseract fallback |
| TD-21 | **Obnova soft-deleted položiek** — `POST /items/:id/restore?cascade=true`, admin stránka Koš (zoznam `deleted_at IS NOT NULL`), validácia: živý rodič, konflikt mena pod rodičom, QR obsadený inou položkou; voliteľne obnova fotiek | Po field work / na požiadanie |
| TD-22 | Pri kaskádovom mazaniu zvážiť soft-delete fotiek podstromu (dnes fotky ostávajú „živé" v DB, len položka je skrytá) | Po TD-21 alebo pri prvom incidente |
| TD-23 | Overiť / nastaviť `R2_PUBLIC_URL` v Railway pre trvalé odkazy vo exporte CSV (inak 7d signed URL) | Pred odovzdaním exportu klientovi |
| TD-24 | Excel `HYPERLINK()` formát pre export (ak verejná URL nestačí na auto-link) | Nízka — až po spätnej väzbe z Excelu |

---

## 13. Otvorené otázky

| # | Otázka | Priorita |
|---|---|---|
| OQ-7 | Ručne písané štítky — tlačené OK (95%+), ručné písmo ostáva open question | Nízka |
| OQ-8 | Pečiatka s číslom ako fallback pre QR nálepky? | Nízka |
| OQ-11 | Nakúpiť QR nálepky (Avery L4732) — otestovať pred výjazdom do skladu | Stredná |
| OQ-12 | Validácia levelu pri POST /items — striktná (parent.level + 1) alebo voľná (parent.level < child.level)? Voľná umožní preskočiť level (napr. sklad priamo na krabicu bez ohradky/police). | Stredná |
| OQ-13 | Obnova z koša — obnovovať vždy celú vetvu naraz, alebo aj jednotlivú položku s „sirotím" v koši? | Nízka — pred TD-21 |
| OQ-14 | Po zmazaní položky uvoľniť QR tag (FREE) alebo nechať ASSIGNED na mŕtvom item? | Nízka — pred TD-21 |

---

*Posledná aktualizácia: v2.12.0 — máj 2026. Sprint 8 hotový. Údržba: kaskádové soft delete; export CSV/JSON (stĺpce, OCR, URL fotiek); inventárna tabuľka — výber stĺpcov, metadata, Excel-style filtre a zoradenie per stĺpec v URL (`cf`, `sort`). Obnova zmazaných (koš / restore) zatiaľ nie — TD-21.*
*Ďalší krok: field work v sklade (Sprint 6), overiť `R2_PUBLIC_URL` (TD-23), potom TD-21 / TD-5–7 / TD-12 podľa potreby.*