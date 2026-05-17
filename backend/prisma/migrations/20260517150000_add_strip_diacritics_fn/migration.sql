-- D-1 fallback: vlastná immutable funkcia `strip_diacritics(text)`.
-- Predtým sme spoliehali na `unaccent` contrib extension (predošlá migrácia),
-- ale na Railway production sa search vracal 500 (možno extension nedostupný
-- alebo `unaccent.rules` dict file chýba). Vlastná funkcia eliminuje závislosť.
--
-- Princíp: translate() mapuje znak-po-znaku (Unicode codepoint), takže SK
-- diakritika sa nahradí ASCII ekvivalentom. Pred translate dáme lower() aby
-- aj veľké písmená prešli (lower() na "Á" vráti "á", potom translate "á" → "a").
--
-- Pokrýva slovenskú aj českú diakritiku (čeština občas v importovaných textoch).
-- IMMUTABLE → v budúcnosti sa dá použiť v indexe (TD-10).
CREATE OR REPLACE FUNCTION strip_diacritics(input text) RETURNS text AS $$
  SELECT translate(
    lower(coalesce(input, '')),
    'áäčďéěíĺľňóôöŕřšťúůýž',
    'aacdeeillnoooorrstuuyz'
  )
$$ LANGUAGE sql IMMUTABLE;
