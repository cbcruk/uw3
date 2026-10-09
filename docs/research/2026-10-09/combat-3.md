# Combat round 3: defender break, corsair hull damage, tribute, surprise (c. 1440-1620)

> Copied from a research scratchpad on 2026-10-09. Quotes are from djvu/OCR text with light cleanup — check against page images before quoting elsewhere.

Scope: `defenderBreakLoss` 0.5, `pirateHullDamage` 0.1, `tributeGold` 15, `chargeShock` 0.1 /
`surpriseFactor` 2 (all `unverified` in `src/content/game/combat.tuning.ts`, SPEC-roguelike §31 R77-R78).
Builds on `boarding.md`, `raids.md`, `combat.md` and `ransom-2.md`. Cases used there are not repeated
(Centurion, Dolphin, Dan's polacre, Primrose, Cinco Chagas, Revenge, Amity crew/loss figures, the 13 Arzila /
Zurara-Meneses land cases, Naples and Malta slave prices, Lambert's alafia).

Legend: **[opened]** = I read the full passage in a full text this session; **[snippet]** = archive.org
full-text-search fragment or search summary only; **[mem]** = background knowledge, not re-verified.
Quotes keep the period spelling but are lightly cleaned of OCR noise (long s restored as "s" where the OCR
read "f"; broken hyphenation joined). Check against page images before quoting in the repo.

## Texts opened

- Diego de Haedo, _Topographia e historia general de Argel_ (Valladolid 1612), archive.org
  `topographiaehist00ha` djvu text (Boston PL copy). Three parts used: _Topographia_ cap. XXI "De los cossarios";
  the _Epítome de los Reyes de Argel_; the _Diálogo de los mártires_ ("Dialogo segundo" in the running head).
  Folio numbers are read off the OCR page numbers nearby and are approximate (±1 f.).
- Bernardo Rodrigues, _Anais de Arzila_, ed. D. Lopes, vol. I (Lisboa 1915), archive.org `anaisdearzilacrn01rodr`.
- Gomes Eanes de Zurara, _Chronica do descobrimento e conquista de Guiné_ (Paris 1841, ed. Santarém), archive.org
  `b33279639`; checked against the Beazley & Prestage translation (Hakluyt Soc. 1896-99), Gutenberg #35738 / #35764.
- Hakluyt, _Principal Navigations_ (Goldsmid ed.), Gutenberg: "vol. 11" = #12693 (John Fox; Towerson; Amity;
  Madre de Dios). Gutenberg volume labels are used, as in `boarding.md`.
- Richard Hasleton, _Strange and wonderfull things happened to Richard Hasleton_ (London 1595), EEBO-TCP A02794,
  https://raw.githubusercontent.com/textcreationpartnership/A02794/master/A02794.xml
- Pierre Dan, _Histoire de Barbarie_ (1649), archive.org `histoiredebarbar00danp` — grepped again for
  surrender, ransom and pass vocabulary. **Nothing new with numbers** beyond the cases in `boarding.md`
  (dead end; see the end).

---

## 1. `defenderBreakLoss` 0.5 — when did the defending side give up?

### Cases with numbers

#### 1a. Juan Ginovés' brigantine vs two Algerian brigantines, off Catalonia, 27 Aug 1579 [opened]

Haedo, _Diálogo de los mártires_, f. ~186v-187 (sig. Aa). After 49 escaped galley slaves had taken a galley
to Mallorca, "hasta quarenta y nueue armaron vn bergantin, para passar a Barcelona". They met "dos fragatas
o bergantines de Argel ... fiendo como eran dos a vno" (the Turks were two to one, i.e. ~100):

> "pelearon mas de vna hora, en la qual los Chriftianos mataron diez Turcos; y fueron de los suyos tambien
> muertos hasta siete ... pero con todo la Vitoria ya se inclinaua a los Chriftianos, porque tenian a los
> Turcos retirados, y los mas muy mal heridos y atemorizados ... cuando sucedio la desgracia, que ... cargaron
> algunos a vna parte del bergantin con tanto peso que le hizieron trabucar."

