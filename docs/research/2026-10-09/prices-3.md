# Commodity prices c.1500, round 3: hides, raisins, cotton cloth, cork, alum, gum arabic

Research notes, 2026-10-09. Conventions as in `prices.md` / `prices-2.md`:
1 ducat = 375 mrs (pre-1497 documents often 360); d/t = ducats per metric ton;
base = producer price ÷ 0.8, or distant-market price ÷ 1.4.

- **[opened]**: I read the PDF/HTML/OCR text myself.
- **[snippet]**: archive.org full-text-search highlight fragments (a few lines of the
  real book text around the hit, not the page) or a search-engine summary.

## 0. Access this round

| Source                                                                                                                                                                                                                                                         | Status                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hamilton 1936, _Money, Prices, and Wages in Valencia, Aragon, and Navarre_ — archive.org `moneypriceswages0000hami`                                                                                                                                            | Lending-only (djvu 401, search-inside 403). **But archive.org's full-text search indexes it**: `https://archive.org/services/search/beta/page_production/?service_backend=fts&user_query=identifier:<id> AND <term>&page_type=search_results` returns highlight fragments. For price tables the fragments are unusable (columns without headers/years). No hits for alum/cork/hides/cotton. |
| Same FTS trick works for other lending books: Hamilton 1934 (`americantreasure0043hami`), _A Tudor Book of Rates_ (Willan 1962, `tudorbookofrates0000grea`), _The Port and Trade of Early Elizabethan London_ (Dietz 1972, `porttradeofearly0000unse`)         | [snippet] only. Used below.                                                                                                                                                                                                                                                                                                                                                                 |
| **Igual Luis, D., "La producción y el comercio del alumbre en los reinos hispánicos del siglo XV", _MEFRM_ 126-1 (2014), https://journals.openedition.org/mefrm/1681**                                                                                         | **[opened]** (full HTML). The find of the round for alum.                                                                                                                                                                                                                                                                                                                                   |
| Houssaye Michienzi, I. & Cardon, D., "Sourcing and consumption of alum in the dyeing company Francesco di Giuliano Salviati e Comp. (1483-1498)", _Artefact_ 16 (2022), https://journals.openedition.org/artefact/12120                                        | **[opened]** (full HTML). Florence alum prices 1483-1511.                                                                                                                                                                                                                                                                                                                                   |
| Boisseuil, D., "La production d'alun en Occident", Datini Studies 3 (FUP 2023). OAPEN/FUP behind bot walls; Wayback copy `web.archive.org/web/20240807133031id_/https://library.oapen.org/bitstream/handle/20.500.12657/74831/9791221500929-20.pdf;sequence=1` | **[opened]**. Production/organisation only; no prices. Gives "30 000 cantares d'alun par an (environ 1500 tonnes)".                                                                                                                                                                                                                                                                         |
| Carreira, A., _Panaria Cabo-Verdiano-Guineense_ (Lisboa 1968), archive.org `dli.ernet.535237` (open, djvu text)                                                                                                                                                | **[opened]**. Pano prices only from 1624 on; no 1500 price.                                                                                                                                                                                                                                                                                                                                 |
| _Documents Illustrating the Overseas Trade of Bristol in the 16th c._ (Bristol Rec. Soc. 31), archive.org `bristol-record-society-31`                                                                                                                          | **[opened]**. 1537 raisin shipment; 1583-84 and 1601 customs values.                                                                                                                                                                                                                                                                                                                        |
| Childs, _Anglo-Castilian Trade_ (1978), archive.org `anglo-castilian-trade-wendy-childs`                                                                                                                                                                       | [opened]. Context only, no prices.                                                                                                                                                                                                                                                                                                                                                          |
| Rogers vol. IV (again)                                                                                                                                                                                                                                         | [opened]. Ox hides per piece only; no weights.                                                                                                                                                                                                                                                                                                                                              |
| Delumeau 1962 / Zippel 1907 / Heers                                                                                                                                                                                                                            | Not found online. Delumeau is cited via Igual (cantaro = 50 kg).                                                                                                                                                                                                                                                                                                                            |
| Google Books API 429, HathiTrust 403, FUP/OAPEN/RepositóriUM/rcaap behind Anubis/403, ddd.uab.cat refused, Chrome extension not connected.                                                                                                                     | Dead ends.                                                                                                                                                                                                                                                                                                                                                                                  |

## 1. Alum — current base 40 → **recommend 25 (range 20-32), `qualitative`**

### Mazarrón (Murcia), producer prices, all **[opened]** in Igual Luis 2014

