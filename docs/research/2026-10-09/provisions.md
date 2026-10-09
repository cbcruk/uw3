# Provisions, wages, mortality: source check (c. 1490–1520)

Conversions used throughout:

- 1 Castilian ducat = 375 maravedís (mrs), the legal rate from 1497. Documents from 1493 count the ducat at **360 mrs** (stated in the document itself, see below).
- 1 cuento = 1,000,000 mrs.
- 1 quintal (Castilian) = 4 arrobas = 100 libras ≈ 46 kg. 1 azumbre ≈ 2 L.
- Portuguese cruzado ≈ Venetian ducat ≈ Castilian ducat (game convention; not checked).
- "Primary" means an edited archival document (Navarrete prints AGI originals). "Secondary" means modern scholarship.

---

## 3. provisionPrice = 0.4 ducats per person-day

### Evidence

**A. Bermeo armada, 1493: a fixed victualling allowance (primary, direct match)**
Martín Fernández de Navarrete, _Colección de los viages y descubrimientos…_, t. II (Madrid 1825), Núm. LV, p. 93. This is the contract the captains of Iñigo de Artieta's fleet signed (AGI register). The Crown may either supply bread, wine, meat and fish in kind, or pay:

> "por cada persona … un ducado cada mes, contado cada ducado á trescientos y sesenta maravedís, que sale á doce maravedís una persona cada dia uno con otro"