- Defenders: 49, lost **7 killed = 14 %** and were not breaking; they were winning.
- Attackers (corsairs): ~100 ("two to one"), lost **10 killed ≈ 10 %**, "retirados ... atemorizados" — on the
  point of breaking. This fits `raiderBreakLoss` 0.15, not the defender value.
- End: the boat capsized from crowding to one side; nobody drowned; all retaken. Neither side's number ended it.
- Caveat: these were escaped slaves facing re-enslavement (and torture: three were hung by the feet on arrival),
  i.e. the most motivated kind of defender.

#### 1b. Gonçalo de Sintra on the isle of Naar (Arguin), 1445 [opened]

Zurara, _Guiné_ ch. XXVII (1841 ed. p. ~145). Thirteen men (Sintra "com doze homeês") were caught by the tide
on a sandbank:

> "ca os imiigos eram duzentos, e os nossos doze sem sperança de socorro, forom ligeiramente desbaratados.
> Ally foe morto Goncallo de Sintra ... E dos outros morrerom vij. ... Os cinquo se tornarom pera sua caravella."

- 8 of 13 killed (62 %), 5 got back. "ligeiramente desbaratados" = routed easily. Zurara says none
  turned back ("sem tornar nhuũ pee atras"), so the break, if any, was the last five swimming off.
- Odds 200:13. Gives a loss at the end, not at the moment of the break.

#### 1c. The adail Fernão Galego, Arzila, c. 1518 [opened]

_Anais de Arzila_ I, ch. XLIX, pp. 246-249. Heading: "Como Mulei Abrahem armou a Arzila com almogavares e
matou ao adail Fernão Galego com vinte de cavalo". The count had sent the adail "com trinta ou corenta de
cavalo" to cover the watchmen; he pursued past the ford he had been told not to cross, into 500 horse in ambush:

> "a qual saio da cilada com as lanças nos olhos aos dianteiros, e logo matarão ao adail Fernão Galego e
> viérão em alcanço até o porto, no qual alcanço matarão dezaseis homens de cavalo ... e é certo que do porto
> até Alfandequim matarão outros tantos se não fora pola muita valentia e sosego de Luis Valente".

- Expedition-side party of 30-40 horse broke **at the first contact, with the leader killed (~3 %)**, then lost
  ~20 (heading) in the pursuit = **50-67 %**. Same shape as Jorge Vieira 1510 (`raids.md` case 2, broke at ~19 %).
- This is the land "player side" (Portuguese garrison horse), not a ship crew.

#### 1d. Christian galley slaves who had seized a galliot, c. 1570s [opened]

Haedo, _Diálogo de los mártires_, f. ~192. The rowers of Mami Gancho's galliot rose at anchor and took it
almost without weapons. The rais came back in a boat "trayendo consigo hasta veynte y cinco escopeteros Turcos,
los quales disparando en los Christianos, mataron a dos y hirieron mas de veynte ... fueron forçados a baxarse
en los vancos y rendirse."

- Yielded at **2 killed + 20+ wounded** of a galliot's rowing crew (number not given; a galliot rowed
  ~40-60 men). Unarmed men against muskets. Shows that defenders without weapons yield at very low losses.
  Weak case for the game, which arms everyone.

### Cases without numbers (qualitative)

