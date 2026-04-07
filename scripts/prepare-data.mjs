import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import proj4 from 'proj4';
import { XMLParser } from 'fast-xml-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// =====================================================================
// EPSG:3035 → EPSG:4326 projection
// =====================================================================
proj4.defs("EPSG:3035", "+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +units=m +no_defs");

function reproject(x, y) {
  const [lng, lat] = proj4("EPSG:3035", "EPSG:4326", [x, y]);
  return [Math.round(lng * 1e6) / 1e6, Math.round(lat * 1e6) / 1e6];
}

// =====================================================================
// 1. GML → GeoJSON
// =====================================================================
function convertGML() {
  console.log("Parsing GML...");
  const gml = readFileSync(join(ROOT, "UrbAdm_StatisticalUnits.gml"), "utf-8");

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    isArray: (name) => {
      return ["featureMember", "geographicalName", "SpellingOfName", "posList", "surfaceMember"].includes(name);
    }
  });

  const doc = parser.parse(gml);
  const members = doc.FeatureCollection.featureMember;
  console.log(`  Found ${members.length} features`);

  const features = [];

  for (const member of members) {
    const unit = member.AreaStatisticalUnit;
    if (!unit) continue;

    const thematicId = unit.thematicId?.ThematicIdentifier;
    const lau2 = thematicId ? parseInt(thematicId.identifier, 10) : null;
    if (lau2 === null) continue;

    const geoNames = Array.isArray(unit.geographicalName) ? unit.geographicalName : [unit.geographicalName];
    let nameFr = "", nameNl = "";
    for (const gn of geoNames) {
      const gnObj = gn?.GeographicalName;
      if (!gnObj) continue;
      const lang = gnObj.language;
      const spellings = Array.isArray(gnObj.spelling) ? gnObj.spelling : [gnObj.spelling];
      const text = spellings[0]?.SpellingOfName?.text || "";
      if (lang === "fre") nameFr = text;
      else if (lang === "dut") nameNl = text;
    }

    const geomWrapper = unit.geometry;
    if (!geomWrapper) continue;
    const vecGeom = geomWrapper.VectorStatisticalUnitGeometry;
    if (!vecGeom) continue;

    // Extract rings from either Surface or MultiSurface
    function parsePosList(posListRaw) {
      const posListStr = typeof posListRaw === "string" ? posListRaw :
                         Array.isArray(posListRaw) ? posListRaw[0] : String(posListRaw);
      const nums = posListStr.trim().split(/\s+/).map(Number);
      if (nums.length < 6) return null;
      const ring = [];
      for (let i = 0; i < nums.length; i += 2) {
        const [lng, lat] = reproject(nums[i + 1], nums[i]);
        ring.push([lng, lat]);
      }
      return ring;
    }

    function extractRingsFromSurface(surface) {
      if (!surface) return [];
      const posListRaw = surface.patches?.PolygonPatch?.exterior?.LinearRing?.posList;
      if (!posListRaw) return [];
      const ring = parsePosList(posListRaw);
      return ring ? [ring] : [];
    }

    let rings = [];
    const surface = vecGeom.geometry?.Surface;
    const multiSurface = vecGeom.geometry?.MultiSurface;

    if (surface) {
      rings = extractRingsFromSurface(surface);
    } else if (multiSurface) {
      // MultiSurface contains one or more surfaceMember > Surface
      let members = multiSurface.surfaceMember;
      if (!Array.isArray(members)) members = [members];
      for (const member of members) {
        const surf = member?.Surface || member;
        const memberRings = extractRingsFromSurface(surf);
        rings.push(...memberRings);
      }
    }

    if (rings.length === 0) continue;

    // Single polygon or MultiPolygon
    const geometry = rings.length === 1
      ? { type: "Polygon", coordinates: [rings[0]] }
      : { type: "MultiPolygon", coordinates: rings.map(r => [r]) };

    features.push({
      type: "Feature",
      properties: { lau2, nameFr, nameNl, name: nameNl || nameFr },
      geometry
    });
  }

  const geojson = { type: "FeatureCollection", features };
  writeFileSync(join(ROOT, "data", "brussels-districts.geojson"), JSON.stringify(geojson));
  console.log(`  Wrote ${features.length} features`);

  const test = features.find(f => f.properties.lau2 === 8);
  if (test) console.log(`  Verification — Marollen: [${test.geometry.coordinates[0][0]}]`);

  return geojson;
}

// =====================================================================
// 2. Excel → JSON (with full time series)
// =====================================================================

