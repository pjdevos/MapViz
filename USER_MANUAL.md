# BXL DataMap — Gebruikershandleiding

## Wat is BXL DataMap?

BXL DataMap is een interactieve webapplicatie waarmee je sociaal-economische data van het Brussels Hoofdstedelijk Gewest kunt verkennen op een kaart. De app toont 56 monitoringwijken met echte data van bronnen zoals IBSA en Statbel.

Je kunt:
- Variabelen visualiseren op een choropleth-kaart
- Correlaties berekenen tussen variabelen
- Verschillende statistische modellen toepassen (lineair, polynomiaal, regressieboom, k-NN)
- Een what-if analyse uitvoeren: wat als de werkloosheid in een wijk daalt?
- Tijdreeksen afspelen van 1981 tot 2025

---

## Installatie & Opstarten

### Vereisten
- Node.js (versie 16 of hoger)

### Stappen

1. Open een terminal in de map `MapVizApp`

2. Installeer de afhankelijkheden:
   ```
   npm install
   ```

3. Genereer de databestanden (eenmalig, of na wijziging van de brondata):
   ```
   npm run build
   ```

4. Start een lokale webserver:
   ```
   npx serve .
   ```

5. Open je browser op het getoonde adres (standaard `http://localhost:3000`)

6. Klik op `brussels-data-explorer.html`

**Online versie**: De app is ook beschikbaar via Vercel (auto-deploy vanuit GitHub).

---

## Overzicht van de interface

De app bestaat uit drie panelen:

```
┌─────────────────────────────────────────────────────┐
│                     HEADER                          │
├────────────┬──────────────────┬─────────────────────┤
│            │                  │                     │
│  LINKS     │     KAART        │    RECHTS           │
│  PANEEL    │                  │    PANEEL            │
│            │                  │                     │
│ - Jaar     │  Interactieve    │ - Correlatiematrix  │
│ - Variab.  │  kaart van       │ - Scatterplot       │
│ - Sliders  │  Brussel         │ - Statistieken      │
│            │                  │                     │
└────────────┴──────────────────┴─────────────────────┘
```

---

## Functies in detail

### 1. Tijdreeks-slider

Bovenaan het linker paneel vind je de **jaar-slider**.

- **Sleep de slider** om een specifiek jaar te kiezen (2005–2025)
- **Klik op de play-knop** (▶) om een animatie te starten die door alle beschikbare jaren loopt
- Klik opnieuw om te pauzeren (⏸)
- De kaart, correlatiematrix en scatterplot updaten automatisch per jaar
- Niet elke indicator heeft data voor elk jaar. Als er geen data is voor het gekozen jaar, wordt het dichtstbijzijnde beschikbare jaar gebruikt

### 2. Variabelen kiezen

Onder de jaar-slider staan twee secties:

**Afhankelijke variabele** (geel, ●)
- Dit is de variabele die op de kaart wordt gevisualiseerd
- Klik op een knop om deze als afhankelijke variabele in te stellen
- Voorbeeld: "Werkloosheidsgraad"

**Onafhankelijke variabelen** (blauw, ●)
- Dit zijn de variabelen waarmee je de afhankelijke variabele wilt verklaren
- Klik om te (de)selecteren — je kunt er meerdere tegelijk kiezen
- Voorbeeld: "Mediaan inkomen", "OCMW-inkomen", "Verhoogde tegemoetkoming"

### 3. Kaart

De kaart toont de 56 monitoringwijken als gekleurde polygonen.

- **Kleurschaal**: marineblauw (laag) → lichtgeel (gemiddeld) → oranjerood (hoog). Bij "omgekeerde" variabelen (bijv. werkloosheid) staat rood voor hoge (ongunstige) waarden en blauw voor lage (gunstige) waarden.
- **Hover** over een wijk om de naam en waarde te zien
- **Klik** op een wijk om deze te selecteren voor de what-if analyse
- Grijze gebieden hebben geen beschikbare data (parken, industriezones, etc.)
- De legenda rechtsonder toont de kleurschaal

### 4. What-if analyse (sliders)

Na het klikken op een wijk verschijnen sliders in het linker paneel:

- Elke slider vertegenwoordigt een **onafhankelijke variabele**
- Sleep een slider om de waarde aan te passen
- De **geschatte waarde** van de afhankelijke variabele wordt direct herberekend
- De delta (verschil) wordt groen (positief) of rood (negatief) weergegeven
- Het gebruikte model hangt af van de geselecteerde methode (zie "Statistische modellen")

### 5. Correlatiematrix

Het rechter paneel toont een correlatiematrix:

- **Blauw** = positieve correlatie
- **Rood** = negatieve correlatie
- **Intensiteit** = sterkte van de correlatie
- **Klik** op een cel om die combinatie in de scatterplot te tonen
- De waarde is de Pearson-correlatie (r) tussen -1 en +1

### 6. Statistische modellen

Boven de scatterplot staat een **model-selector** (dropdown) waarmee je het voorspellingsmodel kunt kiezen:

| Model | Beschrijving | Wanneer gebruiken? |
|-------|-------------|-------------------|
| **Lineair** | Gewogen bivariate lineaire regressie (gewicht = R² per variabele) | Standaard. Goed bij lineaire verbanden. |
| **Polynomiaal (gr. 2)** | Kwadratische fit via normaalvergelijkingen + Gauss-eliminatie | Wanneer het verband een boog of U-vorm vertoont. |
| **Regressieboom** | CART-algoritme: recursief opsplitsen op variantiereductie (max diepte 3, min 5 per blad) | Bij niet-lineaire, stapsgewijze patronen. Makkelijk interpreteerbaar. |
| **k-NN (k=7)** | k-Nearest Neighbors: gemiddelde van de 7 dichtstbijzijnde wijken (Euclidische afstand, min-max genormaliseerd) | Bij complexe, lokale patronen zonder duidelijke functionele vorm. |

Het gekozen model wordt gebruikt voor:
- De **what-if analyse** (slider-voorspellingen)
- De **regressiecurve** in de scatterplot
- De berekening van **R²** en **RMSE** in de statistieken

### 7. Scatterplot

Onder de model-selector:

- Toont de spreiding van twee variabelen
- **Gestippelde gele lijn/curve** = fit van het geselecteerde model:
  - Lineair: rechte lijn
  - Polynomiaal: vloeiende parabolische curve
  - Regressieboom: trapfunctie (horizontale segmenten met verticale sprongen)
  - k-NN: vloeiende niet-lineaire curve
- **Blauw punt** = een wijk
- **Geel punt** = de geselecteerde wijk
- De correlatie (r) en het huidige jaar staan eronder

### 8. Statistieken

Onderaan het rechter paneel:

- **n wijken**: aantal wijken met beschikbare data
- **Model**: het actieve voorspellingsmodel
- **R²**: verklaarde variantie, berekend op basis van het gekozen model (1 - SS_res/SS_tot)
- **RMSE**: Root Mean Square Error — gemiddelde voorspellingsfout in de eenheid van de afhankelijke variabele
- **Pearson r**: correlatiecoëfficiënt (altijd lineair, ongeacht het gekozen model)
- **Jaar**: het huidige geselecteerde jaar

---

## Beschikbare indicatoren

De 39 indicatoren zijn georganiseerd in 4 uitklapbare categorieën:

**Bevolking (19 variabelen)**

| Indicator | Eenheid | Periode |
|-----------|---------|---------|
| Totale bevolking | inwoners | 2005–2025 |
| Bevolkingsdichtheid | inw/km² | 2005–2025 |
| Oppervlakte | km² | 2020–2024 |
| Aantal mannen | personen | 2005–2025 |
| Aantal vrouwen | personen | 2005–2025 |
| Geslachtsverhouding | % | 2005–2025 |
| Aandeel 65-79 jaar | % | 1997–2025 |
| Aandeel 80+ | % | 1981–2025 |
| Senioriteitscoëff. (80+/60+) | % | 2019–2025 |
| Alleenwonenden 65+ | % | 2001–2024 |
| Aandeel Fransen | % | 1997–2025 |
| Europa van 14 | % | 2000–2025 |
| Nieuwe EU-lidstaten | % | 1997–2025 |
| Aandeel Turken | % | 1997–2025 |
| Latijns-Amerika | % | 1996–2025 |
| Noord-Afrika | % | 1997–2025 |
| Sub-Saharisch Afrika | % | 1997–2025 |
| Totaal vreemdelingen | personen | 1981–2025 |
| Gemeentelijke verkozenen | — | 2006–2012 |