| #   | Case [all opened]                                                                                                            | Defender                                                          | What ended it                                                                                                                                                                                                                                                                                    |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1e  | Francisco de Soto's Mallorcan brigantine vs a galliot, Cape Ténès, Dec 1562 (Haedo, _Mártires_ f. ~154)                      | brigantine, "la gente menos en numero"                            | Christians were driving the Turks back when Soto "cayó entre los vancos do quebró vna pierna. Con el qual desastre, perdiendo animo los compañeros, apretaron con ellos los Turcos, de manera que entraron el vergantin y con muerte de algunos le rindieron". **Leader down → defender broke.** |
| 1f  | Rodrigo de Portuondo's 8 galleys vs 14 Algerian vessels, Formentera, 1529 (Haedo, _Epítome_)                                 | Spanish galleys, half their soldiers absent in Italy              | Portuondo "cayo muerto de vn arcabuzazo ... con cuya muerte afloxando los de su galera, ... al vltimo los entraron y rindieron". The others then yielded too. **Leader down → defender broke.**                                                                                                  |
| 1g  | 5 Portuguese caravels + 1 brigantine with Bu Hassun, vs Salah Rais's 40 vessels, Strait, Jul 1553 (Haedo, _Epítome_, f. ~67) | "hasta 300 hombres" given by João III                             | "se defendieron con mucho animo, hasta que siendo muertos muchos dellos, y los viuos todos heridos, al cabo de tres horas de la pelea, fueron entrados de la multitud". Fought to physical exhaustion; no count.                                                                                 |
| 1h  | Two Breton salt ships vs Murad Rais's 8 galliots, off Lagos, 1581 (Haedo, _Epítome_)                                         | two well-armed "naues"                                            | One was sunk by gunfire ("solamente se saluaron catorze personas"); the other, "viendo perdida su conserua, le fue forçoso rendirse". **Loss of the consort, not own losses**, ended it; the corsairs lost "muchos genizaros escopeteros".                                                       |
| 1i  | _Three Half Moons_, 38 men, vs 8 Turkish galleys, near Gibraltar, 1563 (Hakluyt "vol. 11", John Fox)                         | 38 English                                                        | Holed "vnder water", boarded; boatswain killed; "the prease and store of the Turkes was so great, that they were not able long to endure, but were so ouerpressed, that they could not wield their weapons". Overpowered, not a break. No count.                                                 |
| 1j  | _Madre de Dios_ carrack, 600-700 aboard, vs Burrough's squadron, off Flores, 1592 (Hakluyt "vol. 11")                        | Portuguese carrack                                                | After hours of gunnery and ~3 h of Crosse's _Foresight_ "alone", Crosse "had in that time broken their courages, and made the assault easie for the rest"; decks covered with "so many bodies slaine and dismembred". No count. Ransom/exchange, not slavery, awaited this crew.                 |
| 1k  | _Amity_'s two Spanish prizes, 1592 (Hakluyt "vol. 11"; crew figures already in `boarding.md`)                                | 126+ alive                                                        | New detail: "the one would haue yeelded, which was betweene winde and water" — the ship that was **holed** wanted to yield first; the other gave up under a threat of sinking. Hull, not headcount.                                                                                              |
| 1l  | Zurara, _Guiné_ ch. LXXII-LXXIII, c. 1446                                                                                    | 14 Portuguese (text "xviij"; translators' arithmetic 14) on shore | Ambushed by ~40 Moors, then 25 more from a second ambush. Did **not** break: "os xpaãos nom lhe voltarom as costas"; the Moors, "desarmados", fled after "alguũs de seus parceiros cayr, e casy os mais delles feridos". See §4.                                                                 |

### Reading

- Only one opened case gives the defender's loss **while still fighting**: Juan Ginovés 1579, 14 % dead
  and winning. Everything else gives either the final loss (Sintra 62 %, Galego 50-67 % incl. pursuit) or no number.
- The stated **triggers** of a defender's collapse in the new cases are, in order of frequency:
  leader killed or disabled (1c, 1e, 1f), loss of the consort or the hull (1h, 1k, 1i), being physically
  overwhelmed after hours (1g, 1i, 1j). None is "lost half its men". This matches the triggers `raids.md`
  found for raiders. R77 already folds the leader's death into the loss share and luck; the cases say that
  for defenders too, the break is event-driven.
- Land vs sea split. On land the Portuguese (player-side) parties broke as early as raiders did
  (Galego ~3 %, Jorge Vieira ~19 %), then lost 50-70 % in the pursuit. At sea, defenders facing slavery fought
  on to physical exhaustion (1g, 1i, Dolphin, Revenge) unless the leader fell (1e, 1f). So **one defender
  threshold for both land and sea is not what the sources show**. That is a SHAPE question, not a value.
- Motivation matters as the game assumes: escaped slaves (1a) and men facing the galleys (1g, 1i) fought on;
  crews expecting ransom yielded early (Amity prizes, `boarding.md`).

---

## 2. `pirateHullDamage` 0.1 per pirate per round

| #   | Case [opened unless marked]                                                         | Attacker                           | Duration         | Hull/rig damage                                                                                                                                                                             | Outcome                         |
| --- | ----------------------------------------------------------------------------------- | ---------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| 2a  | _Mary Marten_ of London vs 2 Algerian galleys, Cape de Gata, Jul 1582 (Hasleton)    | 2 galleys                          | short            | Galleys opened with "great shot and Muskets ... both our gunners were slaine, both with on shot"; "one of them had shot vs vnder water, whereby our ship was foundred before we perceiued". | **Sunk** by one holing shot     |
| 2b  | Breton salt ship vs Murad Rais, off Lagos, 1581 (Haedo, _Epítome_)                  | 8 galliots                         | not given        | "despues de gran bateria y combate de ambas partes, los turcos echaron a fondo vna de las dichas naues"                                                                                     | One **sunk**, the other yielded |
| 2c  | _Three Half Moons_, 1563 (Hakluyt, John Fox)                                        | 8 galleys                          | not given        | "the ship was very sore stricken and bruised vnder water"                                                                                                                                   | Boarded and taken               |
| 2d  | _Amity_ vs 2 Spanish ships, 1592 (Hakluyt)                                          | 2 armed merchantmen (not corsairs) | 5 h at < 1 cable | "diuers shot both in the hull of our ship, masts, and sailes, to the number of 32 great, besides 500 musket shot ... which we tolde after the fight"                                        | Ship fine; won                  |
| 2e  | Towerson's _Minion_ vs Portuguese at Mina, 1557 (Hakluyt "vol. 11"; printed "1577") | Portuguese armed ships             | 2 h+, night      | "shot him foure or fiue times thorow. They shot diuers times thorow our sailes, but hurt no man"                                                                                            | Broke off                       |
| 2f  | Armada 1588, for scale (Hakluyt "vol. 7")                                           | fleet                              | days             | Drake's ship "pierced with shot aboue forty times"; "some of them no lesse then two and twentie times"                                                                                      | No English ship lost            |

Reading:

- **The damage came from guns, not from the number of men.** Every hull hit in these cases is great shot
  (2a-2f). This confirms what round 1 and `boarding.md` said about the Centurion and the Dolphin.
- Outcomes are **bimodal**. A ship takes 20-40 great-shot hits and sails home (2d, 2f; Centurion), or one hit
  below the waterline foundered it (2a; 2b; 2c "bruised vnder water" before boarding). A per-man, per-round
  linear wear does not describe either mode.
- The only count usable as a rate is the Amity's **32 great-shot hits in 5 h ≈ 13 per 2-h round**, from two
  Spanish ships with ~126 men, with no structural failure. That is not corsairs, and "hits" are not "hull
  points", so it does not give a value.
- Dan's general remark (already in `boarding.md`) that corsairs fought only with 2-3:1 odds, and the
  corsairs' interest in an undamaged prize (round 1, [snippet]), point the same way: corsairs shot to frighten,
  but when they did hole a ship it sank (2a, 2b).

---

## 3. `tributeGold` 15 ducats per raider — payment at sea to be let go

Nothing found with a sum, after these attempts:

- Haedo (opened, grepped for "rescate", "rescatar", "alafia", "bandera"): the only on-the-spot ransom is
  **coastal**. Murad Rais at Lanzarote, 1585 (_Epítome_): landed "con 250 turcos escopeteros", took "mas de 500
  personas, con la madre, muger, y hija del Conde", then "se retiro con sus vajeles vn poco distante de alli,
  donde arbolo bandera de rescate. El conde ... acudio a rescatar aquellas sus dulces prendas". **No sum.**
  This is ransom of captives after a raid, the alafia practice of Lambert 2023, not a ship paying to pass.
- Hakluyt "vol. 11", Towerson 1557 [opened]: the English put French prisoners into a pinnace and released them
  at sea, "putting fifteene of them to the ransome of sixe crownes a man". This is a **per-captive release
  ransom at sea, 6 crowns per seaman**, paid by the captured to the captor. It is not a toll per attacker,
  and the parties are English vs French interlopers off Guinea. It does show that ordinary seamen's on-the-spot
  ransoms were small next to the 100-250 ducat Algiers captive prices (`ransom-2.md`).
- Hasleton 1582 [opened]: when the galleys appeared, "some of our company cryed to our maister to shew the
  Turkes letters, but he would not". The available "pass" was an Ottoman safe-conduct under the 1580
  capitulations, i.e. diplomatic, not a payment. The master's refusal led to the sinking (2a).
- Dan (opened, grepped "rançon", "composition", "passeport", "laisser aller"): passports appear only in
  treaties (1628 France-Algiers, Holland-Algiers, 1630 Salé). No at-sea payment.
- archive.org FTS [snippet]: "rançonner le navire", "ransomed the ship", "ransome of the ship",
  "rescatar el navío", "resgatar o navio" return 18th-19th-century cases (Guernsey bills, £3,000 in the
  Napoleonic war, etc.). One Spanish fragment, "los yngleses dixeron desde la mar: ¿queréis rescatar el navío y
  fragatas que os hemos tomado?", has no date or identifier. Tenenti, _Piracy and the Decline of Venice_
  (`bwb_KV-445-960`), FTS for "ransom": only captive and "ransom flag" fragments.

So the practice of paying corsairs on the spot is attested for **captives after coastal raids** (Haedo 1585,
Lambert 2023) and for **seamen released at sea** (Towerson 1557, 6 crowns each). No source gives a sum per
corsair, or for a ship let go with its crew.

Crew-size anchor for corsair numbers (useful for the "per raider" base) [opened]: Haedo, _Topographia_
cap. XXI "De los cossarios", f. ~16v-17: two soldiers ("leuantes") sat on each bench-side platform, "de manera
que lleuando vna galeota veynte remos o vancos por vanda, lleua otras tantas vancadas, y en ellas quarenta
soldados". So **~40 fighting men for a 20-bench galliot**, doubling with size. (The wording can be read as
40 per side; I read it as 40 in all.) The game's 20-60 pirates matches galliot-to-small-galley crews.