const INDICATOR_MAP = [
  { prefix: "Aandeel begunstigden van een OCMW", key: "ocmw_aandeel", label: "OCMW-inkomen", unit: "%" },
  { prefix: "Aandeel ondoordringbare oppervlakken", key: "ondoordringbaar", label: "Ondoordringbare opp.", unit: "%" },
  { prefix: "Aandeel sociale woningen", key: "sociale_woningen", label: "Sociale woningen", unit: "/100 huish." },
  { prefix: "Aandeel van de bevolking in de nabijheid", key: "groene_nabijheid", label: "Nabijheid groen", unit: "%" },
  { prefix: "Aandeel van de rechthebbenden op de verhoogde", key: "tegemoetkoming", label: "Verhoogde tegemoetkoming", unit: "%" },
  { prefix: "Bevolkingsdichtheid", key: "bevolkdicht", label: "Bevolkingsdichtheid", unit: "inw/km²" },
  { prefix: "Jaarlijkse gemiddelde concentraties fijnstof", key: "pm25", label: "Fijnstof PM2.5", unit: "µg/m³" },
  { prefix: "Jaarlijkse gemiddelde concentraties van stikstof", key: "no2", label: "Stikstofdioxide NO2", unit: "µg/m³" },
  { prefix: "Mediaan belastbaar inkomen", key: "mediaan_inkomen", label: "Mediaan inkomen", unit: "€" },
  { prefix: "Mediaan prijs van de verkopen", key: "mediaan_app_prijs", label: "Mediaan app. prijs", unit: "€" },
  { prefix: "Totale bevolking", key: "totale_bevolking", label: "Totale bevolking", unit: "inwoners" },
  { prefix: "Vegetatiegraad", key: "vegetatiegraad", label: "Vegetatiegraad", unit: "%" },
  { prefix: "Werkloosheidsgraad", key: "werkloosheidsgraad", label: "Werkloosheidsgraad", unit: "%" },
  { prefix: "Verkeersgeluid (multi-blootstelling): Lden", key: "geluid_lden", label: "Verkeersgeluid Lden", unit: "dB(A)" },
  { prefix: "Verkeersgeluid (multi-blootstelling): indicator Ln", key: "geluid_ln", label: "Verkeersgeluid Ln", unit: "dB(A)" },
  { prefix: "Aandeel alleenwonenden van 65 jaar en meer", key: "alleenwonenden_65plus", label: "Alleenwonenden 65+", unit: "%" },
  { prefix: "Aandeel Fransen", key: "aandeel_fransen", label: "Aandeel Fransen", unit: "%" },
  { prefix: "Aandeel van de nieuwe lidstaten van de EU", key: "aandeel_nieuwe_eu", label: "Nieuwe EU-lidstaten", unit: "%" },
  { prefix: "Aandeel van de Turken", key: "aandeel_turken", label: "Aandeel Turken", unit: "%" },
  { prefix: "Aandeel van Europa van 14", key: "aandeel_eu14", label: "Europa van 14", unit: "%" },
  { prefix: "Aandeel van Latijns-Amerika", key: "aandeel_latijns_amerika", label: "Latijns-Amerika", unit: "%" },
  { prefix: "Aandeel van Noord-Afrika", key: "aandeel_noord_afrika", label: "Noord-Afrika", unit: "%" },
  { prefix: "Aandeel van Sub-Saharisch Afrika", key: "aandeel_sub_sahara", label: "Sub-Saharisch Afrika", unit: "%" },
  { prefix: "Totaal aantal vreemdelingen", key: "totaal_vreemdelingen", label: "Totaal vreemdelingen", unit: "personen" },
  { prefix: "Vertegenwoordiging van gemeentelijke verkozenen", key: "gemeentelijke_verkozenen", label: "Gemeentelijke verkozenen", unit: "" },
  { prefix: "Aandeel van de 65-79 jarigen", key: "aandeel_65_79", label: "Aandeel 65-79 jaar", unit: "%" },
  { prefix: "Aandeel van de 80 jaar en ouder", key: "aandeel_80plus", label: "Aandeel 80+", unit: "%" },
  { prefix: "Senioriteitsco", key: "senioriteitscoeff", label: "Senioriteitscoëff. (80+/60+)", unit: "%" },
  { prefix: "Verkeersgeluid (multi-blootstelling): Lden", key: "geluid_lden", label: "Verkeersgeluid Lden", unit: "dB(A)" },
  { prefix: "Verkeersgeluid (multi-blootstelling): indicator Ln", key: "geluid_ln", label: "Verkeersgeluid Ln", unit: "dB(A)" },
  { prefix: "Aandeel alleenwonenden van 65 jaar", key: "alleenwonenden_65plus", label: "Alleenwonenden 65+", unit: "%" },
  { prefix: "Aandeel Fransen", key: "aandeel_fransen", label: "Aandeel Fransen", unit: "%" },
  { prefix: "Aandeel van de nieuwe lidstaten van de EU", key: "aandeel_nieuwe_eu", label: "Nieuwe EU-lidstaten", unit: "%" },
  { prefix: "Aandeel van de Turken", key: "aandeel_turken", label: "Aandeel Turken", unit: "%" },
  { prefix: "Aandeel van Europa van 14", key: "aandeel_eu14", label: "Europa van 14", unit: "%" },
  { prefix: "Aandeel van Latijns-Amerika", key: "aandeel_latijns_amerika", label: "Latijns-Amerika", unit: "%" },
  { prefix: "Aandeel van Noord-Afrika", key: "aandeel_noord_afrika", label: "Noord-Afrika", unit: "%" },
  { prefix: "Aandeel van Sub-Saharisch Afrika", key: "aandeel_sub_sahara", label: "Sub-Saharisch Afrika", unit: "%" },
  { prefix: "Totaal aantal vreemdelingen", key: "totaal_vreemdelingen", label: "Totaal vreemdelingen", unit: "personen" },
  { prefix: "Vertegenwoordiging van gemeentelijke verkozenen", key: "gemeentelijke_verkozenen", label: "Gemeentelijke verkozenen", unit: "" },
  { prefix: "Aantal mannen", key: "aantal_mannen", label: "Aantal mannen", unit: "personen" },
  { prefix: "Aantal vrouwen", key: "aantal_vrouwen", label: "Aantal vrouwen", unit: "personen" },
  { prefix: "Geslachtsverhouding", key: "geslachtsverhouding", label: "Geslachtsverhouding", unit: "%" },
  { prefix: "Bedekkingsgraad door hoge vegetatie", key: "bedekkingsgraad_veg", label: "Hoge vegetatie", unit: "%" },
  { prefix: "Aantal verkopen van appartementen", key: "aantal_verkopen_app", label: "Verkopen app.", unit: "aantal" },
  { prefix: "Oppervlakte", key: "oppervlakte", label: "Oppervlakte", unit: "km²" },
  // Berekende kwetsbaarheidsindex (gewogen samengestelde index, 0-100)
  // Gebaseerd op Lanza et al. (2024) en Vlaamse Ouderenraad armoederisico-data
  // Fransen en EU-14 bewust uitgesloten (welgestelde expats)
  { prefix: "Kwetsbaarheidsindex (totaal)", key: "kwetsbaarheid_totaal", label: "Kwetsbaarheidsindex (totaal)", unit: "0-100" },
  { prefix: "Kwetsbaarheidsindex: Sociaal-economisch", key: "kwetsbaarheid_sociaal_eco", label: "Kwetsbaarheidsindex: Soc.-eco.", unit: "0-100" },
  { prefix: "Kwetsbaarheidsindex: Demografisch", key: "kwetsbaarheid_demografisch", label: "Kwetsbaarheidsindex: Demografisch", unit: "0-100" },
  { prefix: "Kwetsbaarheidsindex: Milieu-blootstelling", key: "kwetsbaarheid_milieu", label: "Kwetsbaarheidsindex: Milieu", unit: "0-100" },
  { prefix: "Kwetsbaarheidsindex: Woonsituatie", key: "kwetsbaarheid_wonen", label: "Kwetsbaarheidsindex: Wonen", unit: "0-100" },
];