Units stated by the source: n.59 "La equivalencia métrica actual del quintal castellano es de unos 46 quilos";
n.72 "una carga equivalía a 3 quintales y un quintal a 4 arrobas … El quintal valenciano de la época sumaba unos 42 quilos";
n.38 "El cántaro [romano] equivalía a 50 quilos".

| Year | Original (quote / ref)                                                                                                                                                                                                    | → d/t                                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1485 | Lease of Mazarrón: lessees deliver 4,000 quintales/yr to the owners "al precio de 230 maravedís por quintal" (n.76, citing Franco Silva 1980, 1996)                                                                       | 230 / 46 kg = 5.00 mrs/kg → **13.3** (13.9 at 360 mrs). Ex-works cost to the noble owners.                                     |
| 1487 | Rey brothers sell 3,000 quintales to Agostino Giustiniano "a 19 sueldos valencianos cada uno, entregables « en les cases dels alums de Maçarró »" (§22, ARV Protocolos 2675)                                              | At 21 sous/ducat [see below]: 0.905 ducat per quintal → **21.5** (Valencian 42 kg) or **19.7** (Castilian 46 kg). At the mine. |
| 1488 | Giustiniano sells 500 quintales of Mazarrón alum to Pedro de Castro of Burgos, loaded on ship at Mazarrón, "su precio, 350 maravedís por quintal, debía pagarse en la feria de Medina del Campo de octubre de 1489" (§23) | 350 / 46 = 7.61 mrs/kg → **20.3** (21.1 at 360). F.o.b. producer, on ~1 year's credit (includes interest).                     |

Producer level ≈ **20 d/t** (1487-88 merchant sales); 13 is the lessee's transfer price to the owners.
Base = 20 ÷ 0.8 = **25**.

### Valencia market (Tolfa alum imported via Civitavecchia), **[opened]** Igual Luis 2014

| Year     | Original                                                                                                           | → d/t (21 sous/ducat, carga = 3 × 42 = 126 kg) |
| -------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| 1462     | 8 cargas "a 320 sueldos por carga" (§29) — before western alum reached the market                                  | 320/21 = 15.2 ducats / 0.126 t = **121**       |
| 1482     | Spannochi retail "80 sueldos valencianos por carga" (n.95)                                                         | **30**                                         |
| 1489     | Cesare di Barzi retail "70 sueldos por carga" (n.95)                                                               | **26**                                         |
| Dec 1494 | Wholesale, 500 cargas (1,500 quintales) "de Civeta Vecha, a 60 sueldos valencianos por carga" (§26)                | **22.7**                                       |
| 1494-95  | Retail to dyers, 2-30 cargas: "de un máximo de 70 sueldos valencianos por carga a un mínimo de 56'5 sueldos" (§28) | **21-26**                                      |

Igual himself reads the 1462 → 1490s fall as the effect of western alum on prices.
Valencia is close to Mazarrón and imported Tolfa alum in bulk, so it sits between producer and distant market.
As a distant market (÷1.4) it gives 15-19.

### Florence (distant market for Tuscan/papal alum), **[opened]** Houssaye Michienzi & Cardon 2022

Prices are given "in denari per 100 Florentine pounds" of florin _a oro larghi_. The worked entry
"florins three larghi for pounds 200" shows 1 florin = 240 denari (3 fl / 200 lb = 360 d per 100 lb).
The article gives 1 Florentine pound = 0.339 kg. Florin larghi ≈ ducat (gold); I did not verify the exact parity.

