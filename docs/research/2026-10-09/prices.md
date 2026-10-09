# Commodity prices c.1500 for the Iberian–Atlantic trading game

Research notes, 2026-10-09. Target: base prices in **ducats per metric ton**, plus the source-to-market spread (`localPriceRatio` 0.8 / `foreignPriceRatio` 1.4) and `interpreterFee` 0.1.

## 0. What was actually reachable

| Source                                                                                                                                                              | Status                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hamilton, _American Treasure and the Price Revolution in Spain_ (1934), archive.org `americantreasure0043hami`                                                      | **Lending-only. Full text and search-inside both return 401.** Not read directly.                                                                                                                                                                                    |
| GPIH digitisation of Hamilton: `Spain_1351-1800.xls` (Arroyo Abad 2005), https://gpih.ucdavis.edu/files/Spain_1351-1800.xls                                         | **Read.** It covers only 11 Hamilton items (wheat, rice, beef, wine, olive oil, sugar, eggs, soap, linen, nails, paper). **Andalusia starts only in 1551 in this file.** For 1501–1515 the usable Castilian series is **Old Castile–León**. Valencia is in _diners_. |
| PWR-Portugal (Reis et al., ICS Lisbon), Lisbon price spreadsheets via Wayback, `http://pwr-portugal.ics.ul.pt/wp-content/uploads/*.xls`                             | **Read.** Lisbon wheat, olive oil, wine, salt, sugar, pepper, wax, textiles. The data come from primary institutional account books (convents, hospitals, Casa dos Contos).                                                                                          |
| GPIH digitisation of Van der Wee, _Growth of the Antwerp Market_ (1963) vol. I: `Belgium_1366-1603.xls`, https://gpih.ucdavis.edu/files/Belgium_1366-1603.xls       | **Read.** Antwerp wax, loaf sugar, pepper, French-Iberian salt; Lier wheat and Rhine wine.                                                                                                                                                                           |
| Miranda Calderín, "La orchilla de Canarias", _Cliocanarias_ 1 (2019) 17–31, https://riull.ull.es/xmlui/bitstream/handle/915/26609/LA%20ORCHILLA%20DE%20CANARIAS.pdf | **Read.** Seville prices for orchil and woad, plus a full 1552 cost account.                                                                                                                                                                                         |
| Pohle, "Sugar, Pepper, Precious Stones…", _RiMe_ (run.unl.pt)                                                                                                       | **Read.** Welser sugar price for 1508.                                                                                                                                                                                                                               |
| Moore, "Madeira, Sugar, and the Conquest of Nature" Part II, _Review_ 33 (2010)                                                                                     | **Read.** Madeira price trend.                                                                                                                                                                                                                                       |
| _Elucidário Madeirense_, "Açúcar", https://elucidariomadeirense.pt/en/articles/47                                                                                   | Read through WebFetch only, so this is a **summary, not a PDF**.                                                                                                                                                                                                     |
| García Ulecia, "Las ordenanzas de los corredores de lonja de Sevilla", https://dialnet.unirioja.es/descarga/articulo/5427263.pdf                                    | **Read.** Seville broker fee.                                                                                                                                                                                                                                        |
| García Gámez, "Seda y repoblación en el Reino de Granada…" (2001), https://dialnet.unirioja.es/descarga/articulo/421783.pdf                                         | **Read.** Granada silk c.1600.                                                                                                                                                                                                                                       |

## 1. Conversions used (state once, applied everywhere)

**Money**

- **Castile.** 1 ducat = 375 maravedís (mrs), fixed by the 1497 Medina del Campo ordinance. 1 maravedí = 0.094 g fine silver for 1501–1650 (GPIH "Silver Conversion" sheet, from Hamilton 1934 Table B p.318), so 1 ducat = **35.25 g silver**.
- **Portugal.** Per PWR `Coin_Equivalences.xls`: 1 cruzado = **380 réis (1489), 390 réis (1496), 400 réis (1517–1555)**. PWR `Price_of_Silver.xls` gives silver at 10.982 réis/g in 1500, so 1 cruzado (390 rs) = 35.5 g silver. **Cruzado ≈ ducat is confirmed to within 1%.** I use 390 rs for 1496–1516 and 400 rs from 1517.
- **Brabant (Antwerp).** GPIH uses 1 groat = 0.33 g silver for 1495–1520. 1 ducat = 35.25 / 0.33 ≈ **107 groats Brabant**. This is a silver-parity conversion, not an exchange quotation.
- **Valencia.** Prices are in _diners_. I use them only for ratios, never converted to ducats.

