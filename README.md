# ArchiveApp

Webová aplikácia pre evidenciu fyzických skladov projektovej dokumentácie. Každá paleta, krabica a zložka má jednoznačné ID (UUID + voliteľný QR kód), priradenú fotografiu štítku a textovú poznámku. Cieľom MVP je vedieť, **čo kde fyzicky je**, a mať exportovateľný inventár.

Primárny zdroj kontextu, rozhodnutí a sprint plánu je [PROJECT.md](PROJECT.md). Tento README pokrýva len lokálny vývoj.

## Lokálny vývoj

### Predpoklady
- Node.js v20+
- PostgreSQL 14+ bežiaci lokálne na `localhost:5432`
- Git

### 1. Klon a inštalácia

```bash
git clone <repo>
cd archive.assetin
cd backend && npm install
cd ../frontend && npm install
```

### 2. PostgreSQL databáza

Vytvor lokálnu databázu `archiveapp`:

```bash
createdb archiveapp
# alebo
psql -U postgres -c "CREATE DATABASE archiveapp;"
```

### 3. Env premenné

Skopíruj `.env.example` a uprav podľa lokálneho prostredia:

```bash
cp .env.example backend/.env
```

Nastav minimálne `DATABASE_URL`, `BASIC_AUTH_USER`, `BASIC_AUTH_PASS`. R2 premenné nechaj prázdne — používajú sa až v Sprinte 3.

Pre frontend vytvor `frontend/.env.local`:

```
VITE_API_URL=http://localhost:3001/api
```

### 4. Prisma migrácia + seed

```bash
cd backend
npm run prisma:migrate:init   # iba pri prvom spustení (vytvorí init migráciu)
npm run seed                  # ItemTypes + 3 sklady + 3 palety v Sklade A
```

Ďalšie zmeny schémy → `npm run prisma:migrate`.

### 5. Spustenie dev serverov

V dvoch terminálových oknách:

```bash
cd backend && npm run dev    # Express + Prisma na http://localhost:3001
cd frontend && npm run dev   # Vite na http://localhost:5173
```

Otvor [http://localhost:5173](http://localhost:5173). Prehliadač zobrazí Basic Auth dialóg — zadaj `BASIC_AUTH_USER` a `BASIC_AUTH_PASS` z `backend/.env`.

## Architektúra

Monorepo s dvoma balíkmi:

```
archive.assetin/
├── backend/   Node.js + Express + TypeScript + Prisma + PostgreSQL
└── frontend/  Vite + React + TypeScript + TanStack Query
```

Detail infraštruktúry (Railway, Cloudflare R2, doména, deploy pipeline) je popísaný v [PROJECT.md §11](PROJECT.md#11-infraštruktúra-a-github-workflow). Dátový model je v [PROJECT.md §4](PROJECT.md#4-informačný-model-mvp).
