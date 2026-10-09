# Combat / encounter tuning: source check (c. 1450-1600)

Scope: playerLethality, pirateLethality, banditLethality, beastLethality, pirateHullDamage,
routRatio, tributeGold, tributeDays, plunderGold. Reasonable effort, not exhaustive.
Legend: [P] primary text read in full, [S] secondary read, [snip] seen only as a search snippet/summary
(not opened or fetch blocked), [mem] from background knowledge, not re-verified this session.

## Currency conversions used

Castilian money of account [mem, standard; e.g. Hamilton, _American Treasure and the Price Revolution_]:

- 1 ducado = 375 maravedis (money of account, stable through the 16th c.)
- 1 real (silver) = 34 maravedis -> 1 ducado ~ 11.03 reales
- 1 peso de a ocho (piece of eight) = 8 reales = 272 maravedis ~ 0.73 ducado
- 1 escudo (gold) = 350 mrs (1537) -> 400 mrs (1566) -> 440 mrs (1609), i.e. ~0.93-1.17 ducado
- Venetian gold ducat ~ comparable in gold content to the Castilian ducat c. 1500.
  Ducats in this report are Castilian ducados unless noted.

## 0. The structural finding (read this first)

Two primary accounts of a merchantman being boarded by much larger crews both show the
_defenders_ losing almost nobody, while the game model kills them fast:

| Case                                                                                                                                        | Defenders         | Attackers                                                           | Duration             | Defender losses                                | Attacker losses                                          | Outcome                       |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------- | -------------------- | ---------------------------------------------- | -------------------------------------------------------- | ----------------------------- |
| _Centurion_ of London vs 5 Spanish galleys, Strait of Gibraltar, Easter 1591 [P]                                                            | 48 "men and boys" | "about five or six hundredth Soldiers" per galley (surely inflated) | 5.5 h (~2.75 rounds) | 4 killed, 10 hurt (8% killed, 29% casualties)  | "many a brave and lusty Spaniard" (no count)             | attackers ungrappled and left |
| French polacre _Sainte Marie Bonaventure_ vs Algerian corsair (Pierre Dan, _Histoire de Barbarie_, bk 3 ch 1; 17th c.) [S, quoted via blog] | 14                | "more than ninety Turks"                                            | 4 h (2 rounds)       | 0 killed, "all wounded, though none seriously" | "many ... wounded, drowned, or cut to pieces" (no count) | corsair fled                  |

Sources:

- _The Valiant and most laudable fight performed in the straits, by the Centurion of London, against five Spanish Galleys_ (London, 1591), EEBO-TCP A18330, text at https://distantreader.org/stacks/earlyprint/txt/A18330.txt .
  Quotes: "In the Centurion there was in all, of men and boys, forty and eight"; "shot through her main Mast, and slew four of the men in the said ship"; "Ten other persons were hurt, by means of splinters"; "Five hours and a half this fight continued".
  (Wikipedia's infobox "200 killed or drowned" Spanish / "44 killed & 10 wounded" English is not supported by the pamphlet: the pamphlet says 4 killed; the 44 is probably a misreading of 48 men. Do not use.)
- Pierre Dan via https://corsairsandcaptivesblog.com/father-pierre-dan-on-algerian-corsairs-part-2/ : "the polacre had a crew of only fourteen"; "There were more than ninety Turks aboard the corsair ship"; "after four hours of combat"; "Not one died".

What the current model gives (deterministic, no luck, rout at 0.5, player 0.1 / pirate 0.12):

| Defenders vs attackers | Rounds | Defenders killed | Attackers killed | Result         |
| ---------------------- | ------ | ---------------- | ---------------- | -------------- |
| 48 vs 150              | 2      | 35.4 (74%)       | 7.8 (5%)         | defenders rout |
| 14 vs 90               | 1      | 10.8 (77%)       | 1.4 (2%)         | defenders rout |
| 20 vs 20               | 6      | 11.3             | 8.8              | ratio 1.28 : 1 |

The loss is quadratic in enemy headcount (Lanchester square law: everyone fights everyone). The
historical cases instead look like a _frontage-limited_ fight: a high-sided ship with "close fights"
(barricaded decks) lets only a few attackers engage at once, so outnumbered defenders bleed slowly
and the attackers pay. **No lethality value fixes both cases**: to get the Centurion's 4/48 over 2.75
rounds with even 150 attackers you need pirateLethality ~ 4 / (150 x 2.75) ~ 0.01, which would make
even-sized fights almost bloodless. Per the project's own rule ("SHAPE.md first"), this is a
structure problem (no frontage cap / defender-position term), not a table value.

Caveats: both accounts are celebratory survivor stories (selection bias: we hear of the
merchantmen that won). The commoner outcome per the secondary literature is the opposite: the
prey "surrendering without a shot being fired", corsairs using firepower sparingly to intimidate
rather than fight (https://corsairsandcaptivesblog.com/corsair-attacks-part-1/ [snip]). That also
argues for zero-casualty surrender as the modal outcome, i.e. an outcome the round model does not
produce at all.

## 1. Lethality values

### playerLethality = 0.1, pirateLethality = 0.12

- Found: the two engagements above (crew sizes, durations, defender deaths; attacker deaths not counted).
- Implied defender-side kill rate in the Centurion case: 4 killed / (N_attackers x 2.75 rounds). With N
  unknown (5 galleys; the "500-600 each" is propaganda; real Spanish galleys of the 1590s carried
  ~100-150 soldiers+seamen excluding rowers [mem]) this is ~0.002-0.01 per attacker per round.
- Attacker kills by defenders: no counts in either primary source.
- No source found giving a whole-engagement casualty _ratio_ (attackers killed : defenders killed) for
  a corsair boarding c. 1450-1600.
- 1504 action off Elba (Oruç/Aruj vs two papal galleys): Wikipedia lists corsair casualties "None",
  papal side "killed or wounded" uncounted, 112 captured [S, Wikipedia citing Bradford 1968 / Konstam 2016].
  This is a surprise capture, not a fight; it supports "decisive boardings are lopsided", nothing more.
- **Grade: `unverified`** for both. If anything, the direction sourced is "defender of a ship loses far
  fewer per attacker than 0.12", but that is a structural point (see section 0), not a value.
- Recommendation: do not retune; open a SHAPE item for frontage/position. Keep 0.1/0.12 as authored.

### banditLethality = 0.1 (desert/land raiders)

- Nothing found for c. 1500 raid casualty ratios. **`unverified`.**

### beastLethality = 0.06 (wolves)

- Linnell et al. 2002, _The fear of wolves: a review of wolf attacks on humans_ (NINA Oppdragsmelding 731)
  is the standard review; Linnell, Kovtun & Rouart 2021 update (NINA Report 1944): 2002-2020, 491 victims,
  of which 67 predatory attacks (9 fatal), 382 rabid (14 fatal), 42 provoked (3 fatal) [snip, via search
  summaries of https://www.ifaw.org/de/resources/nina-report-wolf-attacks-2002-2020].
  Predatory-attack victim fatality there ~ 9/67 = 13%, but these are modern single victims, not a party.
- Moriceau, _Histoire du méchant loup: 3000 attaques de loups sur l'homme en France (XVe-XXe s.)_ (Fayard 2007):
  ~3,000 wolf-caused deaths from parish registers 1580-1830; a sample of ~1,855 predatory-wolf victims;
  victims overwhelmingly children and women [snip, via review https://www.ferus.fr/wp-content/uploads/2008/01/analyse_Raffin_Moriceau.pdf].
- Qualitative point both sources share [snip/mem]: healthy wolves very rarely kill armed adult men in groups;
  rabid wolves bite many people, and those deaths come from rabies days to weeks later.
  So "wolves kill 0.06 armed men per wolf per 2-hour round" has no historical analogue.
- **Grade: `unverified`**, arguably `not-applicable` for the per-round number. Direction: should be very low
  vs an armed caravan. Do not move to `not-applicable` without the debt-baseline diff (project rule).

## 2. pirateHullDamage = 0.1 hull points per pirate per round

- Centurion [P]: galleys "spoiled, rend, and battered the Centurion very sore: shot through her main Mast";
  "her main Mast was greatly weakened, her sails filled with many holes, and the Mizzen and stern made almost
  unserviceable" in 5.5 h, yet she sailed home to London. The _Dolphin_ nearby "was set on fire with their own
  powder, whereby both men and ship perished".
- Pierre Dan case: the polacre sailed to Metelin "to repair" after 4 h [S].
- Note the damage came from the galleys' guns and small arms, not in proportion to boarders. Corsairs tried
  _not_ to damage prizes (damaged cargo/ship = lost profit) [snip, corsairsandcaptivesblog].
- **Grade: `qualitative`** at best: heavy rigging/upper-works damage in a hard-fought ~5 h action, hull survives.
  The "per pirate" scaling itself is unsourced. No numeric change recommended.

## 3. routRatio = 0.5

- No pre-modern quantitative source found.
- Modern operational-research rule of thumb: FM 105-5 _Maneuver Control_ (US Army, 1964): defenders ~ certain
  to break around 40% casualties; attackers ~ certain to _halt_ around 20% casualties. Origin: Dorothy Clark 1954
  study of 43 WWII battalions that broke; mean loss at break ~40%, range ~1% to ~100%; Clark herself said
  casualties were probably not the primary cause. Dupuy Institute: https://dupuyinstitute.org/2018/04/16/c-wam-4-breakpoints/ ,
  https://dupuyinstitute.org/2018/04/18/breakpoints-in-u-s-army-doctrine/ , https://dupuyinstitute.org/2024/03/26/the-40-rule/ [snip/S].
  The Dupuy Institute says no single breakpoint is defensible.
- Corsair-specific direction: corsairs were raiders whose own losses ate future profit, so they broke off
  early [snip, corsairsandcaptivesblog]; both primary cases above end with the attacker withdrawing without
  being destroyed.
- **Grade: `qualitative`.** Direction: attackers/raiders should break well before defenders. If the table allows
  a split: raider rout ~0.8 of starting strength (i.e. leave at 20% losses), defender ~0.6 (40% losses) per FM 105-5,
  stated as modern WWII-derived, explicitly not period. Arithmetic: routRatio is "fraction remaining", so
  20% loss -> 0.8; 40% loss -> 0.6. The current 0.5 (50% loss) is more stubborn than either.
  Changing it is a design call; the evidence only supports "lower losses before breaking, esp. for raiders".

## 4. tributeGold = 15 ducats per pirate

Nothing found for a "toll to be let go" at sea c. 1500. What exists are per-captive ransoms:

- Ambrus, Chaney & Salitskiy, "Pirates of the Mediterranean: an empirical investigation of bargaining with
  transaction costs" (_Quantitative Economics_ 2018) data appendix (built from Mercedarian ransom books, c. 17th c.):
  "The average captive cost 1658 silver reales (all prices are deflated to the year 1600) in Algiers and
  1972 reales in Tetuan"; Cervantes "500 gold escudos [=5044 silver reales]" [snip: appendix PDF at
  https://scholar.harvard.edu/sites/scholar.harvard.edu/files/ambrus/files/dataappendix.pdf returned 403; text
  seen via search-tool extraction only. Paper title/authors from memory].
  Conversion: 1658 reales x 34 = 56,372 mrs / 375 = **~150 ducados per average captive** (Algiers); Tetuan ~179.
- Mercedarian 1604 Algiers redemption: "5,000 escudos in gold" + cloth/merchandise "worth another 6,000",
  104 captives redeemed [S, blog citing Gari y Siumell, _La Orden Redentora de la Merced_, 1873, pp. 279-317;
  https://corsairsandcaptivesblog.com/the-redemptive-orders-part-2/]. 11,000 escudos / 104 = ~106 escudos each;
  at 400-440 mrs/escudo -> ~113-124 ducados per captive (gross outlay, incl. fees).
- Range in Algiers "from around 100 to upwards of 2,000 pesos de ocho" per captive; 200 pesos "not untypical"
  [S, uncited blog, https://corsairsandcaptivesblog.com/early-modern-currency-part-2-ransoms/]. 200 pesos ~ 145 ducados;
  fees added ~60% (Keyser letter, Algiers 1622: 1000 -> 1636 doubles [S, citing Heeringa, _Bronnen ... levantschen handel_, I.2 p. 903]).
- Elite captives: 1504 Elba, 112 captives (nobles, clergy, merchants) ransomed for 200,000 Venetian ducats
  (~1,800 ducats/head) plus a similar sum for goods [S, Wikipedia via Bradford/Konstam; treat as weak].
- Friedman, _Spanish Captives in North Africa in the Early Modern Age_ (1983): 53 expeditions freed ~15,500 Spaniards;
  most captives were ordinary people (fishermen etc.) [snip via review]. Book not read for price tables.

How this bears on 15 ducats/pirate: the sourced quantity is per _captive_, not per _captor_. A merchant crew of
~15-20 [mem/typical] x ~150 ducats ~ 2,250-3,000 ducats ransom value if taken. Under the current table a 90-man
corsair (Pierre Dan's size) demands 15 x 90 = 1,350 ducats, about 9 captives' worth, i.e. less than the
value of taking the ship. That is a plausible _design_ relation (pay to avoid capture < cost of capture) but no
source prices a release-toll. **Grade: `unverified`** for the value (the ducat scale of ransoms is `measured`,
but it measures a different quantity). If a sourced anchor is wanted, re-express tribute per _own crew member_
(~150 ducats/head x some fraction) rather than per pirate; that is a model change, not a value change.

## 5. tributeDays = 10 days of food per wolf

Not sourceable; wolves do not take provisions in any historical sense (they take livestock). **`unverified`**
(candidate `not-applicable`, but that needs the debt-baseline change per project rules).

## 6. plunderGold = 10 ducats per raider of the defeated band

- Nothing found giving the sale value of a captured galliot/fusta or cash aboard c. 1500. The Maltese prize
  court (Tribunale degli Armamenti) only dates from 1605 [snip].
- The main value of beaten corsairs to Christian captors was the men themselves as galley slaves / ransomable
  captives, not their purses. Leads with numbers not read: Filioli & Sabatini on the 1585 Naples register of 657
  galley slaves and their price estimation (HAL halshs-01728641, fetch blocked); Calabria, "The cost of a man's
  life in sixteenth-century Naples" (EBHS; scanned PDF, unreadable here): Sommaria estimated **16.54 ducats/year**
  to feed and clothe a galley convict [snip]. That is an upkeep cost, not a sale price.
- Order-of-magnitude check: if a captured raider were sold or ransomed at even ~50-150 ducats, 10 ducats/raider
  is low; but the game likely doesn't model selling prisoners, so 10 is "loose coin and gear" only.
- **Grade: `unverified`.**

## Summary of grades

| Key              | Current | Grade                                                                            | Change?                                                   |
| ---------------- | ------- | -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| playerLethality  | 0.1     | unverified                                                                       | no; SHAPE issue (frontage / ship-defence term), section 0 |
| pirateLethality  | 0.12    | unverified                                                                       | no; same                                                  |
| banditLethality  | 0.1     | unverified                                                                       | no                                                        |
| beastLethality   | 0.06    | unverified                                                                       | direction: should be very low vs armed adults             |
| pirateHullDamage | 0.1     | qualitative (weak)                                                               | no                                                        |
| routRatio        | 0.5     | qualitative                                                                      | optional: raiders 0.8 / defenders 0.6 (FM 105-5, modern)  |
| tributeGold      | 15      | unverified (ransom scale ~150 ducats/captive is measured but different quantity) | no                                                        |
| tributeDays      | 10      | unverified                                                                       | no                                                        |
| plunderGold      | 10      | unverified                                                                       | no                                                        |
