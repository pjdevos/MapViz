# Plan: Statistisch arsenaal uitbreiden met meerdere modellen

## Context
De app heeft momenteel enkel gewogen lineaire regressie (`multiLinearPredict`). De gebruiker wil meer complexe modellen, specifiek een decision tree. We voegen 3 modellen toe naast het bestaande lineaire model, allemaal in pure vanilla JS (geen externe libraries).

## Modellen
1. **Lineair** (bestaand) — `y = a + b*x`, gewogen op r-kwadraat
2. **Polynomiaal (graad 2)** — `y = a + b*x + c*x-kwadraat`, opgelost via 3x3 normaalvergelijkingen
3. **Regressieboom (CART)** — binaire recursieve partitie op variantiereductie, max depth=3, min leaf=5
4. **k-NN regressie** — k=7, Euclidische afstand met min-max normalisatie

## Kritieke bestanden
- `brussels-data-explorer.html` (NL)
- `brussels-data-explorer-en.html` (EN)

---

## Implementatiestappen

### Stap 1 — State variabelen + CSS
- Toevoegen na `heatVulnVars`: `let modelType = 'linear';` en `let currentTree = null;`
- CSS voor `.model-selector select` (passend bij dark theme)

### Stap 2 — Model selector dropdown
In het rechter paneel, boven de scatter canvas:
```html
<select id="model-select" onchange="setModel(this.value)">
  <option value="linear">Lineair</option>
  <option value="polynomial">Polynomiaal (gr. 2)</option>
  <option value="tree">Regressieboom</option>
  <option value="knn">k-NN (k=7)</option>
</select>
```

### Stap 3 — Nieuwe statistische functies (na `multiLinearPredict`)

**Polynomiaal:**
- `polyRegCoeffs(xs, ys, degree)` — normaalvergelijkingen via Gauss-eliminatie
- `multiPolyPredict(district, depV, indVs, validData)` — zelfde gewogen aanpak maar met polynomiale fit

**Regressieboom:**
- `buildRegressionTree(data, targetKey, featureKeys, maxDepth, minLeaf)` — CART: per feature, per split-kandidaat, variantiereductie berekenen, beste split nemen, recursief
- `treePredictSingle(node, dataPoint)` — boom doorlopen
- `treePredict(dData, depV, indVs, validData)` — wrapper
- `rebuildTree()` — cache in `currentTree`

**k-NN:**
- `knnPredictDistrict(dData, depV, indVs, validData)` — normaliseer features, Euclidische afstand, gemiddelde van k=7 dichtstbijzijnde

**Dispatcher:**
- `predictValue(district, depV, indVs)` — switcht op `modelType`
- `setModel(type)` — handler voor dropdown

### Stap 4 — Call sites updaten
Vervang `multiLinearPredict(...)` door `predictValue(...)` in:
- `updateSliderPanel()` (1x)
- `onSlider()` (1x)

### Stap 5 — Scatter plot: model-specifieke curve
In `updateScatter()`, vervang de vaste lineaire regressielijn door:
- **Linear:** rechte lijn (bestaand)
- **Polynomiaal:** 50 sample-punten, vloeiende curve
- **Boom:** trapfunctie (horizontale lijnsegmenten bij leaf-waarden, verticale sprongen bij splits)
- **k-NN:** 80 sample-punten, vloeiende curve

### Stap 6 — Stats bar uitbreiden
- Toon `Model` type
- Voeg `RMSE` toe
- Model-specifieke extra info (boom: depth/leaves, poly: graad, kNN: k)
- Bereken R-kwadraat generiek: `1 - SS_res/SS_tot`

### Stap 7 — EN versie
Identieke wijzigingen met Engelse labels ("Linear", "Polynomial (deg 2)", "Regression tree", "k-NN (k=7)")

### Stap 8 — CLAUDE.md bijwerken

---

## Verificatie
1. Selecteer lineair model, bestaand gedrag ongewijzigd
2. Selecteer polynomiaal, gebogen curve in scatter, aangepaste voorspelling
3. Selecteer regressieboom, trapfunctie in scatter, tree-based voorspelling
4. Selecteer k-NN, vloeiende niet-lineaire curve
5. Wissel variabelen/jaar, alle modellen updaten correct
6. Sleep slider, voorspelling update met gekozen model

---

## Algoritme details

### Polynomiale regressie (graad 2)
Los `y = a + b*x + c*x^2` op via normaalvergelijkingen. Bouw 3x3 matrix uit som van machten van x en kruisproducten met y. Gauss-eliminatie (3x3 is triviaal). Voor multivariabele voorspelling: zelfde gewogen aanpak als huidig `multiLinearPredict`, maar elke bivariate fit is kwadratisch in plaats van lineair.

### Regressieboom (CART)
Binaire recursieve partitie:
- Voor elke feature, voor elk mogelijk splitpunt (midpunten tussen gesorteerde unieke waarden):
  - Bereken variantiereductie = var(parent) - gewogen gemiddelde van var(links) + var(rechts)
- Kies de beste split, recurse op linker en rechter subsets
- Stop als: depth=0, n < 2*minLeaf, of geen variantie
- Leaf waarde = gemiddelde van de target in dat blad
- Max depth=3 geeft maximaal 8 leaves voor 57 datapunten
- Min samples per leaf=5

### k-NN regressie
- Normaliseer features naar [0,1] met training data min/max
- Bereken Euclidische afstand van query punt naar elk trainpunt
- Sorteer op afstand, neem k=7 dichtstbijzijnde
- Return gemiddelde van hun target waarden
