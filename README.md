# Letový deník – generátor údajů

Jednoduchá onepage aplikace pro vygenerování jednoho záznamu do letového deníku ze vstupních údajů. Čisté HTML, CSS a JavaScript.

## Vstupy

- Stav motohodin na začátku / na konci
- Počet přistání letadla před letem
- Počet přistání za let
- Letiště vzletu a přistání
- Čas vzletu
- Cvičení

## Šablony letového deníku

Přepínání záložkami nad tabulkou:

- **OK-DUD24** – původní formát s druhem letu a dobou provozu celkem (h, m, vzlety)
- **OK-YAI56** – zjednodušený formát se stavem počítadla, vzlety celkem a cvičením v poznámkách

## Dataset pilotů

Soubor `data/pilots.txt` – jeden pilot na řádek ve formátu `Jméno|Popis proslulosti`. Kliknutím na jméno v poli Posádka se zobrazí bublina s popisem.

Soubor `data/exercises.txt` – cvičení ve formátu `kód|popis|solo|dual`. Pole Cvičení nabízí nápovědu; sólo = 1 pilot v posádce, dual = 2 piloti. Do sloupce Druh letu se vyplní pouze kód (např. `cv.21`).

## Výpočty

- Motohodiny v desetinném formátu (1356,9 = 1356 h 54 min), vstup akceptuje tečku i čárku
- Doba letu z rozdílu motohodin
- Čas přistání = čas vzletu + doba letu, zaokrouhleno na 5 minut
- Přistání celkem = stav před letem + přistání za let

## Lokální spuštění

```bash
python3 -m http.server 8080
```

## Nasazení na Cloudflare Pages

Framework preset: **None**, build command prázdný, output directory `/`.

## Instalace na plochu (PWA)

Aplikace podporuje uložení na plochu mobilního telefonu:

- **Android (Chrome):** nabídka prohlížeče → *Nainstalovat aplikaci* / *Přidat na plochu*
- **iPhone (Safari):** sdílecí tlačítko → *Přidat na plochu*

Vyžaduje nasazení přes HTTPS (Cloudflare Pages to splňuje).