---

## 4. `chargeShock` 0.1 / `surpriseFactor` 2 — how often did surprise produce a break?

No chronicle gives a count of ambushes that succeeded vs failed. The _Anais de Arzila_ uses "cilada" about
115 times (both volumes). Most are routine (watchmen "descobrir" the usual ambush spots each morning) and an
outcome cannot be read from most passages, so I did not tally them.

What the opened texts do say:

- **Ambushes often failed because they were detected.** _Anais_ I, ch. XLIX, p. 247, on the Moorish raiding
  leaders Arroaz and Amelix: "ainda que o conde muitas vezes armou a este Arroaz e a Amelix, que o socedeu,
  nunca os pode colher". The same for the other side, _Anais_ I p. ~378: an almocadem who "posto que muitas
  vezes o conde lhe armase, nunca caio, vendo as mais das vezes os nosos e descobrindo as ciladas". Zurara,
  _Guiné_ ch. XXVII: Sintra's two raids "were perceived; so that when they landed in the morning they only
  found one girl" ("forom sentidos"). Surprise was the aim of almost every raid and was often lost.
- **When an ambush was sprung on light horse, the ambushed party usually broke at once.** New: Fernão Galego
  c. 1518 (§1c, broke at the first charge, leader killed). Already in `raids.md`: Algarrafa 1509, Fonte do
  Amame, Granada 1491.