**Weight and volume**

- **Castilian arroba** = 25 lb × 460.1 g = **11.50 kg**. Castilian quintal = 4 arrobas = **46.0 kg**. GPIH notes "1 arroba = 25 pounds"; Miranda Calderín says explicitly "quintal (46 kilogramos)".
- **Portuguese arroba** = 32 arráteis × 0.459 kg = **14.69 kg**. Portuguese quintal = 4 arrobas = 128 arráteis = **58.75 kg** (PWR `Patterns_of_Weights_and_Measures.xls`; Greenfield: "One arroba equals 14.686 kilograms"). **The 11.5 kg arroba is Castilian. Portuguese arroba and quintal prices must use 14.69 / 58.75 kg.**
- **Castilian liquid arroba of oil** = 12.56 L × 0.915 kg/L ≈ 11.5 kg.
- **Fanega** = 55.5 L (Castile) or 54.7 L (Seville). Wheat at 0.77 kg/L gives 42.7 kg.
- **Wine cántara** = 16.13 L (Toledo); Seville arroba of wine = 15.65 L. Wine is taken as 1 kg/L.
- **Lisbon alqueire** = 13.8 L, and almude = 16.8 L. Both are implied by PWR's rs/L columns.
- **Sea salt** is taken at 1.1 kg/L. This is my assumption; 1.2 changes results by under 10%.
- **Antwerp pound** = 470.2 g, and the "slice" of wax = 100 lb = 47.0 kg (GPIH notes).

## 2. Per-good evidence

All "→" lines show the arithmetic down to ducats/ton (d/t). "c.1500" means 1500–1515 unless stated.

### Sugar (Madeira / Málaga): the best-documented item

| Place, year                             | Original                                                                                      | → d/t                                                                 | Source                                                                                                                                                 | Kind                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| Madeira, 1496                           | avg **475 rs/arroba**                                                                         | 475/14.69 kg = 32.3 rs/kg; ×1000/390 = **83**                         | Moore 2010 p.13: "sugar prices declined from an average of 725 reais per arroba in 1469 to 475 reais in 1496 (Rau, 1964: 9; also Vieira, 2004: 62)"    | secondary (citing Rau, Vieira)                          |
| Madeira, 1496                           | 600 rs/arroba (one grade) / 350 rs/arroba (other grade)                                       | **105 / 61**                                                          | _Elucidário Madeirense_, "Açúcar" (WebFetch summary)                                                                                                   | tertiary; **snippet-level**                             |
| Madeira, 1507                           | **315 rs/arroba**                                                                             | 315/14.69 = 21.44 rs/kg → **55**                                      | _Elucidário Madeirense_                                                                                                                                | tertiary; **snippet-level**                             |
| Madeira, 1511                           | **300 rs/arroba**                                                                             | **52**                                                                | same                                                                                                                                                   | same                                                    |
| Madeira→Welsers, 1508                   | **10,500 cruzados for 12,000 arrobas**                                                        | 0.875 cz/arroba ÷ 14.69 kg = **59.6**                                 | Pohle, _RiMe_, p.11: "King Manuel I decreed that the Welsers be paid the equivalent of 10,500 cruzados for 12,000 arrobas of sugar" (Häbler 1903 p.29) | secondary citing a royal decree; **best single anchor** |
| Lisbon, 1507 / 1511 / 1512              | 9.375 / 9.65 / 12.5 rs per arrátel (= 20.4 / 21.0 / 27.2 rs/kg); white sugar 1508 19.75 rs/kg | 20.4×1000/390 = **52**, 54, 70                                        | PWR `Honey-and-Sugar.xls`, col. "Sugar (1) Lisbon"                                                                                                     | primary account books (digitised)                       |
| Old Castile–León, 1502–1512             | 458, 460, 470, 499, 730 mrs/arroba; **median 470**                                            | 470/11.5 = 40.9 mrs/kg ×1000/375 = **109** (mean 523 → 121)           | GPIH/Hamilton 1934 App.                                                                                                                                | primary series via Hamilton; **inland, non-producing**  |
| Antwerp (refined loaf sugar), 1500–1511 | avg **13.16 groats/kg**; 1507–11 avg 14.4                                                     | 13.16×0.33 g = 4.34 g Ag/kg → 4344/35.25 = **123** (1507–11: **135**) | GPIH/Van der Wee 1963 vol. I, "Commercial Prices", loaf sugar                                                                                          | primary series via Van der Wee                          |
| Andalusia, 1551–61                      | median 940, mean 976 mrs/arroba                                                               | **226** (1550s price level, about 2× 1500)                            | GPIH/Hamilton                                                                                                                                          | primary via Hamilton; wrong decade                      |

