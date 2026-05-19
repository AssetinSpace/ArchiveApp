# ArchiveApp — PROJECT.md
> Živý dokument. Aktualizovať po každom rozhodnutí alebo sprinte.
> Verzia 2.9.0 — Flexibilná 7-úrovňová hierarchia: level + kind namiesto type_code, name_source, auto_name deprecated.

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
| 16 | JSON export bez signed URL pre fotky | Signed URLs sú efemérne (15 min) — fotky sa stiahnu z R2 bucket-u cez rclone (PROJECT.md §11) |
| 17 | Sprint 4 endpoints používajú `prisma.$queryRaw` | Prisma neumožňuje volať `unaccent()` ani `WITH RECURSIVE` priamo v `where` — raw SQL je čistejšie ako Unsupported workaround |
| 18 | ~~Auto-name z pozície v hierarchii~~ (**deprecated v 2.9**) | Nahradené rozhodnutím #29 — generovaný `name` podľa `kind` + počtu súrodencov. `auto_name` stĺpec ostáva v DB pre legacy záznamy, pre nové položky sa negeneruje. |
| 19 | ~~LLM title extraction~~ (Sprint 5, **zrušené v 2.8**) | Nahradené rozhodnutím #27 — metadata-only |
| 20 | ~~Potvrdiť OCR title → `name`~~ (Sprint 5, **zrušené v 2.8**) | `name` ostáva len ručný popis; štruktúrované info ide do JSONB metadata |
| 21 | JSONB `metadata` pole pripravené pre Sprint 6, nenaplňuje sa v Sprint 5 | Schéma metadata sa odvodí z analýzy ~200 reálnych OCR textov po field work — predčasná štandardizácia by viedla k zlej štruktúre |
| 22 | Gemini 2.5 Flash namiesto Claude Haiku pre LLM title extraction | 6–7× lacnejší (~$0.27 za celý archív batch), dostatočná kvalita pre OCR text extraction zo slovenských stavebných štítkov. Free tier pre testovanie, platená úroveň pred ostrým nasadením. |
| 23 | Photo má `photo_type` enum LABEL/OVERVIEW; LABEL ide do OCR pipeline, OVERVIEW slúži ako vizuálna referencia (krabica/paleta) | V teréne konzultant často odfotí aj samotnú krabicu/paletu, nielen štítok — bez rozlíšenia by tieto fotky inflovali PENDING/FAILED OCR štatistiky a LLM batch by ich zbytočne ťahal. OVERVIEW dostane pri uploade rovno `ocr_status = DONE` aby PENDING count zodpovedal reálnej fronte štítkov; OCR endpointy navyše filtrujú `photo_type = 'LABEL'` (dvojitá ochrana proti legacy dátam). |
| 24 | Metadata extraction = separátny LLM call od `ocr_title` (paralelné workflows) | Halucinácia v jednom poli (napr. dátum) nesmie zrušiť potvrdený titul. Stavy `metadata_status` (NONE → EXTRACTED → REVIEWED) bežia nezávisle od `ocr_title_status`, vlastný route `/api/llm-metadata/*`, vlastná admin stránka `/admin/llm-metadata`. Konfirm metadata neprepisuje `name`. |
| 25 | Metadata JSONB hybrid schéma — prompt dáva **príklady** typických polí, LLM môže pridať ďalšie kľúče; backend ukladá permisívne | Štítky sú variabilné (rozhodnutie #1). UI/export majú labels pre odporúčané polia (stavba, cast, …); neznáme kľúče sa zobrazia a dajú editovať v review. Známe polia log bez warning, neznáme s warning. |
| 26 | Items table tree-style ostáva default; Sprint 7 metadata stĺpce sa pridávajú do existujúceho `ItemsDataTable` s warning štýlom pre `EXTRACTED` hodnoty (žltkasté pozadie + badge „návrh") | Konzistentnosť cez celý produkt — žiadna paralelná „flat 17-stĺpcová" tabuľka. Default sú nové stĺpce skryté (úzke obrazovky), konzultant si zapne v "Stĺpce ▾" dropdowne. URL state pre column toggle ostáva (existujúci pattern, žiadny localStorage). |
| 27 | **Metadata-only** — LLM title workflow (`ocr_title`, `/admin/llm-titles`) zrušený | Jeden AI kanál: hybrid JSONB metadata z OCR. `name` len ručne (voliteľne), identita = `auto_name` + QR. Prompt dáva príklady polí (nie povinnú 7-polovú schému), LLM môže pridať ďalšie kľúče. Search prehľadá celé `metadata` cez `jsonb_each_text`. CSV má `metadataJson` + flat stĺpce pre časté polia. |
| 28 | **Flexibilná 7-úrovňová hierarchia** — `type_code` enum nahradený dvojicou `level` (Int 1–7) + `kind` (String, otvorený) | Terénny test odhalil že fyzická realita skladu nezodpovedá pevnému enum: existujú ohradky, police s vlastnými kódmi, rôzne typy kontajnerov. `level` = nemenná pozícia v strome, `kind` = fyzický typ objektu — predvolené hodnoty v UI, ale konzultant môže napísať čokoľvek. Legacy záznamy dostanú `level` a `kind` z `type_code` cez migráciu. |
| 29 | **Generovaný `name` podľa `kind` + počtu súrodencov** namiesto `auto_name` reťazca | `auto_name` (`sklA_pal003_kra007`) bol redundantný — breadcrumb z `parent_id` poskytuje tú istú informáciu čitateľnejšie. Nový generovaný name je jednoduchý: `polica_5`, `krabica_12`, `zlozka_7`. Sledovaný cez `name_source` enum (GENERATED / OCR / MANUAL). |
| 30 | **`name_source`** — nové pole sledujúce pôvod názvu položky | Tri stavy: `GENERATED` (automatický pri vytvorení), `OCR` (navrhnutý z OVERVIEW fotky, konzultant potvrdil), `MANUAL` (konzultant prepísal ručne). Pre L2/L3 po OVERVIEW fotke systém navrhne nastavenie `name` z OCR — rovnaký banner pattern ako `metadata_status = EXTRACTED`. |
| 31 | **`kind` je otvorený String v DB, nie Prisma enum** | UI ponúka dropdown s predvolenými hodnotami per level. Posledná možnosť vždy „Vlastné…" — otvorí textové pole. Backend uloží čokoľvek bez validácie. Žiadna migrácia ak sa v teréne objavia nové typy. Predvolené hodnoty per level: L1=SKLAD, L2=OHRADKA/CAST, L3=POLICA/PALETA/REGAL, L4=KRABICA/TUBA, L5=ZLOZKA/EUROOBAL/ZAKLADAC, L6=EUROOBAL/OBALKA, L7=DOKUMENT/VYKRES. |
| 32 | **Zóny hierarchie**: L1–L4 = lokácia, L5–L6 = kontajner (metadata ✓), L7 = listový node | L1–L4 popisujú kde niečo fyzicky je. L5–L6 sú kontajnery obsahu — tu žijú metadata (stavba, projektant, rok…). L7 je listový node: fotí sa prvá strana dokumentu (LABEL foto → OCR → metadata), nemá deti, QR sa neprideľuje. L6 je voliteľný sub-kontajner (euroobal vo zložke) — väčšina ciest pôjde L4→L5→L7. |
| 33 | **L7 je súčasťou MVP** (nie fáza 2) s obmedzeným scope | L7 (dokument/výkres) sa fotí (prvá strana), OCR prebehne, metadata sa extrahujú rovnako ako pre L5/L6. Rozdiel: L7 nemá deti (listový node), QR sa neprideľuje, OVERVIEW foto nemá zmysel. Granularita obsahu krabice sa teda zvýšila: krabica → zložka → dokument je plne funkčný strom v MVP. |

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

### 4.5 OCR workflow
- **Terén:** upload foto → `ocr_status = PENDING` → okamžitý return
- **Doma:** `POST /api/ocr/process-pending` → Tesseract na Railway → uloží raw text
- **Config:** `lang="slk+eng"`, `oem=1` (LSTM), `psm=1` (auto OSD + rotácia)
- **L2/L3 OVERVIEW:** po OCR zobrazí banner „Nastaviť názov na [OCR text]?" — konzultant potvrdí alebo upraví → `name_source = OCR`

### 4.6 Name generation
Pri `POST /api/items`:
1. Zistiť `kind` z requestu (povinné)
2. Spočítať súrodencov rovnakého `kind` pod rovnakým `parent_id`
3. `name = "{kind_lowercase}_{count+1}"` napr. `polica_5`, `zlozka_12`
4. `name_source = GENERATED`
5. Konzultant môže kedykoľvek prepísať → `name_source = MANUAL`

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

### UC-4: Export inventára
```
Export → CSV/JSON so všetkými položkami, level, kind, lokáciou, statusom, metadátami
```

---

## 6. Out of scope (MVP)

- Skenovanie celého obsahu dokumentov (len prvá strana pre L7)
- Viacero používateľov / role
- Výpožičkový systém s termínmi
- Prepojenie na externé systémy
- Natívna mobilná app (responzívny web stačí)

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
| OCR | Tesseract 5.3.0 na Railway, slk+eng, PSM 1, batch endpoint | ✓ live (Sprint 3b) |
| Auth MVP | HTTP Basic Auth | ✓ live |
| Auth fáza 2 | Microsoft OAuth (passport-azure-ad) | ⬜ po MVP |
| Search | Fulltext ILIKE cez name, note, celé JSONB metadata, ocr_raw_text + `strip_diacritics()` | ✓ live (Sprint 4 + 7 + 2.8) |
| Export | CSV (BOM/`;`/CRLF, `metadataJson`) + JSON hierarchický | ✓ live (Sprint 4) |
| Name generation | `kind_lowercase + počet súrodencov` pri POST /items | ⬜ Sprint 8 |
| LLM Metadata | Gemini 2.5 Flash → hybrid JSONB, batch + review (`/admin/llm-metadata`) | ✓ live (Sprint 7, metadata-only od 2.8) |
| Hierarchia | 7 úrovní, level + kind, name_source | ⬜ Sprint 8 |

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
│   └── src/types/node-tesseract-ocr.d.ts
├── PROJECT.md        tento dokument
└── .env.example      template env premenných
```

---

## 9. Sprint plán

### Sprint 8 — Flexibilná hierarchia (level + kind + name_source) ⬜ PLÁNOVANÝ
Pozri `CURSOR_PROMPT_SPRINT8.md` pre detailný implementačný prompt.

**Backend:**
- ⬜ Prisma migrácia `add_level_kind_name_source`: pridať `level Int`, `kind String`, `name_source String DEFAULT 'GENERATED'`; zachovať `type_code` a `auto_name` ako deprecated nullable
- ⬜ Migrácia dát: `UPDATE Item SET level = CASE type_code WHEN 'SKLAD' THEN 1 WHEN 'PALETA' THEN 3 WHEN 'KRABICA' THEN 4 WHEN 'ZLOZKA' THEN 5 END`, `kind = type_code`
- ⬜ `services/nameGeneration.ts`: `generateName(parentId, kind)` — count súrodencov rovnakého kind + 1
- ⬜ `POST /api/items`: povinný `level` a `kind` v body; validácia `level <= parent.level + 1`; L7 odmietne `parent_id` pre nové deti; `name = body.name ?? generateName()`; `name_source = body.name ? 'MANUAL' : 'GENERATED'`
- ⬜ `PATCH /api/items/:id/name`: aktualizuje `name` + `name_source = 'MANUAL'`
- ⬜ `POST /api/items/:id/name-from-ocr`: navrhne `name` z poslednej OVERVIEW fotky → vráti návrh bez uloženia
- ⬜ `POST /api/items/:id/confirm-ocr-name`: uloží navrhnutý name → `name_source = 'OCR'`
- ⬜ OCR OVERVIEW flow pre L2/L3: po `ocr_status = DONE` na OVERVIEW foto → nastaví `item.ocr_name_suggestion = ocr_raw_text` (nové nullable pole) → FE zobrazí banner
- ⬜ Export CSV/JSON: pridať stĺpce `level`, `kind`, `name_source`, odstrániť `autoName`/`ocrTitle`
- ⬜ Search: `kind` pridať do ILIKE WHERE

**Frontend:**
- ⬜ `CreateItemForm`: dropdown `kind` s predvolenými hodnotami per level + „Vlastné…" textové pole; `level` sa dedí z parenta automaticky (+1)
- ⬜ `ItemDetailPage`: badge `name_source` vedľa názvu; banner „Nastaviť názov na [OCR]?" pre L2/L3 po OVERVIEW; tlačidlo Upraviť názov
- ⬜ `Navbar` / breadcrumb: zobraziť `kind` badge vedľa `name`
- ⬜ `ItemsDataTable`: stĺpce `level`, `kind`, `name_source`; odstrániť `auto_name`
- ⬜ `api.ts`: nové typy `ItemLevel`, `ItemKind`, `NameSource`; metódy `confirmOcrName`, `updateName`

### Sprint 7 — JSONB Metadata Extraction ✓ HOTOVÝ
- ✓ Backend `services/llmMetadata.ts`, `routes/llmMetadata.ts`
- ✓ FE `LlmMetadataAdminPage.tsx`, `ItemDetailPage` MetadataBanner
- ✓ Search cez celé JSONB metadata

### Sprint 6 — Photo type LABEL vs OVERVIEW ⏳ IN PROGRESS
- ✓ Prisma migrácia `add_photo_type`
- ✓ Backend routes/photos.ts, routes/ocr.ts
- ✓ Frontend PhotoUpload, PhotoGallery
- ⬜ Field test v sklade

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

**Stav:** Technické MVP HOTOVÉ (3/5 bodov). Sprint 8 (hierarchia) je predpoklad pre správny field work — bez neho by sa naskenovalo s nesprávnou štruktúrou.

---

## 11. Prenositeľnosť a odovzdanie

IT tím objednávateľa dostane:
1. `dump.sql` — kompletná PostgreSQL databáza (pg_dump)
2. `export.json` — hierarchický strom s metadátami a OCR textom
3. `photos/` — R2 bucket stiahnutý cez rclone
4. `README.md` — popis schémy a postup importu

**Pravidlo:** Nikdy nedenormalizovať. Každá informácia žije na jednom mieste.

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

---

## 13. Otvorené otázky

| # | Otázka | Priorita |
|---|---|---|
| OQ-7 | Ručne písané štítky — tlačené OK (95%+), ručné písmo ostáva open question | Nízka |
| OQ-8 | Pečiatka s číslom ako fallback pre QR nálepky? | Nízka |
| OQ-11 | Nakúpiť QR nálepky (Avery L4732) — otestovať pred výjazdom do skladu | Stredná |
| OQ-12 | Validácia levelu pri POST /items — striktná (parent.level + 1) alebo voľná (parent.level < child.level)? Voľná umožní preskočiť level (napr. sklad priamo na krabicu bez ohradky/police). | Stredná |

---

*Posledná aktualizácia: v2.9.0 — flexibilná 7-úrovňová hierarchia (level + kind + name_source, auto_name deprecated). Sprint 8 plánovaný.*
*Ďalší krok: implementovať Sprint 8 podľa CURSOR_PROMPT_SPRINT8.md, potom field work v sklade.*