function convertExcel() {
  console.log("\nParsing Excel...");
  // Gebruik het bestand mét kwetsbaarheidsindex-kolommen indien beschikbaar,
  // anders val terug op het origineel.
  const xlsxFile = join(ROOT, "Data Brussels Neighborhoods v2.xlsx");
  console.log(`  Bestand: ${xlsxFile.split("/").pop()}`);
  const wb = XLSX.readFile(xlsxFile);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const range = XLSX.utils.decode_range(ws["!ref"]);

  function cell(r, c) {
    const addr = XLSX.utils.encode_cell({ r, c });
    const cl = ws[addr];
    return cl ? cl.v : null;
  }

  // Step 1: Find ALL year-columns for each indicator (not just the last)
  // Structure: indicatorYearCols[key] = [{ col, year }, ...]
  const indicatorYearCols = {};
  const matchedKeys = new Set();

  for (let c = 2; c <= range.e.c; c++) {
    const name = cell(0, c);
    if (!name) continue;
    const nameStr = String(name);

    for (const ind of INDICATOR_MAP) {
      if (nameStr.startsWith(ind.prefix)) {
        if (!indicatorYearCols[ind.key]) {
          indicatorYearCols[ind.key] = { ...ind, years: [] };
        }
        const year = cell(2, c);
        if (year && typeof year === "number") {
          // Avoid duplicate years (some indicators appear twice in the spreadsheet)
          if (!indicatorYearCols[ind.key].years.find(y => y.year === year)) {
            indicatorYearCols[ind.key].years.push({ col: c, year });
          }
        }
        break;
      }
    }
  }

  // Sort years
  for (const key of Object.keys(indicatorYearCols)) {
    indicatorYearCols[key].years.sort((a, b) => a.year - b.year);
  }

  console.log("  Indicators with time series:");
  for (const [key, ind] of Object.entries(indicatorYearCols)) {
    const years = ind.years.map(y => y.year);
    console.log(`    ${key}: ${years[0]}–${years[years.length-1]} (${years.length} years)`);
  }

  // Step 2: Read ALL neighborhood data for ALL years
  // Structure: neighborhoods[lau2] = { code, name, timeseries: { key: { year: value } }, latest: { key: value } }
  const neighborhoods = {};

  for (let r = 3; r <= range.e.r; r++) {
    const code = cell(r, 0);
    const name = cell(r, 1);
    if (code === null || code === undefined || !name) continue;
    const lau2 = parseInt(code, 10);
    if (isNaN(lau2) || lau2 === 0) continue;

    const timeseries = {};
    const latest = {};

    for (const [key, ind] of Object.entries(indicatorYearCols)) {
      timeseries[key] = {};
      for (const { col, year } of ind.years) {
        const val = cell(r, col);
        if (val !== null && val !== undefined && val !== "VS" && val !== "ND" && typeof val === "number") {
          timeseries[key][year] = val;
        }
      }
      // Latest = most recent year with data
      const sortedYears = Object.keys(timeseries[key]).map(Number).sort((a,b) => b - a);
      if (sortedYears.length > 0) {
        latest[key] = timeseries[key][sortedYears[0]];
      }
    }

    neighborhoods[lau2] = { code: lau2, name: String(name), timeseries, latest };
  }

  // Step 3: Compute metadata with global min/max across ALL years
  const metadata = {};
  const allYearsSet = new Set();

  for (const [key, ind] of Object.entries(indicatorYearCols)) {
    const allValues = [];
    const yearsWithData = new Set();

    for (const nb of Object.values(neighborhoods)) {
      const ts = nb.timeseries[key] || {};
      for (const [yr, val] of Object.entries(ts)) {
        allValues.push(val);
        yearsWithData.add(Number(yr));
        allYearsSet.add(Number(yr));
      }
    }

    if (allValues.length === 0) continue;

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range_ = max - min;
    let step;
    if (range_ > 10000) step = 100;
    else if (range_ > 1000) step = 50;
    else if (range_ > 100) step = 5;
    else if (range_ > 10) step = 0.5;
    else step = 0.1;

    const sortedYears = [...yearsWithData].sort((a,b) => a - b);

    metadata[key] = {
      label: ind.label,
      unit: ind.unit,
      years: sortedYears,
      latestYear: sortedYears[sortedYears.length - 1],
      min: Math.floor(min * 10) / 10,
      max: Math.ceil(max * 10) / 10,
      step,
      count: Object.keys(neighborhoods).length
    };
  }

  const allYears = [...allYearsSet].sort((a,b) => a - b);
  console.log(`\n  Global year range: ${allYears[0]}–${allYears[allYears.length-1]}`);

  const result = { neighborhoods, metadata, allYears };
  const outPath = join(ROOT, "data", "brussels-data.json");
  writeFileSync(outPath, JSON.stringify(result));
  console.log(`  Wrote ${Object.keys(neighborhoods).length} neighborhoods to ${outPath}`);

  return result;
}

// =====================================================================
// 3. Merge: embed LATEST data into GeoJSON properties
// =====================================================================
function mergeData(geojson, data) {
  console.log("\nMerging data into GeoJSON...");
  let matched = 0, unmatched = 0;

  for (const feature of geojson.features) {
    const lau2 = feature.properties.lau2;
    const nb = data.neighborhoods[lau2];
    if (nb) {
      feature.properties.naam = nb.name;
      Object.assign(feature.properties, nb.latest);
      feature.properties.hasData = true;
      matched++;
    } else {
      feature.properties.hasData = false;
      unmatched++;
    }
  }

  const outPath = join(ROOT, "data", "brussels-merged.geojson");
  writeFileSync(outPath, JSON.stringify(geojson));
  console.log(`  Matched: ${matched}, No data: ${unmatched}`);
}

// =====================================================================
// RUN
// =====================================================================
const geojson = convertGML();
const data = convertExcel();
mergeData(geojson, data);
console.log("\nDone!");