**Grade: `measured`.** Producer price c.1505–1511 is **52–60 d/t**. Distant markets are **109 d/t** (inland Castile) and **123–135 d/t** (Antwerp, refined). The current **90** sits at the geometric mean of the producer and distant prices: √(57×125) ≈ 84. That is exactly what a _base_ price between local 0.8 and foreign 1.4 should be, so 90 can stay.

### Wheat

| Place, year                                    | Original                                                        | → d/t                                              | Source                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| Lisbon, 1500–1520 excluding the 1521–22 famine | 0.51–3.62 rs/L, **median 1.67 rs/L**                            | 1.67/0.77 = 2.17 rs/kg → ×1000/390 = **5.6**       | PWR `Grain…xls`, "Wheat Lisbon (rs/alq)" e.g. 1505: 25 rs/alq, 1511: 20, 1520: 30 |
| Old Castile–León, 1506–1513                    | 271 (famine), 160, 61, 89, 68.5, 94 mrs/fanega; **median 91.7** | 91.7/42.7 kg = 2.15 mrs/kg → **5.7** (mean 7.7)    | GPIH/Hamilton                                                                     |
| Lier (Antwerp area), 1500–1511                 | avg **0.654 groats/L**                                          | /0.77 = 0.85 gr/kg × 0.33 = 0.28 g Ag/kg → **7.9** | GPIH/Van der Wee                                                                  |

**Grade: `measured`.** Wheat c.1500 was **≈ 6–8 d/t** in ordinary years. Famine years ran 3–15×: Old Castile 1506 and Lisbon 1521–22 at 350–450 rs/alqueire.

### Grain (barley)

- Lisbon 1511/1515/1520: barley 26 / 20 / 20 rs per alqueire against wheat 20 / 28 / 30 (PWR). The 1512 barley value of 4 is an outlier.
- Barley/wheat by volume ≈ 0.75–0.9. Barley weighs ≈ 0.62 kg/L against wheat 0.77, so by weight the ratio is ≈ **0.9**.

Grade **`qualitative`**: the ratio is supported, the level is not. The current 12/14 = 0.86 is consistent.

### Salt

| Place, year                                                    | Original                           | → d/t                                                      | Source                                |
| -------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------- | ------------------------------------- |
| Antwerp/Lier/Malines, 1500–1511, "French-Iberian salt (finer)" | avg 0.224 groats/L (barrel = 66 L) | /1.1 kg/L = 0.203 gr/kg ×0.33 = 0.067 g Ag/kg → **1.9**    | GPIH/Van der Wee, "Commercial Prices" |
| Lisbon, 1537                                                   | 13.4 rs/alqueire = 0.97 rs/L       | /1.1 = 0.88 rs/kg → ×1000/400 = **2.2** (1537 price level) | PWR `Flavouring…salt.xls`             |

