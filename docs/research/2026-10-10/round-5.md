# Round 5: holing, captive sale, chase odds, damage repair (c. 1490–1620)

Research notes, 2026-10-10, for issue #13. Six values, each checked once before:

| Key                   | File               | Now                | Earlier note             |
| --------------------- | ------------------ | ------------------ | ------------------------ |
| `holingChance`        | `combat.tuning.ts` | 0.03 per round     | `2026-10-09/combat-3.md` |
| `holingShare`         | `combat.tuning.ts` | 0.4 of max hull    | none (direction only)    |
| `captiveRansom`       | `combat.tuning.ts` | 30 ducats per head | `2026-10-09/ransom-3.md` |
| `chaseOdds`           | `combat.tuning.ts` | 1.5× crew          | `2026-10-09/boarding.md` |
| `repairGoldPerPoint`  | `repair.tuning.ts` | 2.5 ducats/pt      | `2026-10-09/repair.md`   |
| `repairHoursPerPoint` | `repair.tuning.ts` | 1 h/pt             | `2026-10-09/repair.md`   |

Conversions: 1 ducat = 375 maravedís (mrs); 1 Castilian real = 34 mrs, so 1 ducat ≈ 11.03 reales;
1 cruzado ≈ 1 ducat ≈ 390–400 réis. For £ sterling in the 1580s I use roughly 3.5–4 ducats per £ [mem]. That rate is not checked, so it is never used for a grade.

Tags: **[opened]** = I read the passage in the full text myself this session. **[snippet]** = seen only in a search result. **[mem]** = from memory, not checked this session.

Quotes come from archive.org djvu OCR. I silently fixed obvious OCR errors (long-s, broken words). Page numbers are the printed ones near the passage.

## Texts opened this round

- Cesáreo Fernández Duro, _La Armada Invencible_, 2 vols (Madrid 1884–85). archive.org
  `fernandez-duro-la-armada-invencible-v-1` and `-v-2` (djvu text). Vol. II holds the documents, including the
  Spanish journals of the campaign.
- J. K. Laughton (ed.), _State Papers relating to the Defeat of the Spanish Armada_, 2 vols (Navy Records
  Society 1894). archive.org `statepapersrelat01navyuoft`, `statepapersrelat02navyuoft`.
- Diego Suárez Montañés, _Historia del maestre último que fué de Montesa…_ (Madrid 1889; written c. 1604 by a
  soldier who served at Oran). archive.org `historiadelmaest01suaruoft`.
- Diego de Haedo, _Topographia e historia general de Argel_ (1612). archive.org `topographiaehist00ha`, re-grepped
  for this round.
- Bernardo Rodrigues, _Anais de Arzila_ I (ed. Lopes 1915). archive.org `anaisdearzilacrn01rodr`, re-grepped for
  `pregão` and `almoeda`.
- H. de Castries, _Sources inédites de l'histoire du Maroc_, 1re série, Espagne t. I (1921). archive.org
  `histoire-du-maroc-sources-inedites-portugal`. I grepped it only.

---

## 1. `holingChance` (0.03 per ~2-hour round)

The game value is the chance that one ship in a fight takes a hit below the waterline in one 2-hour round. A record can give this only if it names the holed ships **and** says how many ships were under fire, and for how long. No 1490–1620 corsair record I opened does both. The 1588 campaign comes closest, from both sides.

### 1a. English side: Chatham survey, 28 Sep 1588 [opened]

Laughton II, pp. 250–254, "A Survey of the Navy" (SP 12/216/40). Master shipwrights (Peter Pett, Mathew Baker,
John Austyne) examined each royal ship back at Chatham after the campaign:

> "The state of her Majesty's ships, ship-boats, and pinnaces examined and surveyed by the master shipwrights and
> other the masters attendant at Chatham … the 28th of September, 1588."

The survey covers 23 hulls. These are galleons, pinnaces and barks, plus the galley _Eleanor_, which did not fight. The defects it lists are rot ("decayed timber", "decayed stem and sternpost"), leaks blamed on age, and masts, boats and tops. Only one entry mentions shot damage:

> "The Revenge. — The same ship is to have a new mainmast, being decayed and perished with shot as otherwise"

