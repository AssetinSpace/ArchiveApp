# ArchiveApp — PROJECT.md
> Živý dokument. Aktualizovať po každom rozhodnutí alebo sprinte.
> Verzia 2.0 — Sprint 2 dokončený, infraštruktúra live, bugy identifikované.

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
- `storage_url` — signed URL z R2 (generovaná on-demand, 15 min platnosť)
- `storage_key` — R2 object key (napr. `photos/2026/QR-000023-001.jpg`)
- `ocr_raw_text` — surový Tesseract text (nullable)
- `ocr_status` — PENDING / DONE / FAILED
- `created_at`

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
| Foto storage | Cloudflare R2 (archiveapp-photos) | ✓ pripravené |
| QR scan | @zxing/browser (kamera) + manuálny input | ✓ live |
| OCR | Tesseract na Railway, batch endpoint | ⬜ Sprint 3 |
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
R2_ACCOUNT_ID         279e449f81d15c59fa3fdaecb8590de7
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

### Sprint 3 — Fotky + OCR ⬜
- [ ] Multipart upload → Cloudflare R2
- [ ] Signed URL pre zobrazenie fotiek
- [ ] nixpacks.toml: Tesseract system dependency na Railway
- [ ] POST /api/ocr/process-pending endpoint
- [ ] UI: foto galéria, OCR text, PENDING badge

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

*Posledná aktualizácia: v2.0 — Sprint 2 live, bugy zdokumentované, infraštruktúra kompletná*
*Ďalší krok: Sprint 2 Bugfix → Sprint 3 (fotky + OCR)*