| Years                | Price per 100 lb                                                              | → florins/t                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1483-1494            | "constant … 359/360 denari" (1.50 fl)                                         | 1.50 / 0.0339 = **44**                                                                                                            |
| 1495-1499            | "around 288 denari" (1.20 fl)                                                 | **35**                                                                                                                            |
| 1502-1505            | "average about 371 denari"                                                    | **46**                                                                                                                            |
| 1508-1511            | "571 denari"                                                                  | **70**                                                                                                                            |
| 1473 (producer side) | Salviati bank buys "900 cantares of alum of Montaone … for 1890 gold florins" | 2.1 fl/cantare. At ~50 kg/cantare (Igual's figure for the Roman cantaro; **the Tuscan cantare weight is my assumption**) → **42** |

Distant market 35-44 ÷ 1.4 = **25-32**. These are Arte della Lana prices to dyers, so they include a regulated guild margin.

### Conversion: Valencian sou → ducat

- **[snippet]** A 1992 _Medievalia_ (UAB) article, seen only as a search summary, says: "Como el ducado valía en Valencia 21 s.", "21 sueldos, o sea 1 ducado de oro, equivalían prácticamente a 375 maravedís" (applied to 1496). The PDF host refused connections.
- **Internal cross-check, [opened]:** Mazarrón alum at the mine was 19 sous in 1487 and 350 mrs in 1488. That implies 1 sou ≈ 18.4 mrs, i.e. **≈ 20.4 sous per ducat**. This agrees with 21, as long as the two prices refer to the same quintal.

### Late cross-check, [snippet]

Willan's _Tudor Book of Rates_ has "alum, valued at 33 s. 4 d. cwt.". London 1567-68 entries match it: "10 cwt alum £16 13s 4d"; "4½ cwt alum £7 10s".

### Verdict

Producer 20 → 25. Distant Florence → 25-32. Valencia → 15-19 (distant) or 27-33 (near-producer).
**Base 25-30; recommend 25.** That is 0.8 × 25 = 20 at the producing port (= Mazarrón 1487-88) and 1.4 × 25 = 35 elsewhere (= Florence 1495-99).

The current 40 is ~1.6× high for c.1490-1500. It would fit the 1460s, or the post-1505 price rise (Florence 1508-11 = 70).

Grade **`qualitative`**: the source is opened and gives its own units (quintal 46/42 kg, carga = 3 quintales). The Mazarrón maravedí prices need no assumed factor. The only outside input is 21 sous/ducat, which is cross-checked internally.

## 2. Gum arabic — current 38 → **keep 38, `unverified`**

- **[snippet]** London customs, 1567-68 (Dietz 1972): "John Jenyngs: 5 cwt gum arabic £5". That gives **20 s per cwt** (112 lb = 50.8 kg), the Book-of-Rates valuation. Other entries are mixed cargoes. Willan's rates list "Gum arabic" among eight gums; the fragment has no value.
- The rates are official valuations, so only their relative size is meaningful. Same source, same system:
  - sugar is "£3 6s 8d" per cwt. This is confirmed by the entries "12 cwt sugar £40" and "3 cwt sugar £10".
  - wax is 60 s per cwt ("48 cwt wax £144"; "35 cwt wax £105").
- Gum / sugar = 20 / 66.7 = 0.30, which with the game's sugar 90 gives **27**. Gum / wax = 20 / 60 = 0.33, which with the game's wax 160 gives **53**. The two calibrations disagree by 2×; the game's wax/sugar ratio of 1.8 is not the Book of Rates' 0.9. Their midpoint, ≈ 40, supports the current 38.
- Gum / alum in the same rates = 0.6, so with alum 25 gum would be 15. **This is a caution.** It argues that gum is not far above alum.
- No Iberian or Lisbon price was found. The Arguin trade literature (Webb 1995, FTS snippets) gives prices only from 1710.

## 3. Raisins — current 50 → **keep 50, `unverified`** (but the round-2 weak link is now partly closed)

- Round 2 rested on Rogers's _inference_ that a "sort/piece" of raisins = 84 lb. The Book of Rates now gives that weight independently, **[snippet]** (Willan 1962): "Great Raisins the c. containing v.xx xij pound [112 lb] vjs. viijd." and "Great Raisins the peece vs". 5 s ÷ 6 s 8 d × 112 lb = **84 lb per piece**, the same as Rogers.
- Supporting evidence, [opened], Bristol 1537 (Bristol Rec. Soc. 31, no. 158): "CCCClxxxvij peces of resons, vij serons sope and ij bagges of alam, the whiche made xx tonnes and on hoggished". So 487 pieces of Málaga raisins (transhipped at Cádiz) ≈ 20 tons of freight, roughly 90 lb a piece.
- The level from the same rates is lower. Great raisins at 6s 8d/cwt are 0.10 × sugar, and "raisins of the sun" at 16s 8d/cwt (later raised to 18s) are 0.25 × sugar. That gives 9-18 (great raisins) or 22-44 (raisins of the sun) with the sugar/wax calibrations above. Rogers's market purchases of 1490-1500 gave 0.52 × sugar.
- Customs valuations of 1558 are stale and administrative; actual purchases (Rogers) are better evidence for the level. Even so, the plausible band is **25-50**. No Iberian (Málaga/Valencia) price was found. Hamilton 1936's table has a "Raisins . Pasas" row, but the FTS fragments cannot be tied to a year or unit.

## 4. Hides — current 45 → **keep 45, `unverified`**

Still no weight per hide in any source.

- **[snippet]** Book of Rates: "Salt hides the dicker contayning x hides iij l. vjs. viii d.", i.e. **6s 8d per hide**.
- **[opened]** Bristol 1601: "200 Guinea hides (in the hair) val. £66 13s. 4d." This is the same 6s 8d, so it is just the rate.
- Calibrated against the same rates' sugar, one hide ≈ 0.1 cwt of sugar ≈ 0.46 game-ducats at a distant market. That gives 38 d/t at 12 kg/hide and 30 at 15 kg/hide (twice that via wax). It agrees with round 2's 45, but still hangs on an assumed weight.
- Sequeira's 2023 chapter on Portuguese hide exports to Valencia (1465-1500) is behind RepositóriUM's bot wall. It is the next thing to read for a Valencian valuation, possibly by weight.

## 5. Cork — current 15 → **keep 15, `unverified`**

Nothing new usable:

- In the Book of Rates, "Cork for dyers" is a lichen dye, not bark.
- "Cork for cordwainers/shoemakers the dozen" is priced per dozen, with no weight.
- London 1567 entries list cork "by the dozen" in mixed cargoes.
- Portuguese literature confirms only the royal cork monopoly, leased to Marco Lomellini in 1456 (Infopedia, [snippet]).

## 6. Cotton cloth (Cape Verde _panos_) — current 100 → **keep 100, `unverified`**

**[opened]** Carreira 1968, pp. 84-86:

- A Santiago inventory of 4 June 1624 lists "1.800 barafulas que se acharão em 45 rôlos, a quatrocentos réis cada uma … e 840 panos brancos … a 120 réis cada pano". So a barafula cost **400 rs** (≈ 1 cruzado of account) and a plain white pano **120 rs**, per piece, with 40 pieces to a roll.
- Size, from c.1800 descriptions (Feijó): 6 bands "da largura pouco menos de um palmo sobre 7 ou 8 de comprimento". Carreira converts this to a pano of ~0.8-1.0 m × 1.4-1.5 m.
- No weight of a cotton pano is given (only wool blankets, 2.0-4.5 kg). No pano price is given before 1624. The early-16th-c. documents (1510 lease, 1515 rent of "400 quintais de algodão", 1520 regimento) give quantities without prices.
- Indicative only, using **my assumption** of ~0.35-0.4 kg per white pano: 120 rs is ≈ 0.3 cruzado, i.e. ≈ 750-850 cruzados/t at 1624 prices. Even after a ÷2-3 deflator to 1500 this is ≥ 250. That supports "≥ 100" but rests on an assumed weight and deflator.

## 7. Summary

| Good         | Current | Recommended         | Grade           | Key evidence                                                                                                                                                                                                             |
| ------------ | ------- | ------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| alum         | 40      | **25** (20-32)      | **qualitative** | Mazarrón 1487-88: 19 sous / 350 mrs per quintal at the mine ≈ 20 d/t (Igual Luis 2014 §22-23). Florence 1483-99: 35-44 fl/t (Houssaye Michienzi & Cardon 2022). Valencia 1494-95: 56.5-70 sous per 126 kg carga ≈ 21-26. |
| gum arabic   | 38      | **38**              | unverified      | London 1567 rates: 20 s/cwt vs sugar 66s 8d and wax 60 s → 27-53 [snippet]                                                                                                                                               |
| raisins      | 50      | **50** (band 25-50) | unverified      | The Book of Rates confirms an 84-lb "piece" (closes Rogers's assumption). But its own valuations put raisins at 0.1-0.25 × sugar [snippet].                                                                              |
| hides        | 45      | **45**              | unverified      | 6s 8d per hide (Book of Rates, Bristol 1601). The kg per hide is still unsourced.                                                                                                                                        |
| cork         | 15      | **15**              | unverified      | nothing new                                                                                                                                                                                                              |
| cotton cloth | 100     | **100**             | unverified      | Carreira 1968: barafula 400 rs, white pano 120 rs in 1624. Pano size given, weight not.                                                                                                                                  |

## 8. Caveats and next steps

- Alum: the 1488 price is a credit price, payable at the Oct 1489 fair. The 1487 quintal may be Valencian (42 kg) or Castilian (46 kg); the difference is ±8%.
- Florence's "florin a oro larghi" was not checked against the ducat, but both are gold coins of ~3.5 g.
- Book of Rates figures are customs valuations (1558, reissued 1582), not market prices. Willan's own fragment says alum was "valued at 33s. 4d. cwt. and worth 22½[s?]", i.e. the rate could exceed the market price. Use them for ratios only, and note that the wax/sugar calibration disagrees with the game by 2×.
- The archive.org FTS endpoint is the most productive new tool. With the right query terms it could pull more lines from Hamilton 1934 (Andalusia, 1503+): for example "pasas" with "arroba", or "cueros" with "Andalusia".
- Next reads:
  - Guiral-Hadziiossif, _Valence port méditerranéen_ (1986), pp. 399-403, on alum, and its fruit/hides chapters;
  - Franco Silva, _El alumbre del reino de Murcia_ (1996);
  - Sequeira 2023 (hides at Valencia);
  - López de Coca, _La tierra de Málaga a fines del siglo XV_ (1977), for Málaga raisins.
