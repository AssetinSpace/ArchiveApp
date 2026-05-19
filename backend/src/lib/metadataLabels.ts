/** Popisky metadata polí — známe kľúče, časté AI polia, fallback pre ostatné. */

export const METADATA_LABELS: Record<string, string> = {
  stavba: "Stavba",
  cast: "Časť",
  projektant: "Projektant",
  adresa: "Adresa",
  cislo: "Číslo",
  datum: "Dátum",
  stupen: "Stupeň",
  typ_dokumentu: "Typ dokumentu",
  investor: "Investor",
  autor_casti: "Autor časti",

  adresa_firmy: "Adresa firmy",
  adresa_projektant: "Adresa projektanta",
  adresa_projektanta: "Adresa projektanta",
  autorizovany_architekt: "Autorizovaný architekt",
  autorizovany_stavebny_inzinier: "Autorizovaný stavebný inžinier",

  miesto_stavby: "Miesto stavby",
  kod_akcie: "Kód akcie",
  generalny_projektant: "Generálny projektant",
  stavebnik: "Stavebník",
  veduci_projektu: "Vedúci projektu",
  nazov_ciastky: "Názov časti",
  cislo_objektu: "Číslo objektu",
  cislo_casti_projektu: "Číslo časti projektu",
  zodpovedny_projektant: "Zodpovedný projektant",
  vypracoval: "Vypracoval",
  kontroloval: "Kontroloval",
  mierka: "Mierka",
  pocet_a4: "Počet A4",
  cislo_zmeny: "Číslo zmeny",
  popis_zmeny: "Popis zmeny",

  cislo_vykresu: "Číslo výkresu",
  nazov_vykresu: "Názov výkresu",
  format: "Formát",
  skratka_stupna: "Skratka stupňa",
  cislo_casti: "Číslo časti",
  cislo_ciastky: "Číslo čiastky",
  objednavatel: "Objednávateľ",
  vyhotovitel: "Vyhotoviteľ",
  revizia: "Revízia",
  mesto: "Mesto",
  stat: "Štát",
};

function titleCaseWord(word: string): string {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function formatMetadataFieldLabel(key: string): string {
  const k = key.trim();
  if (!k) return "";
  const mapped = METADATA_LABELS[k];
  if (mapped) return mapped;
  return k
    .split("_")
    .filter(Boolean)
    .map(titleCaseWord)
    .join(" ");
}
