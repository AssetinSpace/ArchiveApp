# ArchiveApp — PROJECT.md
> Živý dokument. Aktualizovať po každom rozhodnutí alebo sprinte.
> Verzia 2.2 — Sprint 3b: kód OCR napísaný, Tesseract sa inštaluje cez Railpack `deploy.aptPackages` (Railway prešiel z Nixpacks na Railpack).

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
- `name` — voliteľný ľudský názov
- `parent_id` — UUID rodiča (nullable = koreň)
- `qr_code` — externý kód z nálepky, napr. `QR-000042` (nullable, unique)
- `note` — voľné textové pole (nullable)
- `status` — NA_MIESTE / VYNESENE / NEZNAME
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
- `ocr_raw_text` — surový Tesseract text (nullable, vypĺňa sa v 3b)
- `ocr_status` — PENDING / DONE / FAILED (defaultne PENDING po uploade)
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
| Backend hosting | Railway | ✓ live |
| Foto storage | Cloudflare R2 (archiveapp-photos) | ✓ live (Sprint 3a) |
| QR scan | @zxing/browser (kamera) + manuálny input | ✓ live |
| OCR | Tesseract na Railway (railpack.json `deploy.aptPackages`), batch endpoint | 🟡 Sprint 3b kód hotový, čaká deploy |
| Auth MVP | HTTP Basic Auth | ✓ live |
| Auth fáza 2 | Microsoft OAuth (passport-azure-ad) | ⬜ po MVP |
| Export | CSV + JSON endpoint | ⬜ Sprint 4 |

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
NODE_ENV              production
```

### Cloudflare Pages env premenné
```
VITE_API_URL          https://archiveapp-api.assetin.space/api
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
├── PROJECT.md        tento dokument
└── .env.example      template env premenných
```

---

## 9. Sprint plán

### Sprint 0 — Infraštruktúra ✓ HOTOVÝ
- ✓ GitHub repo, Railway, PostgreSQL, Cloudflare Pages, R2
- ✓ Domény nastavené (Websupport DNS → Railway + Cloudflare)

### Sprint 1 — Dátový model + API ✓ HOTOVÝ
- ✓ Prisma schema: Item, ItemType, QRTag, Photo
- ✓ HTTP Basic Auth middleware
- ✓ API: CRUD /items, /path, /children
- ✓ Seed: 3 sklady, palety, ItemTypes
- ✓ Základné UI

### Sprint 2 — QR + Scan flow ✓ HOTOVÝ (s bugmi)
- ✓ QR generovanie + import + PDF tlač
- ✓ Scan stránka (kamera + manuálny input)
- ✓ FREE QR → formulár → vytvorenie položky
- ✓ ASSIGNED QR → presmeruj na detail
- ✓ Item detail: breadcrumb, children, status, note, QR obrázok
- ✓ QR Admin stránka
- ⚠️ Bug TD-5: video preview čierne (QR sa načíta, len nevidno obraz)
- ⚠️ Bug TD-6: pri "Pridať dieťa" nie je QR scanner, len ručný vstup
- ⚠️ Bug TD-7: React Query neinvaliduje po vytvorení dieťaťa (treba refresh)

### Sprint 2 Bugfix ⬜ NASLEDUJÚCI
- [ ] Opraviť video preview (CSS/srcObject)
- [ ] Pridať link /scan?parentId pri "Pridať dieťa"
- [ ] React Query invalidácia po POST /items

### Sprint 3a — Fotky + R2 (bez OCR) ✓ HOTOVÝ
- ✓ Cloudflare R2 service wrapper (`backend/src/services/r2.ts`)
- ✓ Photo migrácia: drop `storage_url`, add `deleted_at`, indexy `[ocr_status]`+`[deleted_at]`
- ✓ Multer multipart upload (memoryStorage, 10 MB limit, MIME whitelist JPEG/PNG/WebP)
- ✓ Rate limit 20 req/min/IP na POST upload (`express-rate-limit`)
- ✓ POST `/api/items/:id/photos` (upload), GET `/api/items/:id/photos` (list so signed URLs), GET `/api/photos/:id` (detail), DELETE `/api/photos/:id` (soft delete)
- ✓ FE `PhotoUpload` (capture=environment, browser-image-compression nad 2 MB)
- ✓ FE `PhotoGallery` (grid 2/3 col, PENDING badge, vlastný lightbox s Escape + klik mimo)
- ✓ Integrácia v `ItemDetailPage` (sekcia Fotky)

### Sprint 3b — OCR 🟡 KÓD HOTOVÝ (čaká Railway deploy verifikáciu)
- ✓ `backend/railpack.json`: `deploy.aptPackages: ["tesseract-ocr", "tesseract-ocr-eng"]` — Railway runtime image dostane Tesseract binary cez apt
- ℹ️ Pôvodný `backend/nixpacks.toml` zmazaný — Railway prešlo na **Railpack** builder (default od 2025), nixpacks config sa ignoruje. Spec predpokladal nixpacks, museli sme prejsť cez Railpack ekvivalent.
- ✓ `backend/src/types/node-tesseract-ocr.d.ts`: lokálna deklarácia typov (chýbajúce @types)
- ✓ `backend/src/services/ocr.ts`: `processPhoto` (idempotent), `processPending` (sériový batch, lang=eng, OEM=1, PSM=6)
- ✓ `backend/src/routes/ocr.ts`: 4 endpointy — `POST /api/ocr/process-pending` (async fire-and-forget cez `setImmediate`), `GET /api/ocr/status`, `POST /api/ocr/retry/:photoId` (sync), `GET /api/ocr/failed`
- ✓ `frontend/src/api.ts`: `fetchOcrStatus`, `processOcrPending`, `retryOcr`, `fetchFailedPhotos`
- ✓ `frontend/src/pages/OCRAdminPage.tsx` (route `/admin/ocr`, navbar link): štatistiky 2×2 grid, polling 3s počas spracovania, banner "Hotovo", sekcia FAILED s Retry
- ✓ `frontend/src/components/PhotoGallery.tsx` rozšírené: DONE → collapsible OCR text, DONE bez textu → sivý badge, FAILED → červený badge + Retry
- ⬜ **Deploy verifikácia:** Railway Deploy Logs → potvrď `tesseract --version` funguje; testovací scenár z chatu (3 fotky → batch → OCR text v galérii)
- 📝 Lokálny test OCR preskočený — Tesseract binary nie je v Windows PATH, plán to predpokladá (testuje sa len na Railway)

### Sprint 4 — Search + Export ⬜
- [ ] Fulltext search (ILIKE cez name, note, ocr_raw_text)
- [ ] Search UI s lokáciou path a náhľadom
- [ ] CSV + JSON export endpoint
- [ ] Stránka "Obsah krabice"

---

## 10. Definícia "hotovo" pre MVP

1. Všetky krabice v jednom sklade zaznamenané s lokáciou
2. Každá zložka má ID a aspoň jednu fotku štítku
3. Systém vráti lokáciu keď zadám QR kód zložky
4. Export do CSV funguje
5. Appka použiteľná na mobile v sklade

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
| TD-1 | Bundle 790 KB (@zxing) — React.lazy pre ScanPage | Po MVP |
| TD-2 | qrcode package na FE aj BE — správne, dva runtime | Neriešiť |
| TD-3 | Basic Auth → MS OAuth keď sa zapojí klient | Fáza 2 |
| TD-4 | Railway trial 30 dní — pridať kartu pred vypršaním | Čoskoro |
| TD-5 | Video preview čierne na ScanPage | Sprint 2 Bugfix |
| TD-6 | Chýba QR scan pri "Pridať dieťa" | Sprint 2 Bugfix |
| TD-7 | React Query neinvaliduje po vytvorení dieťaťa | Sprint 2 Bugfix |

---

## 13. Otvorené otázky

| # | Otázka | Priorita |
|---|---|---|
| OQ-7 | Ručne písané štítky — Tesseract presnosť nízka → manuálne prepísanie do note? | Nízka |
| OQ-8 | Pečiatka s číslom ako fallback pre QR nálepky? | Nízka |
| OQ-11 | Nakúpiť QR nálepky (Avery L4732) — otestovať pred výjazdom | Stredná |

---

*Posledná aktualizácia: v2.2 — Sprint 3b kód napísaný, prvý deploy odhalil že Railway prešlo z Nixpacks na Railpack (nixpacks.toml ignorovaný). Konverzia na `backend/railpack.json` s `deploy.aptPackages`. Čaká druhý deploy + overenie Tesseract binary v Build Logs.*
*Ďalší krok: push → Railway redeploy → over že Build Logs obsahuje `install apt packages: tesseract-ocr` → /api/ocr/test-binary smoke test → end-to-end test cez /admin/ocr.*