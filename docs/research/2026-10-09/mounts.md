# Mount speeds and desert water: sourced numbers (`src/content/game/mounts.tuning.ts`)

Conversions: 1 nm = 1.852 km; 1 statute mile (mi) = 1.609 km = 0.869 nm.
Great-circle distances computed with haversine from modern coordinates (Sijilmasa 31.28N 4.27W; Taghaza 23.60N 5.00W;
Walata 17.29N 7.03W; Timbuktu 16.77N 3.00W; Taoudenni 22.68N 3.98W; Marrakech 31.63N 8.0W; Gao 16.27N 0.04W).
Straight-line distance understates the route by roughly 10-20 %, so derived speeds are lower bounds.

Legend: [opened] = I read the text myself; [snippet] = seen only in a search summary, not verified.

---

## 1. horseGrassland = 25 nm/day (46 km)

### Evidence

**Hall, J. R. (2026). "Travel Speed over the Longue Durée." _European Review of Economic History_, heag011. doi:10.1093/ereh/heag011** [opened, PDF via gwern.net/doc/technology/2026-hall.pdf]. Secondary scholarship. It uses daily royal itineraries (England 1199-1547, France 1461-1589) and re-tabulates Boyer 1951.

- p. 2: "average royal travel speed along the medieval roads is around 15 to 20 mpd"
- p. 2, citing Boyer, M. N. (1951), _Speculum_: "most journeys were probably made at a rate between twenty and thirty miles (per day)" (Boyer 1951, 606)
- p. 2, citing Ludwig (1897): "a normal day's journey of being about 24 miles"
- p. 2, citing Prestwich (2016) on Edward I: "It was not common to travel over twenty miles in a day, and fifteen miles seems to have been a comfortable distance"
- p. 9, Edward III: "His average travel speed without the baggage train is estimated at 24 miles per day, compared to just 15 miles per day when accompanied by it."
- Table 2 (p. 11), Boyer 1951, 14th-c. France: Individuals/small groups **33 mpd**; News/errands 41 mpd (couriers, excluded); "Others" **28 mpd**; Elite with entourage 26 mpd.
- p. 3, Pound (1979): an "ordinary European traveller" could do 31-43 mpd ("sources ... opaque").

| Source / context                     | mi/day | km/day | nm/day |
| ------------------------------------ | ------ | ------ | ------ |
| King with baggage train (Eng./Fr.)   | 15-20  | 24-32  | 13-17  |
| Edward III without baggage train     | 24     | 39     | 21     |
| Ludwig 1897, normal day's journey    | 24     | 39     | 21     |
| Boyer 1951, "most journeys"          | 20-30  | 32-48  | 17-26  |
| Boyer 1951, "Others" (non-urgent)    | 28     | 45     | 24     |
| Boyer 1951, individuals/small groups | 33     | 53     | 29     |

The context is mostly mounted travel on European roads with inns and fodder available. Speeds are averaged over journeys and include short halts. Couriers with relays reach 40-100 mpd and are excluded.

I did **not** find a specific late-medieval cavalry-campaign march rate for this period. The general logistics pages I saw gave only 5-10 mi/day for foraging armies [snippet; anonymous hundredyearswar.com page, no author].

### Assessment

- 25 nm/day (28.8 mi, 46 km) sits inside Boyer's 20-30 mi band and is close to his "Others" mean of 28 mi (24 nm).
- A party that is self-supplied and off-road, crossing grassland for many days, would likely be slower: about the Edward III / Ludwig figure of 24 mi (21 nm).
- **Grade: qualitative.** Sources give a range of 21-29 nm for small mounted parties, and 25 is authored within it. If you want `measured`, set it to **24 nm/day** and cite Boyer 1951 via Hall 2026 Table 2 ("Others", 28 mpd ≈ 24.3 nm). That is defensible, although the context (European roads, not open grassland) only partly matches.
- **Recommended value:** keep 25, or use 24 to tie it to Boyer. Use 21 if you want it to represent a self-supplied party with baggage.

---

