# Letový deník – generátor údajů

Jednoduchá onepage aplikace pro vygenerování jednoho záznamu do letového deníku ze vstupních údajů. Čisté HTML, CSS a JavaScript.

## Vstupy

- Stav motohodin na začátku / na konci
- Počet přistání letadla před letem
- Počet přistání za let
- Letiště vzletu a přistání
- Čas vzletu
- Cvičení

## Dataset pilotů

Soubor `data/pilots.txt` – jeden pilot na řádek ve formátu `Jméno|Popis proslulosti`. Kliknutím na jméno v poli Posádka se zobrazí bublina s popisem.

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
