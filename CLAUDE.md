# Brussels Socio-Economic Data Visualization App

## Project Overview
Interactive map visualization of the Brussels Capital Region showing socio-economic variables per monitoring district (wijk). Built as a single-page web app with Leaflet.

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS, Leaflet 1.9.4, CartoDB dark tiles
- **Fonts**: IBM Plex Sans + IBM Plex Mono (Google Fonts CDN)
- **Pre-processing**: Node.js scripts (xlsx, proj4, fast-xml-parser)
- **No build tools** — static files served directly

## Project Structure
```
Map Viz App/
  brussels-data-explorer.html    # Main app (single HTML file)
  data/
    brussels-districts.geojson   # Generated: monitoring district polygons (WGS84)
    brussels-data.json           # Generated: socio-economic indicator data
  scripts/
    prepare-data.mjs             # Pre-processing: GML→GeoJSON + Excel→JSON
  package.json
  # Source data files:
  UrbAdm_StatisticalUnits.gml          # 145 monitoring districts, EPSG:3035
  Data Brussels Neighborhoods v2.xlsx   # 59 wijken × 20 indicators (transposed)
  mq_data_export_2026-04-05.xlsx       # Alternative data export
```

## Data Pipeline
1. `scripts/prepare-data.mjs` converts GML→GeoJSON (EPSG:3035→WGS84) and Excel→JSON
2. Data joined via LAU2 code (Excel column A = GML base2:identifier)
3. Frontend loads pre-generated JSON/GeoJSON files

## Design System
- Dark theme: `--bg: #0e0f14`, `--surface: #161720`, `--accent: #e8c84a` (yellow), `--accent2: #4a9de8` (blue), `--accent3: #e84a6a` (red)
- 3-column layout: 340px left panel | map | 300px right panel
- Monospace for data, sans-serif for UI text

## Language
- UI is in Dutch (Nederlands)
- Variable names and code in English

## Key Features
- Choropleth map colored by dependent variable
- Variable selector (dependent + independent)
- Click district → slider panel to adjust independent variables
- Real-time regression prediction of dependent variable
- Correlation matrix (Pearson)
- Scatterplot (first independent vs dependent variable)
