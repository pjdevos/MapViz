# BXL DataMap — Gebruikershandleiding

## Wat is BXL DataMap?

BXL DataMap is een interactieve webapplicatie waarmee je sociaal-economische data van het Brussels Hoofdstedelijk Gewest kunt verkennen op een kaart. De app toont 59 monitoringwijken met echte data van bronnen zoals IBSA en Statbel.

Je kunt:
- Variabelen visualiseren op een choropleth-kaart
- Correlaties berekenen tussen variabelen
- Een what-if analyse uitvoeren: wat als de werkloosheid in een wijk daalt?
- Tijdreeksen afspelen van 2005 tot 2025

---

## Installatie & Opstarten

### Vereisten
- Node.js (versie 16 of hoger)

### Stappen

1. Open een terminal in de map `Map Viz App`

2. Installeer de afhankelijkheden:
   ```
   npm install
   ```

3. Genereer de databestanden (eenmalig, of na wijziging van de brondata):
   ```
   node scripts/prepare-data.mjs
   ```

4. Start een lokale webserver:
   ```
   npx serve .
   ```

5. Open je browser op het getoonde adres (standaard `http://localhost:3000`)

6. Klik op `brussels-data-explorer.html`

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

De kaart toont de 59 monitoringwijken als gekleurde polygonen.

- **Kleurschaal**: van donkerblauw (laag) naar geel (hoog) voor de geselecteerde afhankelijke variabele
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
- Het regressiemodel gebruikt gewogen lineaire regressie (gewicht = R² per variabele)

### 5. Correlatiematrix

Het rechter paneel toont een correlatiematrix:

- **Blauw** = positieve correlatie
- **Rood** = negatieve correlatie
- **Intensiteit** = sterkte van de correlatie
- **Klik** op een cel om die combinatie in de scatterplot te tonen
- De waarde is de Pearson-correlatie (r) tussen -1 en +1

### 6. Scatterplot

Onder de correlatiematrix:

- Toont de spreiding van twee variabelen
- **Gestippelde gele lijn** = lineaire regressielijn
- **Blauw punt** = een wijk
- **Geel punt** = de geselecteerde wijk
- De correlatie (r) en het huidige jaar staan eronder

### 7. Statistieken

Onderaan het rechter paneel:

- **n wijken**: aantal wijken met beschikbare data
- **R²**: verklaarde variantie (hoe goed verklaart de eerste onafhankelijke variabele de afhankelijke?)
- **Pearson r**: correlatiecoëfficiënt
- **Jaar**: het huidige geselecteerde jaar

---

## Beschikbare indicatoren

| Indicator | Eenheid | Periode |
|-----------|---------|---------|
| OCMW-inkomen | % | 2005–2023 |
| Ondoordringbare opp. | % | 2022 |
| Sociale woningen | /100 huish. | 2010–2024 |
| Nabijheid groen | % | 2012 |
| Verhoogde tegemoetkoming | % | 2010–2024 |
| Bevolkingsdichtheid | inw/km² | 2005–2025 |
| Fijnstof PM2.5 | µg/m³ | 2018–2023 |
| Stikstofdioxide NO2 | µg/m³ | 2018–2023 |
| Mediaan inkomen | € | 2005–2022 |
| Mediaan app. prijs | € | 2013–2023 |
| Totale bevolking | inwoners | 2005–2025 |
| Vegetatiegraad | % | 2021–2023 |
| Werkloosheidsgraad | % | 2010–2023 |
| Verkeersgeluid Lden | dB(A) | 2021 |
| Verkeersgeluid Ln | dB(A) | 2021 |

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
3. Draai `node scripts/prepare-data.mjs` opnieuw
4. Herlaad de browser

---

## Veelgestelde vragen

**Waarom zie ik "n.b." bij sommige wijken?**
Niet elke indicator heeft data voor elk jaar en elke wijk. "n.b." betekent "niet beschikbaar".

**Waarom zijn sommige gebieden grijs?**
Het GML-bestand bevat 141 polygonen, maar slechts 57 daarvan hebben socio-economische data. De rest zijn parken, begraafplaatsen of industriegebieden.

**Kan ik eigen data toevoegen?**
Ja — zie de sectie "Nieuwe data toevoegen" hierboven.

**De app laadt niet — ik zie een foutmelding.**
Je moet de app via een HTTP-server openen (niet dubbelklikken op het HTML-bestand). Gebruik `npx serve .` in de terminal.