- **Counter-case: armoured men on foot did not break.** Zurara 1446 (§1l): 14 Portuguese, ambushed in turn by
  ~40 and 25 unarmoured Moors, held, and the ambushers fled after a few dead ("como eram desarmados").
  Sintra 1445 (§1b) was overrun, but at 200 to 13.

So the cases support the **shape** of R77 (surprise raises the chance of an immediate break; armour/numbers
temper it) but give no rate. The sprung-ambush cases are a selected set (chroniclers wrote down the notable
ones), so even a tally of them would not be a probability.

---

## Recommendations (conservative)

| Key                 | Current | Recommendation                                                                                                                                                                                                                                                                                                                           | Grade                                                                                                                                                                                                                            |
| ------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defenderBreakLoss` | 0.5     | Keep the value. Add to the source note: Juan Ginovés 1579 (14 % dead, still winning — another lower bound); Soto 1562 and Portuondo 1529 broke when the leader fell (no count); Galego c. 1518 on land broke at ~3 % (leader killed). No opened case gives a defender's loss at the moment of breaking at sea.                           | **keep `unverified`**. A `qualitative` range would have to be "~0.03-0.2 on land (Galego, Vieira); at sea ≥ 0.14-0.42 lower bounds (Ginovés, Dolphin) or triggered by leader/hull" — two different quantities, so not one value. |
| `pirateHullDamage`  | 0.1     | Keep. The sources say hull damage came from **guns** and was **bimodal** (20-40 hits survivable — Amity 32 in 5 h, Armada 22-40; or one hit below the waterline sinks — Mary Marten 1582, Breton ship 1581). Per-pirate scaling has no support. If changed, it is a SHAPE change (damage per gun / chance of a holing hit), not a value. | **keep `unverified`**                                                                                                                                                                                                            |
| `tributeGold`       | 15      | Keep. Still no sum for a ship paying to be let go. Nearest [opened] numbers: 6 crowns per released seaman (Towerson 1557, English captors); ransom flag after a coastal raid, no sum (Haedo, Lanzarote 1585). Corsair crew anchor: ~40 soldiers per 20-bench galliot (Haedo).                                                            | **keep `unverified`**                                                                                                                                                                                                            |
| `chargeShock`       | 0.1     | Keep.                                                                                                                                                                                                                                                                                                                                    | **keep `unverified`**                                                                                                                                                                                                            |
| `surpriseFactor`    | 2       | Keep. Direction supported (sprung ambushes broke light horse: Galego, Algarrafa, Amame); counter-case where armoured foot held (Zurara 1446); ambushes frequently detected (Arroaz/Amelix "nunca os pode colher"). No rate.                                                                                                              | **keep `unverified`**                                                                                                                                                                                                            |

Structural notes for SHAPE.md (not tuning):

1. Defender break at sea is triggered by **leader down** (Soto 1562, Portuondo 1529) or **hull/consort lost**
   (Breton 1581, Amity prizes 1592), much more than by headcount. R77 already rolls the leader's death into
   luck; hull state does not enter the break roll at all.
2. **Land vs sea defenders differ**: Portuguese horse broke like raiders (early, then lost most in the
   pursuit); ship crews facing slavery fought to exhaustion. One `defenderBreakLoss` for both is a modelling
   choice the sources do not back.
3. Hull loss is gun-driven and bimodal (see §2).

## Dead ends (time-boxed)

- Dan, _Histoire de Barbarie_: re-grepped (`se rendre`, `rançon`, `composition`, `passeport`, `laisser aller`,
  soldier counts). Only treaty passports and captive ransoms; no new sea fight with counts.
- Tenenti and Andrews (archive.org lending copies `bwb_KV-445-960`, `bwb_W8-BSW-798`): the FTS endpoint returns
  one-line fragments only [snippet], e.g. Tenenti: "the light galleys put up almost no resistance", "Fifty
  pirates were killed and forty-four taken alive", "Their crew was three or four times that number [of guns]".
  None usable as [opened]. Andrews not queried further.
- Hakluyt, all 13 Gutenberg volumes grepped for "yeelded/rendred" + casualties, "ransome/composition",
  "shot thorow": no further defender-break count beyond those above.
- Not reached: Purchas (Rawlins 1622 is an escape, not a surrender), Damião de Góis, Barros, Gaspar Correia,
  Gaspar Frutuoso (Azores corsair ransoms might contain a ship-ransom sum; worth a later try).
- Zurara _Guiné_ could support a rough tally of raids "sentidos" (detected) vs surprised, but that measures
  how often surprise was achieved, not how often it caused a break, so I did not attempt it.