## 2. horseDesert = 10 nm/day

### Evidence

**Cadamosto (Alvise Ca' da Mosto), _Navigazioni_, c. 1455-63**, English translation in R. Kerr, _A General History and Collection of Voyages and Travels_, vol. 2 (1811), Project Gutenberg #10803 [opened]. This is a primary account from the period, but it is hearsay from Azenegue/Arab traders at Arguin.

- "It is reckoned to be forty days journey on horseback from Tegazza to Tombuctu, and thirty from thence to Melli."
- Taghaza to Timbuktu is about **788 km** great-circle. 788 / 40 = **19.7 km/day = 10.6 nm/day** (straight line); about 11.5-12.5 nm/day by route.
- Caveats:
  - "Days journey on horseback" may be a conventional unit of distance rather than an observed horse march.
  - In the same chapter Cadamosto puts Taghaza "six days" from Wadan, which is geographically wrong (about 700 km). His distances are unreliable.
  - Horses on that route would have depended on camels carrying their water.

**Moroccan expedition to Songhay, 1590-91.** Secondary and snippet only.

- Wikipedia "Moroccan invasion of the Songhai Empire" [opened]: "left Marrakesh on October 16, 1590, and reached the Niger River in February 1591" (cites Rivet 2012 p.121; Kaba 1981).
- [snippet] A Spanish anonymous account (via legadoandalusi.es) gives 135 days. [snippet] The transport train was "8,000 camels, 1,000 packhorses".
- Marrakech to Gao is about 1,890 km straight. Over 135 days that is about 7.6 nm/day including halts.
- [snippet] Mahmud ibn Zarkun's reinforcement reportedly crossed in "seven weeks", about 21 nm/day. That figure is unverified and the force was camel-supported.
- Both are mixed armies in which camels carried the water, so they are not pure horse speeds.

**Burckhardt, J. L., _Notes on the Bedouins and Wahábys_ (1831), p. ~45** [opened, archive.org notesonbedouins01burcgoog]: "...another skin, out of which the mares drink the camel's milk." This is qualitative. Bedouin horses in the desert were sustained on camel milk and camel-carried supplies.

### Assessment

- Cadamosto's 40 days happens to give about 10.6 nm/day, very close to the current 10. It is a period source, on a Saharan route, and explicitly "on horseback". Its reliability is weak (hearsay, and an author who gets other distances wrong).
- **Grade: qualitative** (my recommendation). An argument for `measured` exists (Cadamosto, Kerr vol. 2, Taghaza–Timbuktu 40 days on horseback → 10.6 nm), but the source is hearsay and the distance is derived by me from modern coordinates. If you grade it `measured`, write that derivation in `source`.
- **Recommended value:** keep **10** (or 11).
- The ordering holds: horse in desert (10-11) < camel in desert (about 18-22, see §4). The evidence supports it.

---

## 3. camelGrassland = 18 nm/day

### Evidence

- I found no source giving a distinct speed for camels on non-desert terrain. Caravan pace is set by the walking speed of a loaded camel (about 3-5 km/h) and changes little with terrain, except for wet or muddy ground and forest, where camels do worse.
- **Ibn Battuta, Rihla** (trans. H. A. R. Gibb, _Ibn Battuta: Travels in Asia and Africa_, 1929, pp. 317-323) [opened, faculty.tnstate.edu/tcorse/h120/ibn_battuta.htm and rolfgross Rihla-14]. Walata to Mali (Sahel/savanna): "reached in twenty-four days from Iwalatan, if the traveller pushes on rapidly". He set out "with three companions", and the mount is **not stated**. Niani's location is disputed. Taking Niani at about 11.4N 8.4W gives about 670 km, which is about 28 km/day ≈ **15 nm/day**. The derivation is weak.
- Generic loaded-camel figures [snippet]:
  - Britannica "Caravan": "2 to 3 miles (3–5 km) per hour for 8 to 14 hours each day", i.e. 24-70 km/day nominal.
  - Oklahoma State breeds page citing FAO (Bactrian): "330 lbs ... 7-8 hours a day at the ordinary speed of 25-35 km per day".
- Leo Africanus (see §6) adds that African camels graze at night ("they are vnladen in the euening, and turned loose into the next fieldes"). That suits grassland.

### Assessment

- **Grade: qualitative** (keep). There is no number specific to this context.
- 18 nm (33 km) is consistent with the generic 25-35 km/day loaded-camel pace and with the Ibn Battuta Sahel leg (about 15 nm).
- The ordering holds: horse on grassland (24-25) > camel on grassland (15-18). Boyer's horse speeds are clearly above loaded-camel pace.
- Note that the evidence does **not** support camels being _slower_ on grassland than in desert. Camel pace is about the same in both, or slightly lower in wet country. Having grassland 18 < desert 20 is fine as a game choice but is not supported by a source. Setting both at about 18-20 is equally defensible.

---

## 4. camelDesert = 20 nm/day (37 km)

### Evidence

**Ibn Battuta, Rihla, Gibb trans. 1929, pp. 317-323** [opened, two web transcriptions]. Primary account, winter crossing (left Sijilmasa 1 Muharram 753 = 13 Feb 1352), loaded salt and merchant caravan:

- "I set out on the 1st Muharram of the year 53 ... I bought camels and a four months' supply of forage for them."
- "After twenty-five days we reached Taghaza"
- "We passed ten days of discomfort there"
- At Tasarahla "They stay there three days to rest, mend their waterskins, fill them with water"
- "Thus we reached the town of Iwalatan after a journey from Sijilmasa of two months to a day."

Derivation (mine). Moving days = 60 − 10 (Taghaza) − 3 (Tasarahla) ≈ 47.

| Leg               | Straight-line km | Days | km/day | nm/day   |
| ----------------- | ---------------- | ---- | ------ | -------- |
| Sijilmasa–Taghaza | 857              | 25   | 34.3   | **18.5** |
| Taghaza–Walata    | 733              | ~22  | 33.3   | **18.0** |
| Sijilmasa–Walata  | 1,580            | ~47  | 33.6   | **18.2** |

Adding 10-20 % for route sinuosity gives about **20-22 nm/day**.

**Leo Africanus, _History and Description of Africa_** (Pory trans. 1600, Hakluyt ed. R. Brown 1896, vol. 3, p. 941) [opened, archive.org in.ernet.dli.2015.181530]. Primary, c. 1526. Fast riding dromedaries (couriers, excluded): "in the space of one day they will trauell an hundred miles ... from Tombuto to Darha or Segelmesse, being nine hundred miles distant, in the space of eight daies at the farthest". This is a courier upper bound only.

Modern azalai (Timbuktu–Taoudenni, about 665 km straight) [snippet]: "15 days" (Atlas of Mali, anl.geog.ufl.edu) and "around three weeks" (Wikipedia Taoudenni). That gives 17-26 nm/day.

### Assessment

- The current value of 20 nm/day matches Ibn Battuta's leg-by-leg pace (18 nm straight, about 20-22 by route) almost exactly.
- **Grade: measured** is defensible. The source is a specific primary source in a matching context (a Saharan caravan in winter). Suggested `source` text: "Ibn Battuta, Rihla (Gibb tr. 1929, 317-23): Sijilmasa→Taghaza 25 days, Sijilmasa→Walata 2 months incl. ~13 rest days; ≈1,580 km great-circle / 47 days = 18 nm straight, ~20 by route."
- The value is derived (days from the source, distance from modern geography). If your rule says "taken directly", call it measured-with-derivation, or grade it `qualitative` to be strict.
- **Recommended value:** keep **20** (or 18 to use the straight-line figure).

---

## 5. horseDesertWater = 3× (per person, horse folded in)

### Evidence

Baseline ration (one unit):

- [snippet] 1588 Armada instructions (Medina Sidonia), Calendar of State Papers Simancas vol. 4, Apr 1588: about "three pints" of water per man per day for all purposes, about 1.4-1.7 L. I could not open the page (HTTP 401).
- I could not find a Portuguese _canada_ water ration in a source. My recollection is "1 canada ≈ 1.4 L", which is unverified.
- **Working assumption: 1 unit ≈ 1.5-2 L.** The repo does not define the unit in litres.

Human in hot desert:

- Engels, D. W., _Alexander the Great and the Logistics of the Macedonian Army_ (1978), App. 5 Table 3, p. 145. Quoted in forum posts and History Hit [snippet]: "Personnel – 3 lb. grain, 1/2 gal. (5 lb.) water"; "cavalry, baggage and provision animals – 20 lb grain and forage, 8 gal. (80 lb.) water". That is about 1.9 L per man and 30 L per horse "with water discipline".
- Adolph, E. F., _Physiology of Man in the Desert_ (1947) [snippet, via forum quote]: carry "about 1 gallon for every 20 miles ... at night, 2 gallons for every 20 miles in the daytime", i.e. 3.8-7.6 L per 20 mi walked.
- The commonly cited desert planning figure is about 4-5 L/day [snippet, worldhistory.org: "typical consumption is 4.5 litres a day"].

Horse in heat:

- MSD/Merck Veterinary Manual, "Nutritional requirements of horses" [snippet]: "about 5 L/100 kg body weight/day" for a sedentary horse in a thermoneutral environment (≈25 L for 500 kg). Sweat losses raise needs by "50–200%". "a 500-kg horse exercising for 1 hour in a hot environment might need to drink more than 72 L".
- U. Tennessee Extension SP794, adapted from NRC 2007 [snippet]: moderate exercise, 1,000 lb horse, "10–12 gallons/day at 68°F versus 19–24 gallons/day at 95°F" (38-45 L vs 72-91 L).
- Engels 1978: 8 gal (30 L) under water discipline (Middle East campaigns).
- Desert/Arab practice: horses were watered from camel-carried skins and fed camel milk (Burckhardt 1831, above). Leo Africanus records horsemen's water carried on camels on desert routes (qualitative).

Per-person ratio for one rider plus one horse:

| Scenario                            | Human L | Horse L | Total | ÷1.5 L unit | ÷2 L unit |
| ----------------------------------- | ------- | ------- | ----- | ----------- | --------- |
| Engels (disciplined)                | 1.9     | 30      | 32    | 21×         | 16×       |
| Hot, light work (NRC/Tennessee low) | 4.5     | 40      | 44.5  | 30×         | 22×       |
| Hot, moderate work (Tennessee 95°F) | 5       | 72-91   | 77-96 | 51-64×      | 39-48×    |

### Assessment

- **The evidence contradicts 3× by roughly an order of magnitude** if the horse's water is fully folded into the per-person figure. Even Engels' disciplined allowance gives about 16-21× the ration of a sailor ration.
- 3× only works if horses drink almost entirely at wells and nothing is carried for them between wells. Historically that is exactly why horses could not cross waterless stretches: the 10-night Taghaza–Tasarahla gap was crossed with camels carrying water.
- **Grade: currently unverified.** With the numbers above it can become `qualitative` (the ordering and magnitude are sourced; the ratio is computed).
- **Recommended value:** about **15-20×** if supplies must carry the horse's water (lower bound from Engels' 30 L horse + 2 L man ÷ ~2 L unit). If gameplay needs a smaller number, document that it assumes daily watering at wells, keep it as a design choice, and do not cite physiology for it. The ordering horse ≫ camel is strongly supported.

