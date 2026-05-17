# ArchiveApp — PROJECT.md
> Živý dokument. Aktualizovať po každom rozhodnutí alebo sprinte.
> Verzia 2.5 — Sprint 5 HOTOVÝ. Auto-naming + LLM title extraction live.

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
| 18 | Auto-name z pozície v hierarchii (`sklX_palNNN_kraNNN_zloNNN`) | Terénny flow scan → fotka → ďalší — bez ručného písania názvu. Generuje sa pri POST /items, immutable po vytvorení, slúži ako stabilný pozičný identifikátor aj keď sa neskôr `name` prepíše OCR titulkom |
| 19 | LLM title extraction cez Claude Haiku API, batch + manual review, nie automatic | Halucinácie sú reálne, konzultant musí návrh potvrdiť. Batch je manuálne spustený z `/admin/llm-titles`, sériový s 500 ms pauzou (rate limit + cost control) |
| 20 | Potvrdiť OCR title prepisuje `name`, `auto_name` ostáva immutable | OCR titulok je čitateľnejší pre vyhľadávanie ("Kolaudácia X"), `auto_name` ostáva ako stabilný pozičný identifikátor pre referenciu (footer Item detailu) |
| 21 | JSONB `metadata` pole pripravené pre Sprint 6, nenaplňuje sa v Sprint 5 | Schéma metadata sa odvodí z analýzy ~200 reálnych OCR textov po field work — predčasná štandardizácia by viedla k zlej štruktúre |
| 22 | Haiku namiesto Sonnet pre OCR extraction | 12× lacnejšie (~$0.40 / 1000 štítkov vs $4), kvalita pre štruktúrovanú extraction zo štítkov je dostatočná. Pri kvalitatívnom probléme TD-13 môžeme prepnúť |

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

**Homogénny strom:** Každá úroveň je `Item` s `parent_id`. Typ určuje `ItemType`.
Zložka = plnohodnotný kontajner. Fáza 2 = len nové ItemType záznamy, žiadna migrácia.

**Atypické kontajnery (tubusy, voľné dokumenty):**
Neriešime špeciálne — KRABICA s popisným názvom (napr. "Tubus").

---

## 4. Informačný model (MVP)

### 4.1 Item
- `id` — UUID (interné)
- `type_code` — SKLAD / PALETA / KRABICA / ZLOZKA (MVP)
- `name` — voliteľný ľudský názov (Sprint 5: prepisovaný pri CONFIRMED OCR titulku)
- `parent_id` — UUID rodiča (nullable = koreň)
- `qr_code` — externý kód z nálepky, napr. `QR-000042` (nullable, unique)
- `note` — voľné textové pole (nullable)
- `status` — NA_MIESTE / VYNESENE / NEZNAME
- `auto_name` — Sprint 5: pozičný identifikátor (`sklA_pal003_kra004_zlo015`), generovaný pri POST /items, **immutable** po vytvorení. NULL pre legacy items pred Sprint 5.
- `ocr_title` — Sprint 5: LLM-extrahovaný titulok zo OCR textu. NULL kým LLM extraction nezbehol.
- `ocr_title_status` — Sprint 5: TEXT, hodnoty `NONE` (default) / `SUGGESTED` (LLM navrhol) / `CONFIRMED` (konzultant potvrdil → `name` prepísaný) / `REJECTED` (konzultant zamietol).
- `metadata` — Sprint 5: JSONB, default `{}`. Pripravené pre Sprint 6 metadata extraction (projektant, dátum, adresa, typ dokumentu...). V Sprint 5 sa nenaplňuje.
- `metadata_status` — Sprint 5: TEXT, hodnoty `NONE` (default) / `EXTRACTED` (Sprint 6) / `REVIEWED` (Sprint 6).
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
- `ocr_status` — PENDING / DONE / FAILED (default PENDING po uploade)
- `created_at`
- `deleted_at` — soft delete (R2 objekt zámerne ostáva, orphan cleanup neskôr)

**Signed URL** sa NEUKLADÁ v DB. Generuje sa on-demand pri každej API odpovedi
cez `getSignedUrlForKey(storage_key)` (default 15 min platnosť).

### 4.4 Metadátová stratégia
**Capture first, classify later:**
- Teraz: foto + OCR raw text, žiadna štruktúra
- Po ~200 zložkách: analyzovať OCR korpus → odvodiť schému → pridať polia

### 4.5 OCR workflow
- **Terén:** upload foto → `ocr_status = PENDING` → okamžitý return
- **Doma:** `POST /api/ocr/process-pending` → Tesseract na Railway → uloží raw text
- **Config:** `lang="slk+eng"`, `oem=1` (LSTM), `psm=1` (auto OSD + rotácia)