No entry records a shot hole in the hull, or a repair below water because of shot. The English fleet fought on four main days: 31 Jul off Plymouth, 2 Aug off Portland, 3–4 Aug off the Wight, and 8 Aug at Gravelines, where the fighting lasted from sunrise to about 3 pm. In all that, the royal ships took **no recorded waterline holing**.

Reading: 0 holed ships out of about 22 fighting hulls, over about 10–15 two-hour rounds each. The English chose their range, though, so this is a lower bound for a ship that does not control the range.

### 1b. Spanish side: Portland (2 Aug) and Gravelines (8 Aug) [opened]

Duro I, pp. 99–100, on the Portland day. This is Duro's narrative, from the Spanish journals:

> "sólo once de las naos españolas sufrieron por mucho tiempo el fuego de más de ciento enemigas, y no pasaron de
> cuarenta las que en todo el dia llegaron á ponerse á tiro. Duró tan desigual pelea desde las ocho de la mañana
> hasta las tres de la tarde … Nuestra capitana recibió varios balazos á flor de agua"

Translation: "only eleven of the Spanish ships suffered for a long time the fire of more than a hundred enemies, and no more than forty came within range in the whole day. The fight lasted from eight in the morning until three in the afternoon … our flagship received several shots at the waterline."

Duro II, journal of the campaign, 2 Aug (p. ~387):

> "á ella la dieron más de cincuenta cañonazos … y en el cuerpo del navío la dieron muchos dellos, de que hacía
> mucha agua. Remedióse con dos buzos que en la Real había, que tomaron el agua y pusieron planchas de plomo"

Translation: "she [the flagship] was given more than fifty cannon shots … and many in the hull, from which she made much water. It was remedied by two divers on board the flagship, who stopped the water and fitted lead plates."

Duro II, the same journal, 8 Aug at Gravelines (p. ~392):

> "Dieron á nuestra Capitana muchos cañonazos á la lumbre del agua, que todos pasaban dentro … recibió en el cuerpo
> del navío y árboles y velas 107 golpes de cañon … San Mateo pidió socorro diciendo se iba á fondo, porque hacía
> mucha agua por los cañonazos que habia recibido … Tambien pidió socorro el galeon San Felipe"

Translation: "they gave our flagship many cannon shots at the waterline, all of which went through … she received in the hull, masts and sails 107 cannon hits … San Mateo asked for help, saying she was sinking from the water she made through the shots received … the galleon San Felipe also asked for help."

Duro II, the account at pp. ~403–404, adds:

> "Otra nao llamada Maria Juan, quedandose muy atras entre los enemigos, de tal manera la cañonearon que la nao se fue
> a fondo"

Translation: "Another ship called María Juan, left far behind among the enemy, was so cannonaded that she sank."

Duro II, p. ~262: the flagship was "muy maltratado de los cañonazos de entre dos aguas", i.e. badly damaged by shots between wind and water. The battle lasted "desde salir el sol hasta las tres de la tarde", from sunrise until three in the afternoon. That is about 9 hours, or **about 4–5 game rounds**.

Reading for Gravelines:

- Four ships are named as holed at or below the waterline: San Martín, San Mateo, San Felipe and María Juan.
- If the denominator is about 40 Spanish ships under fire (Duro's figure for Portland, which I reuse), the rate is 4 / (40 × 4.5) ≈ **0.022 per ship per round**.
- The 4 is a lower bound. The journal names only the flagship and the ships that were lost or asked for help, and says "casi todos los bajeles nuestros de confianza muy malparados" (almost all our trusted ships badly damaged).
- The 40 is also borrowed from another day.

So the plausible range for Gravelines is about **0.02–0.05 per ship per round**. That was the hardest artillery day of the century in northern waters, fought at close range by race-built galleons.

### Reading

- The two sides of one campaign bracket the game value: English ships about 0 per round, Spanish ships at Gravelines about 0.02–0.05. The game's **0.03 sits inside that bracket**.
- The meaning still differs from the game in three ways:
  - These are fleet artillery actions between big royal ships, not corsairs, who wanted the prize afloat and fought to board.
  - Both denominators are my own reconstruction.
  - The ships were 600–1,000 t, not 100–300 t.
- A corsair, who aimed at the rigging and boarded, would hole less often than Howard's gunners did. That points to 0.03 being high for pirate fights, not low.

**Proposed grade: unverified (no value change).** The numerators are opened, but the denominators (ships under fire, rounds) are my inference and the context is fleet gunnery, not corsairs. If a later round wants to argue `qualitative`, the citation is "Gravelines 1588 ≈ 0.02–0.05 per ship-round (Duro II), English royal ships ≈ 0 (Chatham survey, Laughton II pp. 250–254)".

---

## 2. `holingShare` (0.4 of max hull lost per waterline hit)

The game value is the share of maximum hull a ship loses per waterline hit. As tuned, one hit usually breaks a ship, two always break it, and three sink it. A record can test this only if it gives the number of waterline hits for a named ship and the outcome. All cases I found are big ships (≥ 600 t). None is in the 100–300 t range.

| Ship, date                                          | Size [mem] | Waterline hits                                          | Outcome                                                                                             | Source                              |
| --------------------------------------------------- | ---------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------- |
| _Santa Ana_ (Manila galleon) vs Cavendish, Nov 1587 | ~600–700 t | "dos ó tres balazos" at the waterline                   | surrendered ("darse á partido") after 3 boardings were repulsed; masts and rigging also wrecked     | Duro I, p. 154 [opened]             |
| _N.S. de la Rosa_, 1588                             | ~945 t     | "cuatro balazos á flor de agua", rigging all cut        | kept the sea for weeks; wrecked later in Blasket Sound (a storm, not the holes) [mem for the wreck] | Duro I, pp. 195–196 [opened]        |
| _San Martín_ (flagship), Portland 2 Aug 1588        | ~1,000 t   | "más de cincuenta cañonazos", many in the hull, leaking | patched the same day by 2 divers with lead plates                                                   | Duro II, p. ~387 [opened]           |
| _San Martín_, Gravelines 8 Aug 1588                 | ~1,000 t   | "muchos … á la lumbre del agua", 107 hits in all        | patched by divers; survived and reached Santander                                                   | Duro II, p. ~392 [opened]           |
| _San Mateo_ / _San Felipe_, Gravelines              | ~750–800 t | "muchos cañonazos" between wind and water (no count)    | could not stop the leaks; drifted onto the Flemish coast and were lost or taken                     | Duro II, pp. ~243–244, 262 [opened] |
| _María Juan_, Gravelines                            | ~665 t     | not counted                                             | sank                                                                                                | Duro II, p. ~404 [opened]           |

Santa Ana quote (Duro I, p. 154): "destrozando los mástiles y aparejos y acertando á la lumbre de agua dos ó tres balazos. El capitan consultó á los pasajeros lo que harían en aquel grave caso, acordando darse á partido, pues no había otro remedio". Translation: "wrecking the masts and rigging and putting two or three shots at the waterline. The captain consulted the passengers on what to do in that grave case, and they agreed to surrender, since there was no other remedy."

### Reading

- For ships of 600–1,000 t, 2–3 waterline hits together with wrecked rigging led to surrender (Santa Ana), while 4 hits (Rosa) and "many" hits (San Martín) did not sink the ship. Divers could plug holes at sea within the same day.
- Read literally, this says 0.4 per hit is **too harsh for big ships**. Something nearer 0.15–0.25 would fit them: 4 hits survivable, "many" fatal unless plugged.
- There is no case for 100–300 t hulls. A small hull with the same shot would plausibly take more water per hole, so the tuned value could still be right for the game's ships.
- No case gives hits as a share of hull, so the mapping to a fraction of hull is the game's own.

**Proposed grade: unverified (no value change).** The counts are opened, but the hull sizes are outside the target range and "share of hull" has no observable counterpart. Worth noting in the `source` string: "big ships (600–1,000 t) survived 4+ waterline hits and divers plugged holes at sea (Duro, Armada 1588); Santa Ana 1587 surrendered after 2–3 together with wrecked rigging."

---

## 3. `captiveRansom` (30 ducats per ordinary raider, handed over on the spot)

### 3a. Oran cabalgadas, 1567–1572: auction totals per raid [opened]

Suárez Montañés served at Oran. He says he had the prize and distribution books in his hands: "como todo yo lo he visto y me consta de los libros de presa y repartimientos que para verificación desta y otra Historia tuve en mi poder dentro en Oran" (p. ~254). For each raid of the Maestre de Montesa he gives the number of captives sold, the total sale value, the royal fifth and the share per soldier.

The cleanest case is the **seventh raid, October 1570**, against the Alaxezes and Uled Muça encampments at Zenán, 10 leagues west of Oran (cap. XXV, pp. ~297–300). The raiders took "198 personas, varones y mugeres de todas edades" (198 people, men and women of all ages) and "85 bestias de carga, caballos, mulas, yeguas y jumentos" (85 pack beasts: horses, mules, mares and donkeys). They brought no livestock: "No se trajo ganado desta jornada".

The sale:

> "se vendieron por la cabalgada 192 esclavos, de los cuales y de las bestias montó su valor 66.670 reales; de los
> cuales, siendo sacadas las ordinarias costas del zanco y para la espía, lengua y trujamán, y para ventajas,
> perteneció al quinto de Su Magestad 8.040 reales; restaron para repartir 32.233 reales, de los cuales se hicieron
> 1.465 partes … á razón de 22 reales cada parte"

Translation: "192 slaves were sold for the raid; with the beasts their value came to 66,670 reales. After the usual costs of the _zanco_, the spy, the interpreter and the bonuses were taken out, 8,040 reales went to His Majesty's fifth, and 32,233 reales remained to be shared out, in 1,465 shares … at 22 reales a share."

Per head: 66,670 ÷ 192 = **≤ 347 reales ≈ 11,800 mrs ≈ 31.5 ducats**. This is an upper bound, because the 85 beasts are in the total. If the beasts fetched 50–150 reales each, the captives averaged about 280–325 reales, or **≈ 25–30 ducats**.

The other raids in the same book [opened] give looser upper bounds. They fit the same order once livestock is taken out.

| Raid (page)            | Sold | Total (reales)                        | ≤ per head (r) | ≤ ducats |
| ---------------------- | ---- | ------------------------------------- | -------------- | -------- |
| 1569, p. ~255          | 165  | 131,587 (with saddle and pack beasts) | 797            | 72       |
| p. ~259                | 46   | 26,065 (with cattle and beasts)       | 567            | 51       |
| p. ~281                | 136  | 74,312 (with camels and cattle)       | 546            | 50       |
| p. ~197                | 184  | 221,823 (with cattle and beasts)      | 1,206          | 109      |
| p. ~227                | 418  | 453,070 (with livestock)              | 1,084          | 98       |
| Oct 1570, pp. ~299–300 | 192  | 66,670 (beasts only)                  | 347            | 31.5     |

How fast the sale was ("on the spot"?), from p. ~294:

> "siempre tarda la presa … más de dos meses de tiempo por lo menos en vender la presa y cobrar el dinero dellas.
> Esto se entiende cuando es á luego pagar, porque cuando se venden fiadas se da término por lo menos de medio año"

Translation: "the prize always takes … at least more than two months to sell and collect the money. That is when it is for cash; when sold on credit, at least half a year is allowed."

The appraisal ("aprecio") happened on arrival at Oran, and the auction followed within weeks. That is much closer to the game's "hand over on the spot" than an _alfaqueque_ ransom months later. It is still not instant cash.

### Why this does not grade the value

1. **Who was sold.** The captives are encampment people, "varones y mugeres de todas edades" (men and women of all ages). They are not raiders taken in a chase. An adult fighting man would sell above the average of a group that includes children and old people.
2. **Date.** These sales are from 1567–1572. Andalusian prices roughly doubled between 1500 and 1570 [mem, Hamilton]. Deflated to c. 1510, the 1570 average would be about 13–16 ducats, and the 1569 bound (≤ 72) would be about ≤ 36.
3. **Upper bounds only.** The beasts are mixed into every total.
4. These points pull in opposite directions: adult men sell higher, deflation pushes lower. So 30 is not contradicted, but neither is it measured.

Even so, this is the first [opened] **auction** price for captured Maghrebis that I have found. The earlier rounds had only a remark in a chronicle and ransoms paid months later.

### 3b. Arzila, three captured guards auctioned (Anais I, pp. 281–282) [opened, no price]

Three Moorish guards taken at a well were "postos … em pregão", i.e. put up at auction. A Castilian named Chinchila bought all three, hoping to exchange them for his captive son. No price is given. This confirms the immediate-auction practice for **ordinary** men at Arzila, but gives no number.

### 3c. Searched, nothing usable

- De Castries, _Sources inédites_, Espagne t. I (Oran letters of the 1530s–50s) [opened]: grepped for `ducados`/`doblas` near `moro`/`esclavo`/`cautivo`. Slaves are "vendido y rrescatado" (sold and ransomed), with no per-head price.
- Lobo Cabrera, "Lanzarote en el siglo XVI" (memoriadelanzarote.com PDF) [opened]: no slave prices.
- Alfaro Hardisson, "Los moriscos de Tenerife … los adalides" (americanistas.es PDF): opened and grepped only. There are 3 mentions of `doblas`, which I did not read through.

**Proposed grade: unverified (no value change).** The Oran 1570 auction, ≤ 31.5 ducats per head (≈ 25–30 net of beasts), matches 30 in size. But the people sold differ (families, not raiders), so do the date (1570, not c. 1510) and the timing (cash after about 2 months). If a reviewer accepts the deflation argument, the honest band for c. 1510 is about 13–36 ducats, which keeps 30 at its upper end. A suggested addition to the `source` string: "Oran 1570: 192 captives (all ages) plus beasts auctioned for 66,670 reales, ≤ 31.5 ducats per head (Suárez Montañés, cap. XXV)".

---

## 4. `chaseOdds` (attack only with ≥ 1.5× the defenders' manpower)

### 4a. Murad Reis vs two Tuscan galleys, 1594 (Haedo, _Epítome_, f. ~89) [opened]

> "El año de 1594 salió Morato Arráez de Argel … con quatro galeotas … descubrió dos vajeles que luego conoció ser
> galeras christianas, y al momento ordenó que dos de sus quatro galeotas desarbolasen y cada vna assi desarbolada se
> pusiesse detras de la arbolada, para que desta manera sus galeotas no pareciessen mas de dos, y assi induzir a las
> galeras christianas que viniessen a inuestir"

Translation: "In 1594 Murad Reis left Algiers … with four galliots … he sighted two vessels that he soon knew to be Christian galleys, and at once ordered two of his four galliots to strike their masts and each, so unmasted, to keep behind a masted one, so that his galliots should look like only two, and so induce the Christian galleys to come and attack."

The Tuscan galleys "estuvieron dudando en la resolución que auian de tomar de huyr o acometer" (stood doubting whether to flee or attack). The corsairs boarded the flagship. One of the attackers was "vna galeota de veynte bancos" (a galliot of twenty benches).

Reading: the corsair attacked at **2:1 in hulls**. He also hid that ratio, because he knew the defenders were judging by the number of ships they could see. No crew counts are given. Haedo's own crew figure (cap. XXI, about 40 soldiers for a 20-bench galliot; see `combat-3.md`) against a Tuscan galley of perhaps 100–150 soldiers [mem] would put the man ratio near **1:1 or below**. That would mean the hull ratio is a poor stand-in for a manpower ratio.

### 4b. Nothing else

Duro and Laughton have no corsair attack decision stated in men. Hakluyt was grepped in round 3 (`combat-3.md`) and not repeated.

**Proposed grade: unverified (no value change).** The new case supports "two ships to one" as the corsairs' threshold (now Dan 1649 and Haedo 1594). Turning that into a crew ratio is still the game's assumption, and 4a hints the crew ratio could be lower than the hull ratio.

---

## 5. `repairGoldPerPoint`: cost of damage repair

### 5a. Revenge, grounding damage at Portsmouth, c. 1586–87 (Laughton I, pp. 42–43) [opened]

This is a memorandum against John Hawkins's navy bargain:

> "In the Revenge, which ship, by beating upon the ground at Portsmouth, had some decayed place in her keel, which
> was perfected for a matter of 40[l.], but he had a recompense of 70"

Translation (context): the keel damage from grounding was made good for about £40. Hawkins claimed £70.

This is an **accident damage repair** with a cost, which is the kind of record round 1 asked for. But the extent is only "some decayed place in her keel", there is no purchase price in the passage, and the £-to-ducat rate is [mem]. At 3.5–4 ducats per £, £40–70 ≈ 140–280 ducats for a ship of about 450 t [mem]. That is a small fraction of her value.

### 5b. Lisbon refit of 10 Portuguese galleons and 2 zabras, Oct 1587 – Apr 1588 (Duro II, Núm. 102, p. ~40) [opened]

The account lists "De jornales de carpinteros y calafates … 7.888 [escudos]" (wages of carpenters and caulkers) and "De tablazon, mástiles, estopa, clavazon, aceite, alquitran … 22.203" (planks, masts, oakum, nails, oil, tar …).

This is a **pre-voyage refit**, the same kind of record as the Magellan 1519 one in `repair.md`. It is not damage repair, so it is not used.

**Proposed grade: unverified (no value change).** The one damage-repair cost found (Revenge, £40) has no measure of how much damage there was and no ship price. It cannot be mapped to hull points.

---

## 6. `repairHoursPerPoint`: time for damage repair

| Case                                                   | Damage                                                             | Time                                                                                                                                    | Source                                                                                   |
| ------------------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Armada galleys driven into Blavet (Brittany), Aug 1588 | "so sore beaten with weather"                                      | "had the carpenters 10 days repairing of the galleys"                                                                                   | Laughton II, p. ~128 (deposition of Nicholas Feld, merchant of Dublin, hearsay) [opened] |
| Armada at La Coruña after the June 1588 storm          | storm damage, dispersal (Duro: "la tormenta … no fué muy forzosa") | sailed 22 Jul, "á los treinta y dos dias de la entrada" (32 days after putting in); includes resupply, re-manning and the Duke's delays | Duro I, pp. 62–65 [opened]                                                               |
| San Martín, at sea, 2 Aug 1588                         | "many" hull hits, leaking                                          | same day, 2 divers with lead plates                                                                                                     | Duro II, p. ~387 [opened]                                                                |
| Chatham survey, Sep 1588                               | rot and leaks; shot damage only to Revenge's mast                  | several "cannot be done … without a dry dock"; no durations                                                                             | Laughton II, pp. 250–254 [opened]                                                        |
| Lisbon refit (pre-voyage), Oct 1587 – Apr 1588         | refit, not damage                                                  | ~5 months for 12 hulls                                                                                                                  | Duro II, Núm. 102 [opened]                                                               |

Reading:

- Storm damage to a galley was put right in about 10 days, a figure reported second-hand.
- A whole fleet's storm damage was put right within 32 days, an upper bound padded by other causes.
- Waterline shot holes were plugged at sea within hours.

The game's 1 h/pt (about 4 days for a full latina, 8 for a full nau) sits between the divers' same-day plug and the galleys' 10 days. None of these gives days per amount of damage.

**Proposed grade: unverified (no value change).** Another upper bound (Blavet, 10 days) is now on record, but there is still no extent of damage to divide by.

---

## Dead ends (so the next round can skip them)

- **mdc.ulpgc.es** (ULPGC Memoria Digital de Canarias) PDFs return **403**, and so does **accedacris.ulpgc.es**. **revistas.grancanaria.com** (Anuario de Estudios Atlánticos) returns an Incapsula bot wall. These hold Lobo Cabrera and Anaya Hernández on cabalgada captives and slave prices in the Canaries [snippet only]. They need a browser.
- Ingenieros Navales (Galicia), "Capítulo 4: Los preparativos de la expedición" (Magellan). `repair.md` said it was worth retrying, and pypdf now extracts it, but the text is only 11 KB. It has no careening dates or carpenter numbers. Closed.
- Anais de Arzila I/II, grepped for `almoeda`, `pregão`, `vend*`: the only auction of ordinary men (3b) has no price.
- De Castries, Espagne t. I: no per-head prices (3c).
- Haedo, grepped for `huyr`, `ventaja`, `mucha/poca gente`: only the 1594 case (4a).
- Not tried, possibly worth a later round:
  - Suárez Montañés's **other** raids for the cleanest no-livestock totals.
  - His companion manuscript on Oran (the "otra Historia" he mentions).
  - Diego de Torres, _Relación del origen y suceso de los Xarifes_ (1586), on Portuguese Safi and Santa Cruz captives.
  - Gaspar Correia, _Lendas da Índia_, for Portuguese repairs after battles at Cochin and Goa.
  - Navarrete t. V (Loaísa) for repairs in the Moluccas.
  - Laughton for English **merchant** ship damage claims after 1588.
