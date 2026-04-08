# Brussels Socio-Economic Data Visualization App

## Project Overview
Interactive map visualization of the Brussels Capital Region showing socio-economic, environmental, demographic and heat vulnerability indicators per monitoring district (wijk). Built as a single-page web app with Leaflet. Available in Dutch and English.

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS, Leaflet 1.9.4, CartoDB dark tiles
- **Fonts**: IBM Plex Sans + IBM Plex Mono (Google Fonts CDN)
- **Pre-processing**: Node.js scripts (xlsx, proj4, fast-xml-parser)
- **Hosting**: Vercel (static deployment from GitHub)
- **No build tools** — static files served directly

## Project Structure
```
MapVizApp/
  brussels-data-explorer.html    # Main app (Dutch)
  brussels-data-explorer-en.html # Main app (English)
  vercel.json                    # Rewrites / to NL version
  data/
    brussels-districts.geojson   # Generated: monitoring district polygons (WGS84)
    brussels-data.json           # Generated: socio-economic indicator data (39 vars)
    brussels-merged.geojson      # Generated: geometry + latest data merged
  scripts/
    prepare-data.mjs             # Pre-processing: GML→GeoJSON + Excel→JSON
  package.json
  # Source data files:
  UrbAdm_StatisticalUnits.gml          # 145 monitoring districts, EPSG:3035
  Data Brussels Neighborhoods v2.xlsx   # 57 wijken × 39 indicators (transposed)
```

## Data Pipeline
1. `scripts/prepare-data.mjs` converts GML→GeoJSON (EPSG:3035→WGS84) and Excel→JSON
2. Data source: `Data Brussels Neighborhoods v2.xlsx` (single source of truth)
3. Data joined via LAU2 code (Excel column A = GML base2:identifier)
4. Frontend loads pre-generated JSON/GeoJSON files

## Design System
- Dark theme: `--bg: #0e0f14`, `--surface: #161720`, `--accent: #e8c84a` (yellow), `--accent2: #4a9de8` (blue), `--accent3: #e84a6a` (red)
- 3-column layout: 340px left panel | map | 300px right panel
- Monospace for data, sans-serif for UI text
- Two color scales:
  - Default: dark blue → teal → yellow (standard indicators)
  - Heat vulnerability: navy blue → light yellow → orange-red (kwetsbaarheidsindex vars)

## Language
- UI available in Dutch (NL) and English (EN), toggle button in header
- Variable names and code in English
- Data labels in Dutch (translated via LABEL_EN mapping in EN version)

## Key Features
- Choropleth map colored by dependent variable
- Variable selector with 4 collapsible categories:
  - **Bevolking/Population** (19 vars): demographics, nationalities, age groups
  - **Milieu/Environment** (8 vars): surfaces, vegetation, air quality, noise
  - **Sociaal-economisch/Socio-economic** (7 vars): income, housing, employment
  - **Hittekwetsbaarheid/Heat vulnerability** (5 vars): composite vulnerability indices
- Click district → slider panel to adjust independent variables
- Real-time regression prediction of dependent variable
- Four statistical models (dropdown selector):
  - **Linear** — weighted bivariate linear regression (r²-weighted)
  - **Polynomial (deg 2)** — quadratic fit via normal equations + Gaussian elimination
  - **Regression tree (CART)** — binary recursive partitioning, max depth=3, min leaf=5
  - **k-NN (k=7)** — Euclidean distance with min-max normalization
- Model-aware R² and RMSE in stats bar
- Correlation matrix (Pearson)
- Scatterplot (first independent vs dependent variable)
- Time series with year slider (1981–2025, varies per indicator)
- Three basemaps: Satellite, Heat Island (WMS overlay), Dark

## GitHub & Deployment
- Repository: https://github.com/pjdevos/MapViz
- Hosted on Vercel: auto-deploys from main branch
- Root URL serves NL version via vercel.json rewrite