---

## 5. Kľúčové use cases (MVP)

### UC-1: Inventarizácia v teréne
```
Prídem k palete → naskenuj QR krabice → otvor krabicu
→ každej zložke naskenuj/priraď QR → odfot štítok → poznámka → ďalšia
```

### UC-2: Nájsť kde niečo je
```
Hľadám "kolaudáciu pre objekt X"
→ search → výsledky s lokáciou: Sklad A → Paleta 7 → Krabica 23
```

### UC-3: Scan v sklade
```
Naskenuj QR krabice → vidím všetky zložky s fotkami → nájdem bez otvárania
```

### UC-4: Export inventára
```
Export → CSV/JSON so všetkými položkami, lokáciou, statusom, poznámkami
```

---

## 6. Out of scope (MVP)

- Skenovanie obsahu dokumentov (len štítky)
- Interpretácia OCR / extrakcia štruktúrovaných polí
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
| Search | Fulltext ILIKE cez name, ocr_title, note, ocr_raw_text + `strip_diacritics()` | ✓ live (Sprint 4, rozšírené Sprint 5) |
| Export | CSV (BOM/`;`/CRLF) + JSON hierarchický | ✓ live (Sprint 4) |
| Auto-name | Pozičný identifikátor `sklX_palNNN_kraNNN_zloNNN` pri POST /items | ✓ live (Sprint 5) |
| LLM Title | Claude Haiku API, batch + manual review | ✓ live (Sprint 5) |

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
ANTHROPIC_API_KEY     [sk-ant-... z console.anthropic.com — Sprint 5]
NODE_ENV              production
```

**Sprint 5 LLM cost control (povinný setup pred prvým použitím):**
1. console.anthropic.com → Settings → API Keys → Create Key (sk-ant-...)
2. Settings → Limits → Spending Limit = **$10** (poistka — pri 1000 štítkoch ~$0.40)
3. Railway dashboard → backend service → Variables → `ANTHROPIC_API_KEY` = key
4. Bez kľúča vrátia LLM endpointy 503 s návodom; appka inak nepadne.

**Pozor:** R2_ACCOUNT_ID = `324e558ab210cbc41f1f20e2a3aa4a01` (správny hash z S3 API URL).
Pôvodne bola tam chybne skopírovaná hodnota Access Key ID — opravené v Sprint 3a.

### Cloudflare Pages env premenné
```
VITE_API_URL          https://archiveapp-api.assetin.space/api
```

### R2 CORS Policy (Cloudflare dashboard → R2 → archiveapp-photos → Settings)
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
│   └── src/types/node-tesseract-ocr.d.ts  (lokálne TS typy — @types neexistujú)
├── PROJECT.md        tento dokument
└── .env.example      template env premenných
```

---

## 9. Sprint plán

### Sprint 0 — Infraštruktúra ✓ HOTOVÝ
- ✓ GitHub repo, Railway, PostgreSQL, Cloudflare Pages, R2
- ✓ Domény nastavené (Websupport DNS → Railway + Cloudflare)
- ✓ CORS R2 bucket nastavené

### Sprint 1 — Dátový model + API ✓ HOTOVÝ
- ✓ Prisma schema: Item, ItemType, QRTag, Photo
- ✓ HTTP Basic Auth middleware
- ✓ API: CRUD /items, /items/:id/path, /items/:id/children
- ✓ Seed: 3 sklady, palety, ItemTypes (idempotentný)
- ✓ Základné UI

### Sprint 2 — QR + Scan flow ✓ HOTOVÝ (s bugmi)
- ✓ QR generovanie + import + PDF tlač (A4, 32 štítkov, 48×35mm, dashed border)
- ✓ Scan stránka (kamera cez @zxing/browser + manuálny input)
- ✓ FREE QR → formulár → vytvorenie položky
- ✓ ASSIGNED QR → presmeruj na detail
- ✓ Item detail: breadcrumb, children, status, note, QR obrázok
- ✓ QR Admin stránka (accordion: generovanie + import zbalené default)
- ⚠️ TD-5: video preview čierne (QR sa načíta, len nevidno obraz)
- ⚠️ TD-6: pri "Pridať podradeú položku" nie je QR scanner, len ručný vstup
- ⚠️ TD-7: React Query neinvaliduje po vytvorení podradených položiek

### Sprint 2 Bugfix ⬜
- [ ] Video preview opraviť (CSS/srcObject)
- [ ] Link /scan?parentId pri "Pridať podradeú položku"
- [ ] React Query invalidácia po POST /items