---

## 6. camelDesertWater = 1.5×

### Evidence

Camel watering interval:

- **Leo Africanus**, Pory/Brown 1896 vol. 3 pp. 941-42 [opened]: "they will abstaine from drinke, without any inconuenience, for fifteen daies togither: and if their guides water them once in three daies, they doe them great hurt, for they are not vsually watred but once in fiue or nine daies, or at an vrgent necessitie, once in fifteene daies." This is primary (c. 1526) and covers North African caravan camels.
- Leo, same chapter: "trauailing fortie or fiftie daies togither, without any prouender at all, they are vnladen in the euening, and turned loose into the next fieldes".
- Schmidt-Nielsen et al., "Water balance of the camel", _Am. J. Physiol._ 185:185-94 (1956) [citation only]: camels tolerate large water losses and rehydrate rapidly. I did not open the paper's numbers.
- [snippet] An older text: Arabian camels "can go four, or even five days without water", with distress after the third day. This is a weaker source than Leo.

Water carried by the caravan:

- Leo, "Of the desert ... Zuenziga" [opened]: "Gogdein, where for the space of nine daies iourney not one drop of water is to be found ... wherefore the merchants vse to carrie their water vpon camels backes".
- Ibn Battuta [opened]: "Water supplies are laid in at Taghaza for the crossing of the desert which lies beyond it, which is a ten-nights' journey with no water". Also "fill them [waterskins] with water". He gives no litres per person.
- Burckhardt 1831 [opened]: "Two of such skin bags, called rawouye, constitute a heavy load for a camel" (no volume given).
- I found **no period figure for litres carried per person per day**.