Same-place ratios: salt/wheat is **0.24** in Antwerp (0.20 vs 0.85 gr/kg) and **0.23** in Lisbon 1537 (0.88 vs 3.87 rs/kg). Lisbon wheat 1537 = 2.98 rs/L.

**Grade: `measured`.** Salt ≈ 2 d/t, about **¼ of wheat by weight**. The current salt 8 / wheat 14 = 0.57 is **too high by ~2.4×**.

### Olive oil

| Place, year                   | Original                                                       | → d/t                             | Source                         |
| ----------------------------- | -------------------------------------------------------------- | --------------------------------- | ------------------------------ |
| Lisbon, 1515                  | 150 rs/almude = 8.93 rs/L                                      | /0.915 = 9.76 rs/kg → **25**      | PWR `Olive-Oil-and-Olives.xls` |
| Lisbon, 1517                  | 240 rs/almude = 14.29 rs/L                                     | 15.6 rs/kg → ×1000/400 = **39**   | same                           |
| Old Castile–León, 1502–1512   | 241, 254, 351, 356, 295, 191, 230 mrs/arroba; **median 253.7** | 253.7/11.5 = 22.1 mrs/kg → **59** | GPIH/Hamilton                  |
| Andalusia, 1551–61 (producer) | mean 229 mrs/arroba                                            | **53** (1550s level)              | GPIH/Hamilton                  |
| Old Castile, 1551–61          | mean 501 mrs/arroba                                            | **116**                           | same                           |

Same-year oil/wheat ratios by weight:

| Place, period                                | Oil/wheat                                    |
| -------------------------------------------- | -------------------------------------------- |
| Lisbon 1515                                  | 3.7                                          |
| Lisbon 1517                                  | 3.3                                          |
| Valencia 1490s                               | 3.6 (oil ≈ 8.5 pence/L, wheat ≈ 2.0 pence/L) |
| Andalusia 1551–61                            | 3.3                                          |
| Old Castile 1501–15 (inland, oil carried in) | 10.3                                         |

**Grade: `measured`.** At the producer, oil ≈ **25–40 d/t**, about **3.5× wheat**.

### Wine

| Place, year                                        | Original                                                            | → d/t                              | Source           |
| -------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------- | ---------------- |
| Lisbon, 1512–1514                                  | 120, 120, 139 rs/almude ≈ 7.5 rs/L (1515: 45 rs, a glut)            | 7.5 rs/kg → **19**                 | PWR `Wine…xls`   |
| Old Castile–León, 1503–1512                        | 84, 32, 72, 85, 51 mrs/cántara; median 72                           | 72/16.13 = 4.46 mrs/kg → **11.9**  | GPIH/Hamilton    |
| Lier, 1500–1511, young red Rhine wine incl. excise | ≈ 4.4 groats/L (3.7–4.75)                                           | **41**                             | GPIH/Van der Wee |
| Andalusia vs Old Castile, 1551–61                  | 112.5 mrs per arroba of 15.65 L vs 146.6 mrs per cántara of 16.13 L | 19.2 vs 24.2 d/t → spread **1.26** | GPIH/Hamilton    |

Wine/wheat ratios: Old Castile 2.1, Lisbon 3.4, Valencia ~0.6, Andalusia 1550s 1.2.

**Grade: `measured`.** Iberian wine ≈ **12–19 d/t**, about 2× wheat. Imported northern wine ≈ 41.

### Wax

| Place, year                                                  | Original                                                            | → d/t                             | Source                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------- | --------------------------------- | ------------------------------------------ |
| Antwerp, 1500–1511, "Northern European wax for the churches" | 1,044–1,269 groats per slice of 100 Antwerp lb; avg **24.14 gr/kg** | ×0.33 = 7.97 g Ag/kg → **226**    | GPIH/Van der Wee                           |
| Lisbon, 1550–1556                                            | 65.5–80 rs/arrátel, avg 161 rs/kg                                   | ×1000/400 = **403** (1550s level) | PWR `paper-quill-pens-soap-tallow-wax…xls` |

Same-place wax/sugar ratios: **1.83** in Antwerp 1500–11 (24.1/13.2) and **1.5** in Lisbon 1553 (142.8/108.9 rs/kg).