### Sprint 3a — Fotky + R2 ✓ HOTOVÝ
- ✓ R2 service wrapper (uploadToR2, getSignedUrlForKey, getObjectAsBuffer)
- ✓ Photo model migrácia: drop storage_url, add deleted_at, indexy
- ✓ Multer multipart upload (memoryStorage, 10 MB, JPEG/PNG/WebP)
- ✓ Rate limit 20 req/min/IP (express-rate-limit)
- ✓ POST /api/items/:id/photos, GET list, GET detail, DELETE soft
- ✓ PhotoUpload (capture=environment, browser-image-compression >2MB)
- ✓ PhotoGallery (grid 2/3 col, PENDING badge, vlastný lightbox)
- ✓ Integrácia v ItemDetailPage — sekcia "Fotky"

### Sprint 3b — OCR ✓ HOTOVÝ
- ✓ railpack.json: aptPackages tesseract-ocr + tesseract-ocr-eng + tesseract-ocr-osd + tesseract-ocr-slk
- ✓ nixpacks.toml zmazaný — Railway prešlo na Railpack builder (2025)
- ✓ OCR config: lang=slk+eng, oem=1, psm=1 (auto OSD, zvláda rotáciu)
- ✓ node-tesseract-ocr.d.ts — lokálne TypeScript typy
- ✓ services/ocr.ts: processPhoto (idempotent), processPending (sériový)
- ✓ 5 OCR endpointov: process-pending, status, retry/:id, failed, recent
- ✓ api.ts: fetchOcrStatus, processOcrPending, retryOcr, fetchFailedPhotos, fetchRecentOcrPhotos
- ✓ OCRAdminPage /admin/ocr: štatistiky 2×2, polling 3s, banner, FAILED sekcia, Recent fotky
- ✓ PhotoGallery rozšírené: DONE collapsible, DONE bez textu badge, FAILED retry mutation
- ✓ Reálny test (štítok RODINNÝ DOM): 95%+ presnosť, diakritika OK

### Sprint 5 — Auto-naming + LLM Title Extraction ✓ HOTOVÝ
- ✓ Prisma migrácia `add_auto_name_ocr_title_metadata` (auto_name, ocr_title, ocr_title_status, metadata JSONB, metadata_status, index ocr_title_status)
- ✓ services/autoName.ts: `generateAutoName(parentId, typeCode)` — sklA_pal003_kra004_zlo015 (preferuje `auto_name` ancestora ak existuje, inak path-from-scratch)
- ✓ Integrácia do POST /api/items (oba branchy s/bez QR) — `name = body.name ?? autoName`, `auto_name = autoName`
- ✓ services/llmTitle.ts: `extractTitleFromOcr` (fetch + 30s AbortController) + `processPendingTitles` (sériový, 500ms pauza, max 50 per batch)
- ✓ Model: `claude-haiku-4-5-20251001`, `max_tokens: 150`, OCR vstup orezaný na 2000 znakov, výstup na 200 znakov
- ✓ routes/llmTitle.ts: POST /process (503 ak chýba ANTHROPIC_API_KEY), GET /status (vrátane `noApiKey` flag), GET /pending-review (offset paging), POST /:id/confirm|reject|edit
- ✓ Confirm/edit prepíše `name` na ocr_title bez uniqueness check (LLM-derived duplicates povolené)
- ✓ services/search.ts rozšírené: ocr_title v ILIKE WHERE + CASE WHEN priorita `name > ocr_title > note > ocr`, snippet aj pre `ocr_title`
- ✓ routes/export.ts: CSV stĺpce `autoName, ocrTitle, ocrTitleStatus, metadataStatus`, JSON polia + `metadata`
- ✓ FE api.ts: 6 nových api.* metód, typy `LlmTitleStatusResponse / LlmTitleProcessResponse / PendingReviewItem / PendingReviewResponse / OcrTitleStatus / MetadataStatus`
- ✓ FE pages/LlmTitleAdminPage.tsx (/admin/llm-titles): 6 stat cards, no-API-key banner s návodom, batch tlačidlo, polling 3s počas processing, review queue (offset 20/page) s confirm/edit/reject (44px+ tap targets, kbd Enter/Esc shortcuts)
- ✓ FE ItemDetailPage: auto_name label, OcrTitleBanner pre SUGGESTED, "z OCR" badge pre CONFIRMED
- ✓ FE Navbar: nový link "AI Názvy" + ikonka, App.tsx route `/admin/llm-titles`
- ✓ TypeScript build prejde na FE aj BE

