# Boarding / ship-fight records c. 1450-1640 vs the round model (round 2)

Scope: test `boardingFrontage` F = 12, pirateLethality 0.12, merchant (player) lethality 0.1,
`routRatio` 0.5 against engagement records that give crews, losses, duration and outcome.
Round 1 (`docs/research/2026-10-09/combat.md`) already had the Centurion 1591 and Pierre Dan's polacre.

Legend: **[opened]** = primary text read in full this session; **[S]** = secondary read (named);
**[mem]** = background knowledge, not re-verified.

Texts opened:

- Hakluyt, _Principal Navigations_ (MacLehose ed.), Project Gutenberg: vol. 7 = PG #9148
  (https://www.gutenberg.org/ebooks/9148), vol. 11 = PG #12693 (https://www.gutenberg.org/ebooks/12693).
- _The Dolphins Danger and Deliverance_ (London, Henry Gosson, 1617; "set forth by the appointment of M.
  Edward Nichols, being Master"), EEBO-TCP A13440,
  https://raw.githubusercontent.com/textcreationpartnership/A13440/master/A13440.xml ; the rival pamphlet
  _A fight at sea famously fought by the Dolphin of London_ (1617), EEBO-TCP A20592, has the same casualty sentence.
- Pierre Dan, _Histoire de Barbarie et de ses corsaires_ (Paris, 2nd ed. 1649), archive.org
  `histoiredebarbar00danp` djvu text, bk 3 ch. 1 (pp. 299-301) and the Tripoli chapter (p. 254).

## Model arithmetic used

Expected loss per 2-h round to side A = min(N_B, 12) x lethality_B. Whenever the enemy has >= 12 men
this is a constant: **1.44/round** inflicted by pirates (0.12), **1.2/round** by merchants (0.1).
Luck (+-50 %) is symmetric, so expectations are used. Rounds = hours / 2.

The rout rule (leave at 50 % of starting headcount) means a 150-man attacker must lose 75 men; at
1.2/round that is **~62 rounds (~5 days)**; a 250-man ship needs ~104 rounds.

## Cases

### 1. Centurion of London vs 5 Spanish galleys, Straits, Easter 1591 [opened, round 1]

48 "men and boys" vs galleys (pamphlet: "five or six hundredth" per galley, inflated). 5.5 h. 4 killed,
10 hurt. Galleys broke off. Attacker losses uncounted. This is the case F = 12 was fitted to.

### 2. Dolphin of London vs 5 Algerian men-of-war + a saettia, off Sardinia, 12 Jan 1616/17 [opened]

- Defenders: "36. Men and 2. Boyes", 19 guns + 5 murderers.
- Attackers, attacking in sequence: ship 1 "about 250. men" (boarded on the larboard quarter, "they staid
  aboord vs halfe an hower"; that encounter 2-2.5 h); ships 2+3 "about two hundred & fifty men" each,
  boarded both quarters, 1.5 h; ship 4 "at the least two hundred and 50. men", beaten off by gunfire;
  ship 5 "500. tunnes with 650. men", boarded starboard, fired the Dolphin with wildfire, then fell astern.
- Duration: title "fought with them 5. houres and a halfe".
- Losses: "sixe Men and one Boy, which were killed outright, and there were hurt eyght men and one Boy more".
  The name list adds 4 more dead of wounds within days -> **11 dead, 5 maimed survivors, 16/38 = 42 %**.
  Causes in the list are mostly great shot ("his head shot off", "one arme shot off ... then after hee was
  kild with a shot"), one musket, burns from wildfire. Little evidence of hand-to-hand deaths.
- Attackers: "the Lord doth know what damage we put them to, and what number wee slew"; of ship 1, "we had
  not left them one man aliue from their maine-maſt forward". Each attacker ungrappled "to lay their ships
  by the lee to stop their leaks" — they broke off because of **hull damage**, not headcount.
- Outcome: attackers withdrew; Dolphin repaired at Cagliari.

### 3. Sainte Marie Bonaventure (Marseille polacre) vs Tripoli corsair (Dan, bk 3 ch. 1, pp. 299-300) [opened]

- 14 vs "plus de quatre-vingts dix Turcs" on a 25-gun ship; grappled, boarders came over "à la faveur du
  pont de cordes" (the anti-boarding net).
- "après quatre heures de combat ... [les ennemis] furent contraints de se retirer honteusement, après auoir
  perdu quantité des leurs, qui furent ou blessez, ou noyez, ou taillez en pièces"; defenders "estoient tous
  blessez; mais si fauorablement, que pas vn ne mourut, & ne demeura estropié".
- Undated (Dan was in Algiers 1634-35; he says he saw them received at Marseille), so c. 1620s-30s.
- Same chapter, general statement: corsairs attack only "deux ou trois vaisseaux contre vn, ou du moins quelque
  grand nauire contre vn fort petit"; Christians with munitions "ne craignent point vaisseau pour vaisseau".

### 4. Primrose of London vs the Corregidor of Biscay, Bilbao, 26 May 1585 [opened, Hakluyt vol. 7]

- Defenders 28 ("eight and twentie English men against 97 Spaniards"); attackers: a ship-boat of "seuentie
  persons being Marchants and such like", a pinnace of 24, plus the corregidor's party — armed with rapiers,
  a seizure by officials rather than soldiers.
- Short evening skirmish (<1 round). English: "onely one English man was then slaine ... and sixe other hurt".
  Spanish: "there returned but a small companie of them, neither is it knowen as yet how many of them were
  slaine or drowned"; 4 taken prisoner incl. the corregidor.
- Outcome: boarders routed almost at once.

### 5. Cinco Chagas carrack vs 3 Earl of Cumberland privateers, off Faial, June 1594 [opened, Hakluyt vol. 11]

- Attackers: 3 ships, "420 men of al sorts" (~140 each). Defenders: "not now aboue 150 white men, but Negros
  a great many" (Portuguese survivors' statement), barricaded ("had Barricados made").
- Boarding: "the time we lay aboord might be two houres" (1 round). The Sampson's boarding party: "I had sixe
  men presently slaine and many more hurt, which made them that remained vnhurt to returne aboord, and would
  neuer more giue the assault." Mayflower's captain "slaine at the first comming vp"; Exchange's captain shot
  in both legs, after which no one led his men.
- Outcome: carrack fired (by English gunfire), burned and blew up; most aboard died by fire/drowning
  (not combat). Attackers' boarding failed.

### 6. Revenge vs the Spanish Armada at Flores, 31 Aug-1 Sep 1591 [opened, Hakluyt vol. 7, two accounts]

- Ralegh's _Report_: "one hundreth free from sicknes, and fourescore and ten sicke"; Spanish ships "in some two
  hundred besides the mariners; in some fiue, in others eight hundreth"; "fifteene houres fight, the assault of
  fifteene seuerall Armadas, all by turnes aboord him"; "fortie of her best men slaine, and the most part of the
  rest hurt"; Spanish "slaine and drowned ... well neere one thousand" (citing a captured Spanish captain).
  Ship with "neuer lesse then two mighty Gallions by her sides".
- Linschoten (Dutch, at Terceira, hearsay): "fighting with them at the least 12 houres"; Spanish "lost in
  fighting and by drowning aboue 400 men, and of the English were slaine about 100".
- Outcome: Revenge surrendered on terms when powder was gone and ship sinking. Heavy gunnery
  ("eight hundred shotte of great Artillerie").

### 7. Amity of London takes two Spanish ships, off Iberia, 26 Jul 1592 [opened, Hakluyt vol. 11]

- Attacker (English privateering merchantman) "but 42 men and a boy"; defenders: "126 persons liuing, and 8 dead,
  besides those which they themselues had cast ouerboord".
- 5 h gunnery at under a cable, then "lying aboord about an houre" on one ship (~3 rounds).
- English "2 were killed and 3 wounded". Defenders surrendered under threat of sinking.

### 8. Ten Levant Company ships vs 12 Spanish galleys, Straits, 24 Apr 1590 [opened, Hakluyt vol. 7]

- Galleys "two or three hundred men in ech Gallie". "sixe houres and somewhat more"; "there was not one man
  of vs slaine". No boarding. Galleys withdrew, "so sore battered". One Fleming yielded without fighting.

### 9. Five Turkey Company ships vs 11 galleys + 2 frigates, Pantelleria, 13 Jul 1586 (Philip Jones) [opened, Hakluyt vol. 7]

- "after 5. houres spent in the battell, they withdrew themselues ... with the losse onely of two men slaine
  amongst them all, and another hurt in his arme". Three galleys near sinking. No boarding. English crews not given.

### 10. Malta galleys take 3 Tripoli ships, 9 June 1638 (Dan, p. 254) [opened]

- "après vn combat si furieux & si sanglant, que de leur part il y demeura prés de cent personnes de tuez, au
  nombre desquelles il y auoit neuf Cheualiers, & de ces Barbares en furent tuez plus de deux cens". Captured.
- No crew sizes or duration. Out of period (1638), kept as an order-of-magnitude point for galley boarding of
  sailing ships.

### 11. Six Malta galleys take the Ottoman galleon (Sultana), 28 Sep 1644 [S: Wikipedia "Action of 28 September 1644", citing Anderson 1952, Ganado 2019, Setton 1991]

- 400+ Hospitaller boarders vs 600+ aboard (incl. passengers). 5 h (Freller) / 7 h (Anderson) / 8 h (Setton).
- Hospitallers 82 killed + 170 wounded excl. rowers (Anderson) or 125 killed + 262 wounded (Ganado);
  Ottomans ~220 killed, ~380 captured. Galleon boarded with difficulty "since its decks were higher than their galleys".
- Not opened; out of period.

### 12. Lepanto 1571, scale check [mem]

~200 vs ~230 galleys, c. 4-5 h; Holy League ~7,500 killed; Ottoman dead far higher. -> ~35 killed per
League galley in ~2.25 rounds, i.e. ~16/round/galley. Fleet battle, not prize-taking; for scale only.

## Model vs record (expected values, F = 12)

| #   | Case              | Crews (def / att)                 | Rounds | Def. killed: model / record             | Att. killed: model / record              | Outcome record                       |
| --- | ----------------- | --------------------------------- | ------ | --------------------------------------- | ---------------------------------------- | ------------------------------------ |
| 1   | Centurion 1591    | 48 / ~150 (est.)                  | 2.75   | 4.0 / **4** (+10 hurt)                  | 3.3 / "many"                             | attackers left                       |
| 2   | Dolphin 1617      | 38 / 250+250+250+250+650 (seq.)   | 2.75   | 4.0 / **7** outright, **11** incl. DoW  | 3.3 / "not one alive" forward of mast    | each attacker left after 0.5-2 h     |
| 3   | Dan polacre       | 14 / 90+                          | 2      | 2.9 / **0** (all lightly wounded)       | 2.4 / "quantité" killed/drowned          | attacker left                        |
| 4   | Primrose 1585     | 28 / ~97                          | <=0.5  | <=0.7 / **1** (+6 hurt)                 | <=0.6 / most of ~90 lost? (unknown)      | attackers routed at once             |
| 5   | Cinco Chagas 1594 | ~150 + slaves / 420 (3 ships)     | 1      | 1.2 / unknown (combat)                  | 1.4 / **>= 6** in one party, + 1 captain | boarders broke after ~6 killed       |
| 6   | Revenge 1591      | 100 fit / thousands, 2+ alongside | 6-7.5  | 8.6-10.8 / **40** (R) - **100** (L)     | 7.2-9 / **400** (L) - **~1000** (R)      | defenders surrendered, out of powder |
| 7   | Amity 1592 (att.) | >= 134 / 43                       | ~3     | 3.6-4.3 / **>= 8** (+ thrown overboard) | 3.6 / **2** (+3 hurt)                    | defenders surrendered at >= 6 % dead |
| 8   | 10 ships 1590     | ? / 12 galleys x 200-300          | 3      | (no boarding) / **0**                   | — / "great abundance" (hearsay)          | galleys withdrew                     |
| 9   | 5 ships 1586      | ? / 11 galleys                    | 2.5    | (no boarding) / **2** (whole fleet)     | — / unknown                              | galleys withdrew                     |
| 10  | Malta 1638        | ? / ?                             | ?      | — / **>200** (def.)                     | — / **~100** (att.)                      | captured                             |
| 11  | Sultana 1644 [S]  | 600 (incl. passengers) / 400+     | 2.5-4  | 3.6-5.8 / **~220**                      | 3-4.8 / **82-125**                       | captured                             |

(Model "att. killed" uses the defenders' lethality: 0.1 for merchant crews; for #7 the English privateer is the
attacker and the Spanish defenders are given 0.1.)

## Reading

**Small merchantman defences (#1-4, #7): F = 12 x 0.12 is in the right order of magnitude for the
defender's dead.** Defender deaths per 2-h round: 1.45 (Centurion), 2.5-4 (Dolphin), 0 (Dan), ~1-2
(Primrose), 0.7 (Amity's own loss). The model's 1.44 sits in the middle; the spread is about x0-3, which
the +-50 % luck does not cover (Dan's 0 and Dolphin's 11 are both outside it), but with 5 cases that
is not a strong signal. Two cautions:

- Much of the killing was **gunfire, not boarding** (Dolphin's dead list; Centurion's "shot through her main
  Mast, and slew four"). #8-9 show galleys engaging merchantmen for 5-6 h with **0-2 dead** when they did not
  grapple. So the F x lethality fit is really "a ship fight between a small merchantman and corsairs", not
  "boarders at the rail".
- Attacker losses are **never counted** in any small case — only "many", "quantité", "great abundance".
  The merchant lethality 0.1 is therefore untested; every narrator implies attackers lost far more than
  defenders (Primrose, Dolphin, Dan, Cinco Chagas), i.e. if anything defender lethality should exceed the
  attacker's, the reverse of the 0.1 / 0.12 table. This is also the survivor-story selection bias: these
  pamphlets exist because the merchantman won.

**Large fights (#6, #10, #11, #12): F = 12 is far too small.** Revenge lost 5-17/round, the Sultana ~60/round,
the Hospitallers 20-35/round, Lepanto ~16/round per galley. The model caps everything at 1.2-1.44/round,
so it is 4-40x low on defenders and 20-100x low on attackers. In these fights several hulls lay alongside at
once ("neuer lesse then two mighty Gallions by her sides"; six galleys at the Sultana). This supports the
option R75 already lists: frontage should scale with ship size and with the number of hulls in contact,
roughly 12 per hull-pair rather than 12 per fight. With the game's pirates capped at 60 men this mostly
matters for the nau, but the nau-beats-everything result (§30) partly comes from this cap.

**Rout: the 50 % rule is the clearest misfit.**

- Attackers in every opened case broke off in 0.5-6 h, long before 50 % losses would be reachable at the
  model's rates (Centurion's galleys would need ~62 rounds). Under the model none of #1-3 would end.
- The trigger stated in the texts is **hull damage / fire / sinking** (Dolphin "to stop their leaks", 1586
  "to holde vp her side for feare of sinking", 1590 "so sore battered"), or **leaders down** (Cinco Chagas:
  captain slain/wounded, party "would neuer more giue the assault" after ~6 killed, i.e. <5 % of a ~140 crew).
- The only numeric attacker break (Cinco Chagas) is well under 10 % killed. Corsairs attacked only with
  2-3:1 odds (Dan) — a raider stops when the fight stops paying.
- Defenders who faced slavery fought to 40-50 % casualties (Dolphin 42 % dead+maimed; Revenge 40-100 dead
  of 100 fit, "most part of the rest hurt") and then surrendered only when out of powder / sinking.
  Defenders who expected ransom yielded early (Amity's prizes at >= 6 % dead; the Fleming in 1590 at
  0 %). So 0.5 for a defender is not absurd; 0.5 for a raider is.

## Recommendations

1. **Grades: nothing moves to `measured` or `qualitative` on the strength of this.** Five small cases agree
   on defender deaths to within x3, but attacker deaths are never counted, and the agreement is partly
   gunfire. `boardingFrontage`, `pirateLethality`, `playerLethality` stay `unverified`. Write the cases
   into the table comments as the reason.
2. `routRatio`: keep `qualitative` (round 1), now with period sources for the direction: raiders/attackers
   withdraw after a few hours or a few deaths (Dan; Hakluyt 1586/1590; Cinco Chagas; Dolphin). A split
   rout (attacker ~0.85-0.9 headcount, defender ~0.5-0.6) would reproduce the cases better, but no case
   gives a number beyond Cinco Chagas; this is a design call.
3. Structural (SHAPE, not tuning) — in order of how much they would change the fit:
   - **Attacker disengagement by time or hull**, not only headcount (every case ends this way).
   - **Frontage per hull in contact / per ship size** (needed only for big ships and fleets).
   - Optionally a stand-off gunnery phase with very low crew loss (#8-9), and surrender-without-fight as
     the modal outcome (Dan; round 1).
4. Next sources if more is wanted: Tenenti, _Piracy and the Decline of Venice 1580-1615_ (Venetian
   depositions with crews and losses); K. R. Andrews, _Elizabethan Privateering_ (High Court of Admiralty
   depositions); Anderson, _Naval Wars in the Levant_; Haedo, _Topographia_ (corsair crew sizes, 1612).
   None was opened here.