**Grade: `measured`** for Antwerp. That is a distant market; no Iberian or Maghrebi price c.1500 was found. **Wax is more expensive than sugar.** The current wax 60 < sugar 90 is the wrong way round.

### Woad (Azores pastel) and orchil (Canary lichen)

Source: Miranda Calderín 2019, pp. 19–20, all prices at **Seville**: "la rubia o el pastel de Toulouse y el pastel de las islas Azores … cuyos precios oscilaban a finales del s. XV alrededor de 4.850 maravedís/quintal el francés, y de 2.200 a 3.500 maravedís el de las Azores en el periodo 1500-1514. Sin embargo, la orchilla de Canarias se vendía en Sevilla en los años 1508 a 1515 entre 1.400 y 1.765 maravedís el quintal (46 kilogramos), a precios sensiblemente más bajos que el pastel."

| Good                          | Original                             | → d/t                                                                           |
| ----------------------------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| Toulouse pastel, late 15th c. | 4,850 mrs/qq                         | 4850/46 = 105.4 mrs/kg → **281**                                                |
| **Azores pastel, 1500–14**    | 2,200–3,500 mrs/qq                   | **128–203** (mid **165**)                                                       |
| **Canary orchil, 1508–15**    | 1,400–1,765 mrs/qq                   | **81–102** (mid **92**)                                                         |
| Orchil sold at Cádiz, 1552    | "a 5 ducados el quintal" (1,875 mrs) | **109** (1550s level; Miranda Calderín notes 1,331 → 1,875 mrs/qq over 1542–52) |

**Grade: `measured`** for both. This is a secondary source citing archival material (AGS, CMC 1ª época leg. 822 for 1552); the c.1500 Seville figures are attributed to his own book (2017 vol. I), whose underlying sources I did not see. **Woad (Azores) > orchil**, about 1.8×. The current woad 45 < orchil 50 is reversed. Both are roughly sugar-level or above.

### Silk (Granada raw silk)

| Evidence                                           | Original                                                                                                           | → d/t at that date                                                      | Kind                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Granada alcaicería, c.1600                         | "entre 26 y 55 reales por libra de seda" (García Gámez 2001 p.~245, citing Luis de Córdoba 1618 and Garzón Pareja) | real = 34 mrs; libra 0.46 kg → 884–1,870 mrs/lb → **5,100–10,800**      | secondary                                                                     |
| Cástaras 1493 barter, valued with mid-16th-c. data | 7.5 lb clean silk ≈ 15,000 mrs → 2,000 mrs/lb                                                                      | **≈ 11,600** (1550s level)                                              | castaras.net summary of Albarracín Navarro 1993 pp.460–462; **snippet-level** |
| Lisbon, 1505–1518 (finished silk cloth, for scale) | damask 600–1,555 rs/vara; taffeta 200–611 rs/vara                                                                  | per metre 0.6–1.4 k rs, i.e. several thousand cruzados per ton of cloth | PWR textiles xls                                                              |

**Deflating to c.1500.** Hamilton's Andalusian price level rose ~1.8× by the 1550s and ~3.5× by 1600. This deflator is approximate and from memory of Hamilton's index, **not verified here**. It gives raw silk **≈ 1,500–6,000 d/t c.1500, central ~3,000**.

**Grade: `qualitative`.** The order is certain: silk is an order of magnitude above sugar and wax. The level is not. The current 300 is **~10× too low** relative to sugar.

### Pepper (reference ceiling only; not a game good)

| Place, period    | Original                       | → d/t   | Source           |
| ---------------- | ------------------------------ | ------- | ---------------- |
| Lisbon, 1508–14  | 67–69 rs/arrátel = 148.5 rs/kg | **381** | PWR              |
| Antwerp, 1505–11 | avg 62.4 gr/kg                 | **585** | Van der Wee/GPIH |

Spread Lisbon → Antwerp = **1.53**.

### Alum

Only snippet-level material was found:

- Medici marketing margin of "one gold ducat for each cantaro" on Tolfa alum.
- 1504: "Philip the Fair authorizes import of Turkish alum into Flanders; price falls in half".
- Phocaea, 15th c.: 100 cantars bought for 50 ducats (Fleet, _European and Islamic Trade in the Early Ottoman State_). At a Genoese cantaro ≈ 47.6 kg that is ≈ 10.5 d/t at source.

If a Roman cantaro of ≈ 50 kg carried a 1-ducat margin alone (≈ 20 d/t), the Western sale price was plausibly 30–60 d/t. **Grade: `unverified`.** Delumeau, _L'alun de Rome_ (1962), has the contract prices but was not accessible. Keep 40 as authored.

### Not researched in depth (remain authored)

Cork, salted tuna, hides, raisins, Cape Verde cotton panos, gum arabic: **`unverified`**.

PWR has a Lisbon tuna column (rs/arroba) but **no values before 1560**.

## 3. Spread: producer price vs distant market (`localPriceRatio` / `foreignPriceRatio`)

| Good               | Producer → market                                                                                                                      | Ratio market/producer | Note                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| Orchil, 1552       | Canary cost of collection, freight, insurance and sacks = 362,112 mrs for 332 qq sold, i.e. 1,091 mrs/qq, vs **1,875 mrs/qq at Cádiz** | **1.72**              | Miranda Calderín p.24, itemised account (AGS). Collection wages alone are 649 mrs/qq, giving 2.9. |
| Sugar, 1507–11     | Madeira 52–60 d/t → Old Castile 109                                                                                                    | **1.9**               |                                                                                                   |
| Sugar, 1507–11     | Madeira 52–60 → Antwerp (refined loaf) 135                                                                                             | **2.3**               | includes refining                                                                                 |
| Olive oil, 1551–61 | Andalusia 229 mrs/arroba → New Castile 371 / Old Castile 501                                                                           | **1.6 / 2.2**         | Hamilton                                                                                          |
| Wine, 1551–61      | Andalusia → Old Castile                                                                                                                | **1.26**              | Hamilton                                                                                          |
| Pepper, 1505–14    | Lisbon 381 → Antwerp 585                                                                                                               | **1.53**              |                                                                                                   |

The model's ratio is 1.4/0.8 = **1.75**. The measured range is 1.26–2.3 with a **median ≈ 1.7–1.9**. **1.75 is well supported**, and the orchil account reproduces it almost exactly.

The split into 0.8 and 1.4 individually is not measurable, because there is no common "base" price in the sources. **Grade both `qualitative`.** Their _product_, the spread, could fairly be called measured.

## 4. Broker / interpreter fee (`interpreterFee` = 0.1)

- **Seville, measured.** García Ulecia p.164: a royal judge condemned Seville's _corredores de lonja_ for charging "el medio por ciento de cada parte en los tratos en que intervenían". The Consejo Real **revoked the sentence on 8 Feb 1528 and declared the corretaje lawful**. Brokerage was therefore **0.5% per side, about 1% of the deal**.
- No Lisbon _corretor_ tariff or Venetian _sensaria_ rate was found. Searches turned up only lump sums.
- **0.1 is 10–20× a pure brokerage fee.** It is defensible only as an all-in "foreign-port friction" covering broker, dragoman and customs. My recollection is that Christian merchants paid ~10% ad valorem import duty in Maghrebi ports, but **this is not verified here**.

Recommendation:

- Either rename or split this into a broker fee of **0.01 (`measured`, Seville 1528)** and a separate customs or foreign-port duty.
- Or keep 0.1 graded **`unverified`**. Do not use `qualitative`, since no source here supports 10% as a broker or interpreter cost.

## 5. Proposed revised base prices (ducats/t)

Principle: keep **sugar = 90** as the anchor. It is measured as the geometric mean of the producer and distant-market prices, which is what a base price between ×0.8 and ×1.4 should be. Then set the others to their measured c.1500 ducat values, mid-market where possible. This uses the sources' **absolute** ducat levels, which also preserves their ratios.