**Milieu (8 variabelen)**

| Indicator | Eenheid | Periode |
|-----------|---------|---------|
| Ondoordringbare opp. | % | 2022 |
| Nabijheid groen | % | 2012 |
| Vegetatiegraad | % | 2021–2023 |
| Hoge vegetatie | % | 2021 |
| Fijnstof PM2.5 | µg/m³ | 2018–2023 |
| Stikstofdioxide NO2 | µg/m³ | 2018–2023 |
| Verkeersgeluid Lden | dB(A) | 2021 |
| Verkeersgeluid Ln | dB(A) | 2021 |

**Sociaal-economisch (7 variabelen)**

| Indicator | Eenheid | Periode |
|-----------|---------|---------|
| Werkloosheidsgraad | % | 2010–2023 |
| Mediaan inkomen | € | 2005–2022 |
| OCMW-inkomen | % | 2005–2023 |
| Verhoogde tegemoetkoming | % | 2010–2024 |
| Sociale woningen | /100 huish. | 2010–2024 |
| Mediaan app. prijs | € | 2013–2023 |
| Verkopen app. | aantal | 2013–2023 |

**Hittekwetsbaarheid (5 variabelen)**

| Indicator | Eenheid | Periode |
|-----------|---------|---------|
| Kwetsbaarheidsindex (totaal) | index | 2025 |
| Kwetsbaarheidsindex: Soc.-eco. | index | 2025 |
| Kwetsbaarheidsindex: Demografisch | index | 2025 |
| Kwetsbaarheidsindex: Milieu | index | 2025 |
| Kwetsbaarheidsindex: Wonen | index | 2025 |

---

## Data-bronnen

- **Kaartgrenzen**: UrbIS — Brussels UrbIS®© (UrbAdm_StatisticalUnits), EPSG:3035
- **Sociaal-economische data**: IBSA Monitoring des Quartiers / Statbel
- **Databestand**: `Data Brussels Neighborhoods v2.xlsx`

---

## Technische details

### Dataverwerking

Het script `scripts/prepare-data.mjs` voert twee conversies uit:

1. **GML → GeoJSON**: converteert de monitoring-district polygonen van EPSG:3035 (Europese Lambert) naar EPSG:4326 (WGS84/GPS-coördinaten)
2. **Excel → JSON**: extraheert alle indicatoren met volledige tijdreeksen en koppelt ze aan de kaartpolygonen via de LAU2-code

### Gegenereerde bestanden (in `data/`)

- `brussels-districts.geojson` — polygonen zonder data
- `brussels-data.json` — alle indicator-data met tijdreeksen
- `brussels-merged.geojson` — polygonen + meest recente data (voor de kaart)

### Nieuwe data toevoegen

1. Voeg kolommen toe aan het Excel-bestand (zelfde structuur: indicator in rij 1, eenheid in rij 2, jaar in rij 3)
2. Voeg de indicator toe aan `INDICATOR_MAP` in `scripts/prepare-data.mjs`
3. Draai `npm run build` opnieuw
4. Herlaad de browser

---

## Veelgestelde vragen

**Waarom zie ik "n.b." bij sommige wijken?**
Niet elke indicator heeft data voor elk jaar en elke wijk. "n.b." betekent "niet beschikbaar".

**Waarom zijn sommige gebieden grijs?**
Het GML-bestand bevat 145 polygonen, maar slechts 56 daarvan hebben socio-economische data. De rest zijn parken, begraafplaatsen of industriegebieden.

**Kan ik eigen data toevoegen?**
Ja — zie de sectie "Nieuwe data toevoegen" hierboven.

**De app laadt niet — ik zie een foutmelding.**
Je moet de app via een HTTP-server openen (niet dubbelklikken op het HTML-bestand). Gebruik `npx serve .` in de terminal.
