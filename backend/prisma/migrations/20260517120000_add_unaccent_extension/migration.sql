-- Pridáva PostgreSQL contrib extension `unaccent` pre diakritika-insensitive fulltext search.
-- Používa sa v services/search.ts v raw SQL ako unaccent(lower(...)) LIKE unaccent(...).
-- Idempotentne (IF NOT EXISTS) — opakovaný deploy nepadne.
CREATE EXTENSION IF NOT EXISTS unaccent;