### Assessment

- Camels need essentially no carried water on legs shorter than about 5-9 days (Leo). Caravans watered camels at wells, and the carried water was the people's.
- So the per-person multiplier is roughly human desert need ÷ sailor ration: 4-5 L ÷ 1.5-2 L ≈ **2-3×**. Engels' disciplined 1.9 L gives about 1×.
- 1.5× sits at the low (disciplined, winter-travel) end. Trans-Saharan caravans did travel in winter: Ibn Battuta left in February.
- **Grade: qualitative.** Direction and order of magnitude are sourced (Leo for camel watering; desert human needs). The exact ratio is authored because no period litres-per-person figure was found and the unit ration is not defined in litres.
- **Recommended value:** **1.5-2.5**. Keep 1.5 for winter crossings, or raise it to about 2-2.5 if you model summer heat. The ordering horse (≫) > camel is strongly supported.

---

## Summary table

| Key              | Current | Evidence range                                                    | Recommended                                    | Grade                                                |
| ---------------- | ------- | ----------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| horseGrassland   | 25 nm   | 21-29 nm (Boyer 1951/Hall 2026; Ludwig 1897)                      | 25 (or 24 = Boyer "Others" 28 mpd)             | qualitative (measured if set to 24 w/ Boyer)         |
| horseDesert      | 10 nm   | ~10.6 nm (Cadamosto, 40 days horseback Taghaza–Timbuktu, derived) | 10-11                                          | qualitative (measured arguable)                      |
| camelGrassland   | 18 nm   | ~15 nm (Ibn Battuta Walata–Mali, mount unknown); generic 13-19 nm | 18                                             | qualitative                                          |
| camelDesert      | 20 nm   | 18 straight / ~20-22 route (Ibn Battuta Sijilmasa–Walata)         | 20                                             | measured (with derivation)                           |
| horseDesertWater | 3×      | 16-60× if the horse's water is carried (Engels 1978; NRC/MSD)     | 15-20× (or document the wells-only assumption) | qualitative after change; current value contradicted |
| camelDesertWater | 1.5×    | ~1-3× (camels watered every 5-9 days per Leo; humans 2-5 L)       | 1.5-2.5                                        | qualitative                                          |

Ordering constraints:

- camel > horse in desert: supported (20 vs about 10).
- horse > camel on grassland: supported (24-25 vs about 15-18).
- camelGrassland < camelDesert: **not supported** by any source. Camel pace is roughly terrain-independent, so this is a game choice.

## Not verified / gaps

- No late-medieval cavalry campaign march rate with a precise citation.
- No Portuguese water ration in litres. The Armada "three pints" is a snippet only.
- Original NRC 2007 tables, Schmidt-Nielsen 1956, Lydon 2009, Bovill, Mauny, Law 1980 and Crone's 1937 Cadamosto edition were not opened.
- Cadamosto is quoted from Kerr's 1811 English, which goes via Astley/Ramusio, not the Italian original.