### Sprint 4 — Search + Export ✓ HOTOVÝ
- ✓ Prisma migrácia `add_unaccent_extension` (CREATE EXTENSION IF NOT EXISTS unaccent)
- ✓ services/search.ts: `searchItems()` cez `prisma.$queryRaw` s `unaccent(lower(...)) LIKE` cez Item.name/note + Photo.ocr_raw_text
- ✓ Match source priorita name > note > ocr cez SQL CASE WHEN
- ✓ matchSnippet ±80 znakov okolo prvého výskytu v OCR texte
- ✓ Batched thumbnails (DISTINCT ON item_id) + on-demand signed URLs
- ✓ GET /api/search?q=...&limit=50 (min 2 znaky, max 200, max limit 200)
- ✓ GET /api/items/by-qr/:qrCode/contents (WITH RECURSIVE, filter ZLOZKA, photoCount)
- ✓ GET /api/export/csv (UTF-8 BOM, `;`, CRLF, D-4 stĺpce vrátane hasOcrText/ocrTextPreview)
- ✓ GET /api/export/json (hierarchický strom, in-memory build, fotky bez signed URL)
- ✓ FE: api.ts rozšírené (searchItems, fetchBoxContents, exportBlob s Basic Auth blob downloadom)
- ✓ FE: SearchPage (debounce 300ms, hit cards, breadcrumb, snippet highlight `<mark>`)
- ✓ FE: BoxContentsPage (grid 2/3 col, thumbnail + photoCount badge)
- ✓ FE: ScanPage — pre ASSIGNED KRABICA chooser "Otvoriť detail" + "Pozrieť obsah"
- ✓ FE: ExportPage /admin/export (dve tlačidlá, blob download cez dočasný `<a download>`)
- ✓ FE: Navbar rozšírený (Hľadať pred admin sekciou, Export vedľa OCR)
- ✓ TypeScript build prejde na FE aj BE

---

## 10. Definícia "hotovo" pre MVP

1. ⬜ Všetky krabice v jednom sklade zaznamenané s lokáciou *(field work, čaká na výjazd do skladu)*
2. ⬜ Každá zložka má ID a aspoň jednu fotku štítku *(field work)*
3. ✓ Systém vráti lokáciu keď zadám QR kód zložky *(Sprint 4 — Search nájde Item podľa OCR/name/note + vráti breadcrumb path)*
4. ✓ Export do CSV funguje *(Sprint 4 — /admin/export, Excel SK kompatibilný)*
5. ✓ Appka použiteľná na mobile v sklade *(Sprint 2/3 — mobile-first responzív, kamera funguje na HTTPS doméne)*

**Stav:** Technické MVP HOTOVÉ (3/5 bodov). Zostávajúce dva body (1 a 2) sú field work — naskenovať fyzický archív, nie ďalší kód.

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
| TD-10 | GIN index `to_tsvector('simple', unaccent(name‖note))` ak search > 500 ms na reálnom seede | Sledovať po naplnení skladu (~5000 items) |
| TD-11 | Search pagination (cursor alebo offset) keď výsledkov > 200 | Po naplnení skladu, ak limit 200 začne obmedzovať |
| TD-12 | `dump.sql` (pg_dump) a `README.md` (popis schémy + import postup) pre finálne odovzdanie IT tímu | Pred odovzdaním (po dokončení field work) |
| TD-13 | LLM retry pre REJECTED items — re-extract s upraveným promptom (variant „presnejšie", „kratšie", alebo iný model — Sonnet ako fallback ak Haiku halucinoval) | Po Sprint 6 ak field work odhalí systematické problémy s Haiku |
| TD-14 | Anthropic Batch API namiesto real-time pre ešte lacnejšie spracovanie (~50% sleva), neblokuje Express request | Až keď bude konzultant chcieť spracovať >100 položiek naraz |

---

## 13. Otvorené otázky

| # | Otázka | Priorita |
|---|---|---|
| OQ-7 | Ručne písané štítky — tlačené OK (95%+), ručné písmo ostáva open question | Nízka |
| OQ-8 | Pečiatka s číslom ako fallback pre QR nálepky? | Nízka |
| OQ-11 | Nakúpiť QR nálepky (Avery L4732) — otestovať pred výjazdom do skladu | Stredná |

---

*Posledná aktualizácia: v2.5 — Sprint 5 HOTOVÝ. Auto-naming + LLM title extraction live.*
*Ďalší krok: Sprint 2 Bugfix (TD-5/6/7), nastaviť ANTHROPIC_API_KEY na Railway, field work v sklade (DoD body 1+2), potom Sprint 6 (metadata extraction po analýze ~200 OCR textov), nakoniec dump.sql + README.md pre odovzdanie (TD-12).*