| Good                 | Current | Proposed                                          | Basis                                                    | Grade                 |
| -------------------- | ------- | ------------------------------------------------- | -------------------------------------------------------- | --------------------- |
| salt                 | 8       | **2–3** (use 3 if a floor is needed for gameplay) | Antwerp 1.9, Lisbon 2.2; ≈ 0.24× wheat                   | measured              |
| grain (barley)       | 12      | **6**                                             | 0.9× wheat (Lisbon)                                      | qualitative           |
| wheat                | 14      | **7**                                             | Lisbon 5.6, Old Castile 5.7, Lier 7.9                    | measured              |
| cork                 | 15      | 15                                                | —                                                        | unverified (authored) |
| tuna (salted)        | 20      | 20                                                | —                                                        | unverified (authored) |
| wine                 | 30      | **18**                                            | Iberian 12–19 (Antwerp 41 = distant)                     | measured              |
| hides                | 25      | 25                                                | —                                                        | unverified (authored) |
| raisins              | 30      | 30                                                | —                                                        | unverified (authored) |
| cotton cloth (panos) | 32      | 32                                                | —                                                        | unverified (authored) |
| olive oil            | 35      | **40**                                            | producer 25–39 (Lisbon), inland 59 → geometric mean ≈ 40 | measured              |
| gum arabic           | 38      | 38                                                | —                                                        | unverified (authored) |
| alum                 | 40      | 40                                                | Medici margin ~20 d/t alone, so ≥ 30 likely              | unverified            |
| sugar                | 90      | **90**                                            | Madeira 52–60, Castile 109, Antwerp 123–135              | measured              |
| orchil               | 50      | **90**                                            | Seville 81–102 (1508–15)                                 | measured              |
| woad (Azores)        | 45      | **160**                                           | Seville 128–203 (1500–14)                                | measured              |
| wax                  | 60      | **200**                                           | Antwerp 226 (distant market); wax/sugar 1.5–1.8          | measured (Antwerp)    |
| silk (Granada)       | 300     | **~2,500** (≥ 1,500)                              | c.1600 and mid-16th-c. Granada prices deflated           | qualitative           |

**Order changes the evidence forces**

1. salt < grain < wheat, with salt about ¼ of wheat rather than ½.
2. Wine and oil sit well above wheat, as before.
3. **orchil ≈ sugar**, not 0.55× sugar.
4. **woad > sugar**, about 1.8× orchil.
5. **wax > sugar**, about 2×.
6. **silk ≫ everything**, roughly 25–30× sugar.

**If the absolute range is too wide for gameplay** (2 → 2,500), compress silk first. Keep it at least ~10× sugar, around 900, to preserve its position, and record that as an authored compression.

**Alternative keeping wheat = 14** (multiply everything above by 2): salt 5, grain 12, wheat 14, wine 36, oil 80, sugar 180, orchil 180, woad 320, wax 400, silk ~5,000. Only the internal ratios carry evidence; the overall scale is free.

## 6. Notes and caveats for grading

- **1500 vs the 1550s.** Prices roughly doubled by the 1550s. Andalusian sugar is 226 d/t in 1551–61 against 109 in Old Castile 1501–15. Never mix decades without deflating; the table above uses only 1496–1515 numbers except where flagged.
- **Famine years** (Castile 1504–07, Lisbon 1521–22) were excluded from the wheat medians.
- **Lisbon PWR prices** are institutional retail-ish purchases, not wholesale. Nonetheless Lisbon sugar 1507–12 (52–70 d/t) matches the Madeira/Welser wholesale figures (52–60).
- **Snippet-level items**: the _Elucidário_ sugar prices, the Albarracín silk valuation and all alum figures. The Moore and Miranda Calderín figures were read in the PDFs.
- **Hamilton 1934's own Andalusian tables** were not read; they are lending-restricted on archive.org. GPIH's subset has no Andalusian data before 1551. Borrowing the book, or its 1965 Octagon reprint, would let you add **wax, almonds, raisins, honey and possibly hides** for Andalusia from 1503. That is the obvious next step for the unverified entries.