The next document (Núm. LVI, pp. 93–94, the fleet's cost account) applies the same rule: "por cada mes un ducado á cada uno contando el ducado á trescientos sesenta" for 350 men over six months = 756,000 mrs.

→ **12 mrs per person-day = 1/30 ducat ≈ 0.033 ducat** (at 360), or **0.032 ducat** at 375.

The same account pays sailors **6,000 mrs a year** ("los Marineros á seis mil por año"), which is 500 mrs a month. This was a coastal or Granada war fleet, not an ocean voyage.

Text: https://archive.org/download/coleccindelosv_a02nava/coleccindelosv_a02nava_djvu.txt

**B. Instruction to Columbus for settlers, 1497 (primary)**
Navarrete t. II, Núm. CIV, pp. 205–206. Instead of victuals in kind, each person gets:

> "una fanega de trigo cada mes é doce maravedís cada dia para que ellos compren los otros mantenimientos"

→ 12 mrs/day plus grain. This is the same 12 mrs/day norm, given on top of bread.

**C. Magellan's fleet, 1519 (primary; full itemised account)**
Navarrete t. IV (1837), Núm. XVII, "Relación del coste que tuvo la Armada de Magallanes" (AGI, Papeles del Maluco, leg. 1), pp. 162–182. Archive.org text: https://archive.org/download/coleccindelosv_04nava/coleccindelosv_04nava_djvu.txt

- Provisions total, from the summary (p. 181): "Un cuento quinientos ochenta y nueve mili quinientos cincuenta y un maravedís que son costo el vizcocho y vino, y aceite, y pescado, y carne, y quesos, y legumes; y los toneles y botas y pipas para el vino y agua". The words say 1,589,551 mrs, but the figure column prints 1,585,551; secondary sources use the latter.
- Biscuit (p. 170): 2,138 quintales bought "á 170 maravedís quintal". All biscuit costs together came to 372,510 mrs.
- Wine (pp. 170–171): 508 botas bought at Jerez, 590,000 mrs including costs.
- Casks for wine **and water** (p. 172): 393,623 mrs. Water itself costs nothing; the cost is the casks.
- Ration plan, Núm. XVIII (pp. 187–188), for 237 men: biscuit "9 quintales, 17 libras por hombre". The wine "lleva para dar 756 dias" at half an azumbre a day. The fleet was therefore victualled for about two years.

Per person-day: 1,585,551 / (237 × 756) = **8.85 mrs ≈ 0.024 ducat**. Without the casks the figure is 6.65 mrs.

Biscuit alone: about 1.5 lb a day at 170 mrs per 100 lb ≈ **2.5 mrs/day**.

**D. Context**
At sea a sailor's wage was about 1,000–1,200 mrs a month, roughly 33–40 mrs a day (see §4). Victuals therefore cost about ¼–⅓ of a seaman's wage.

Pigafetta gives a famine price at sea: in the Pacific, rats "were sold for one-half ducado apiece". Source: Robertson (tr.), _Magellan's Voyage Around the World_, vol. I (1906), p. 83, https://archive.org/details/magellansvoyagea01piga. This is a price inside a starving ship, not a market price.

### Verdict

The sources agree on the order of magnitude:

| Source                 | mrs per person-day | ducats per person-day |
| ---------------------- | ------------------ | --------------------- |
| Bermeo 1493            | 12                 | 0.032                 |
| Columbus settlers 1497 | 12 + bread         | —                     |
| Magellan 1519          | ~9                 | 0.024                 |

Our 0.4 ducats per person-day is **12–17× too high**. If 0.4 is charged per unit, so that food plus water costs 0.8 per person-day, it is 25–33× too high.

- **Recommended value:** **0.03 ducats per person-day** (12 mrs / 375 ≈ 0.032). If food and water are separate goods, put almost all of it on food: water is nearly free at the source, and its real cost is the casks. A split such as food 0.025 / water 0.005 fits the Magellan cask share (393,623 of 1,585,551 mrs, about 25%, and the casks also held wine).
- **Grade:** `measured` for 0.032. The Bermeo 1493 document states exactly this concept, a per-person daily victualling allowance in money: "doce maravedís una persona cada dia". Our current 0.4 has no source support and would be `unverified` at best.
- **Balance warning:** cutting the price 12× makes 1,000 ducats of starting gold buy about 31,000 person-days instead of 2,500. If price-pressure gameplay matters, rebalance startGold and hire costs together; do not keep 0.4 and call it historical.

---

## 4. hireWage = 10 ducats per hired sailor (one-time advance)

### Evidence

**A. Columbus 1492, four months' advance (primary)**
Royal provision of 30 April 1492 to Palos, Navarrete t. II, Núm. VII, pp. 11–12:

> "Nos le mandamos que vos pague luego sueldo por cuatro meses para la gente … al precio … que es el que comunmente se acostumbra pagar en esta costa á la gente que va de armada por la mar"

The provision sets the advance at four months but gives no wage rate.

**B. Columbus 1492 wage rates (secondary, built from the Crown account books)**
Alicia B. Gould, "Nueva lista documentada de los tripulantes de Colón en 1492", part VIII, _Boletín de la Real Academia de la Historia_ (1920s; exact year not checked), pp. 539 and 553. PDF: https://www.cervantesvirtual.com/research/nueva-lista-documentada-de-los-tripulantes-de-colon-en-1492-7/0b1e953a-a01f-11e1-b1fb-00163ebf5e63.pdf

- p. 539: "un calafate llevaba 1.000 mrs. al mes, es decir, lo mismo que otro marinero"
- p. 553: "el sueldo corriente de grumete 8.000 al año" (= 666⅔ mrs a month), and "los cuatro meses adelantados que se pagaban a todos los del Rol".

The advance comes to:

| Rank     | Advance (mrs) | Ducats at 375 | Ducats at 360 |
| -------- | ------------- | ------------- | ------------- |
| Marinero | 4,000         | 10.7          | 11.1          |
| Grumete  | 2,667         | 7.1           | —             |

**C. Magellan 1519 (primary)**
Navarrete t. IV, Núm. XVII, pp. 179 and 181:

> "Un cuento, ciento cincuenta y cuatro mili quinientos cuatro maravedís que se han pagado de sueldo á doscientas treinta y siete personas … de cuatro meses que se les pagó adelantado"

1,154,504 / 237 = 4,871 mrs per person = **13.0 ducats**. This is an average that includes officers.

Rank rates, from a secondary source: Susana García Ramírez, "Las tripulaciones de la primera vuelta al mundo", _Cuadernos Monográficos del IHCN_ 82 (2020), pp. 44–48 (https://armada.defensa.gob.es/archivo/mardigitalrevistas/cuadernosihcn/82cuaderno/cap02.pdf). The figures come from Juan Gil (2017) and AGI Patronato 34 / Contratación 5090:

- pajes: 500 mrs a month, with a four-month advance "como también hicieron los grumetes y los marineros"
- coopers and gunners: 4 ducados (1,500 mrs)
- carpenters and caulkers: 5 ducados (1,875 mrs)
- boatswains: 2,000 mrs
- masters: 3,000 mrs

The article also says the wages for this voyage were higher than usual. I did not find marinero and grumete rates stated in that text. The commonly cited 1,200 and 800 mrs are unverified.

**D. Bermeo 1493 (primary)**
Sailors at 6,000 mrs a year. Four months is 2,000 mrs = 5.3 ducats. This was a home-waters war fleet.

**E. Portugal (da Gama 1497)**
Nothing usable found. Castanheda, in Kerr's translation, gives no crew pay.

### Verdict

A four-month advance for one seaman comes to **≈ 5–13 ducats**. The Castilian ocean-voyage cases cluster at 10.7 ducats (Columbus marinero) and 13.0 ducats (Magellan average). **10 ducats fits well.**

- **Grade:** `qualitative`. The mechanism (a four-month advance) and the rate (1,000 mrs a month) are both documented, but the rate comes from a secondary reconstruction (Gould). It becomes `measured` if the game defines hireWage as "a four-month advance for a marinero at the 1492 rate": 4,000 / 375 = 10.67. You may round to **11**.
- No change needed.

---

## 5. startGold = 1000 ducats (operating funds for a one-caravel expedition, ship excluded)

### Evidence

**Columbus 1492, total cost of about 2,000,000 mrs for 3 ships and about 90 men (secondary, snippet-level)**

- The common split is 1,140,000 mrs from the Crown through Santángel, plus contributions from Columbus, Pinzón and Berardi. Accounts disagree on who paid what.
- Sources seen only as search snippets: La República 2019 (citing the Sociedad Geográfica Española) and a university teaching note. The standard reference is Ladero Quesada; I did not check it.
- The Palos caravels cost the Crown nothing: Palos supplied them as a penalty (Navarrete t. II, Núm. VII).
- Per ship: about 667,000 mrs ≈ **1,780 ducats**, including the Santa María charter, wages and victuals.

**Magellan 1519 (primary, Navarrete t. IV pp. 162–182)**

- Total: 8,751,125 mrs (p. 181: "ocho cuentos setecientos cincuenta y un mili ciento y veinte y cinco").
- Hulls with rigging and boat, bought second-hand (pp. 162–163):

| Ship        | Size (toneles) | Price (mrs) | Ducats |
| ----------- | -------------- | ----------- | ------ |
| Santiago    | 75             | 187,500     | 500    |
| Concepción  | 90             | 228,750     | 610    |
| Victoria    | 85             | 300,000     | 800    |
| Trinidad    | 110            | 270,000     | 720    |
| San Antonio | 120            | 330,000     | 880    |

For Victoria the text says "Trescientos mili" (300,000); the OCR of the figure column reads 360,000.

- Fully armed fleet: "sale tonelada armada á razón de 8.791 maravedís".
- Operating costs, ships excluded:

| Item                   | mrs          |
| ---------------------- | ------------ |
| Victuals               | 1,585,551    |
| 4-month wage advance   | 1,154,504    |
| Trade goods            | 1,679,769    |
| Stores and instruments | 415,060      |
| **Total**              | **≈ 4.83 M** |

4.83 M mrs over 5 ships is about 967,000 mrs a ship ≈ **2,580 ducats**. That covers a two-year voyage with about 47 men per ship. Without trade goods it is about 1,690 ducats a ship.

**Scaled estimate for one caravel**
Assume 25 men, a one-year victualling at 12 mrs a day, and a four-month advance at 1,000 mrs a month:

- Victuals: 25 × 365 × 12 = 109,500 mrs
- Advance: 25 × 4,000 = 100,000 mrs
- Total: ≈ 210,000 mrs ≈ **560 ducats**, before trade goods or contingency.

### Verdict

1000 ducats is the right order of magnitude. It sits between the bare minimum (about 560) and the per-ship Magellan figure with trade goods (about 2,600). It is also about two small second-hand naos' worth (500 ducats each).

- **Grade:** `qualitative`.
- Keep 1000. Note that in-game it buys only 2,500 person-days at the current provisionPrice of 0.4, compared with about 31,000 at the historical 0.032. Decide on startGold together with provisionPrice.

---

## 1. starvationLossRatio = 0.02 per day (no food, water available)

### Evidence

**Total starvation with water**

- In the 1981 Maze hunger strike, men at rest under medical observation died after about 46–73 days. Bobby Sands died on day 66 and Kieran Doherty on day 73; both figures are confirmed on Wikipedia/HISTORY.com. The others died at about 46–71 days; that range is from memory and not verified individually.
- Deaths are concentrated late: almost none before about 3–4 weeks.

**Magellan's Pacific crossing (primary: Pigafetta, Robertson tr. vol. I pp. 83–85)**

> "We were three months and twenty days without getting any kind of fresh food. We ate biscuit, which was no longer biscuit, but powder of biscuits swarming with worms … We drank yellow water that had been putrid for many days … Nineteen men died from that sickness"

The sickness was scurvy. Of about 166 men (Wikipedia, citing Castro), 19 died in about 110 days, roughly **0.1% a day**. This was short and spoiled rations, not zero food, so it does not measure total starvation. It is useful as a reference for a "low food" state.

**Model arithmetic**
A constant 2% a day gives a median time to death of ln2 / 0.02 ≈ 35 days, with 45% dead by day 30 and 70% by day 60. The observed median at rest is about 60 days, which implies ln2 / 60 ≈ 1.2% a day. Hard labour, cold, wet and scurvy at sea shorten survival, so 2% is plausible as a shipboard number.

A constant-hazard model kills people too early (days 1–20) and too few late. If the sim can do it, a ramp would be more faithful: 0 for about 2 weeks, then rising.

### Verdict

- **Grade:** `qualitative`.
- Keep 0.02, or 0.012–0.015 if aiming at the physiological median. No large error.

---

## 2. thirstLossRatio = 0.1 per day (no water)

### Evidence

- Randall K. Packer, "How long can the average person survive without water?", _Scientific American_ (2002; secondary, seen as excerpt and summaries): at rest in a comfortable setting about **a week** at most, which is an upper bound drawn from end-of-life patients. In heat or with exertion the time falls to hours or a few days. https://www.scientificamerican.com/article/how-long-can-the-average/
- Commonly quoted practical figure: **3–4 days**. Piantadosi (Duke), quoted in press: about "100 hours" at average outdoor temperature. Secondary, snippet only.
- McCance et al., _The Hazards to Men in Ships Lost at Sea 1940–44_ (MRC Special Report 291, 1956), is the right lifeboat dataset. Its tables were not accessible, so it is unverified here.
- Castanheda on da Gama: water cut to "one pint of water per man each day" near Kilwa. This is a rationing practice, not mortality data.

**Model arithmetic**
0.1 a day gives a median of about 6.9 days, with 26% dead by day 3 and 50% by day 7. A 4–5 day median implies ln2 / 4.5 ≈ 0.15 a day. Tropical deck work would push it higher. The same caveat applies: a constant hazard kills too many on days 1–2 and too few on days 4–6.

### Verdict

- **Grade:** `qualitative`.
- 0.1 is within a factor of 2. Optionally raise it to **0.15** to match a 4–5 day median. Not off by a lot.

---

## Summary table

| Key                 | Current | Evidence                                                                        | Suggested               | Grade                                                     |
| ------------------- | ------- | ------------------------------------------------------------------------------- | ----------------------- | --------------------------------------------------------- |
| starvationLossRatio | 0.02    | death at 46–73 days at rest; shorter at sea                                     | keep (or 0.012–0.015)   | qualitative                                               |
| thirstLossRatio     | 0.1     | 3–7 days survival                                                               | keep, or 0.15           | qualitative                                               |
| provisionPrice      | 0.4     | 12 mrs/day (1493, 1497); ~9 mrs/day (Magellan 1519)                             | **0.03** (12–17× lower) | measured (Bermeo 1493)                                    |
| hireWage            | 10      | 4-month advance: 4,000 mrs (10.7 duc) in 1492; 4,871 mrs avg (13.0 duc) in 1519 | keep (or 11)            | qualitative (measured if defined as 4 months × 1,000 mrs) |
| startGold           | 1000    | ~560 (minimal one-ship estimate) to ~2,600 (Magellan per ship) ducats           | keep                    | qualitative                                               |

Gaps: Portuguese (da Gama/Cabral) pay and victualling figures were not found. McCance 1956 tables were not accessed. Ladero Quesada's breakdown of Columbus's 1492 costs was seen only through secondary snippets.
