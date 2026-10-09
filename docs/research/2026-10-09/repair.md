# Ship repair cost and time: source check (c. 1490–1520)

> **Decision (#45):** flat `repairGoldPerPoint` 2.5 and `repairHoursPerPoint` 1, both `unverified` — hull points are abstract. Copied from a research scratchpad on 2026-10-09; quotes are from djvu/OCR text with light cleanup.

Research notes, 2026-10-09. Target: `repairGoldPerPoint` (now 5 ducats/pt, `unverified`) and `repairHoursPerPoint` (now 1 h/pt, `unverified`) in `src/content/game/repair.tuning.ts`.

Conversions as in `provisions.md` / `prices.md`: 1 ducat = 375 mrs; 1 cruzado ≈ 390–400 réis ≈ 1 ducat.

Tags: **[opened]** = I read the passage in the source text myself. **[snippet]** = seen only in a search result. **[mem]** = from memory, not checked this session.

> **Hull points are abstract.** No source measures "hull points". Every number below is a proposal for mapping a real quantity (a refit bill as a share of the purchase price, a refit duration) onto the game scale. Nothing here can carry a grade above `qualitative`, and the mapped per-point values should stay `unverified`.

---

## 1. Refit cost vs purchase price: Magellan 1518–19 [opened]

Navarrete, _Colección de los viages…_, t. IV (1837), Núm. XVII, "Relación del coste que tuvo la Armada de Magallanes" (AGI, Papeles del Maluco, leg. 1), pp. 162–167. Text: https://archive.org/download/coleccindelosv_04nava/coleccindelosv_04nava_djvu.txt

The five naos were bought second-hand at Cádiz and Sanlúcar, brought up to Seville, beached and careened there. Navarrete's introduction (p. 4 of the "Viages al Maluco" narrative): "Se carenaron en Sevilla". The account itemises the work **fleet-wide only**. There is no per-ship breakdown of the refit.

### Purchase (p. 162)

Each price includes "sus aparejos y batel" (rigging and boat).

| Ship        | Toneles | mrs                          |
| ----------- | ------- | ---------------------------- |
| Concepción  | 90      | 228,750                      |
| Victoria    | 85      | 300,000                      |
| San Antonio | 120     | 330,000                      |
| Trinidad    | 110     | 270,000                      |
| Santiago    | 75      | 187,500                      |
| **Total**   | **480** | **1,316,250** (3,510 ducats) |

→ **2,742 mrs/tonel ≈ 7.3 ducats/tonel** fleet average (range 2,455–3,529 mrs/tonel by ship).

Unit caveat: Navarrete's note on the same table says toneles and toneladas stood "en razón de cinco á seis … diez toneles hacian doce toneladas". The summary (p. 181) counts the fleet at "445 toneladas, cinco mas ó menos". Treating one game ton as one tonel is a convention, not a conversion.

### Hull work (pp. 163–166)

| Item (quote abridged)                                                                                                                                                                  | p.    | mrs         |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ----------- |
| "jornales de hacer la fosa y en varar las naos en tierra"                                                                                                                              | 163   | 13,482      |
| "jornales de la carpintería que se hizo en las cinco naos"                                                                                                                             | 163   | 104,244     |
| "jornales de los galafates que galafetearon las dichas naos"                                                                                                                           | 163   | 129,539     |
| "jornales de los aserradores que han serrado tablazón y madera"                                                                                                                        | 163   | 6,790       |
| "madera de vigas y tablazón … para reparo y adreszo de las dichas naos"                                                                                                                | 163   | 175,098     |
| "clavazon que se ha gastado en el adreszo … y asi en lo que lleva de respeto para el viage"                                                                                            | 163   | 142,532.5   |
| "estopa … para galafetear … y asi lo que llevan de respeto"                                                                                                                            | 163–4 | 31,670      |
| "breo y alquitrán y aceite … para galafetear y brear … y asi el breo que lleva de resguardo"                                                                                           | 164   | 72,267.5    |
| "sebo … para ensebar las dichas naos, y lo que llevan para el viage"                                                                                                                   | 164   | 53,852      |
| "bombas, y clavos y tachuelas"                                                                                                                                                         | 164   | 15,475      |
| "ocho cuadernales … para varar las naos"                                                                                                                                               | 165   | 4,204       |
| tres cucharas para el breo; seis azadones "para hacer la fosa para vararlas"; 76 cueros "para brear y ensebar"; chumiza "para quemar las dichas naos al tiempo del galafetear y brear" | 165–6 | 7,946       |
| **Hull total**                                                                                                                                                                         |       | **757,100** |

Ratios to the 1,316,250 mrs purchase:

| Scope                                                                                                                                                                 | mrs       | % of purchase |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------- |
| Labour + timber only (fosa/beaching, carpenters, caulkers, sawyers, timber)                                                                                           | 429,153   | **33%**       |
| All hull items above (includes spare nails, oakum, pitch, tallow carried for the voyage)                                                                              | 757,100   | **58%**       |
| Rigging and sails, for comparison: canvas 149,076; sail thread and sewing 32,825; masts and yards 37,437; blocks 34,672.5; cordage and hemp 324,170.5; anchors 42,042 | 620,223   | 47%           |
| "jornales de ribera, y mantenimiento y sueldo á la gente de las naos mientras se adreszaron y cargaron" (p. 165–6)                                                    | 438,335.5 | 33%           |

The last line is yard labour plus crew pay and food during refit **and loading**. It cannot be split, so I leave it out of the hull share. In the game the crew already eats provisions while in port.

Labour alone (beaching, carpenters, caulkers, sawyers) = 254,055 mrs ≈ 680 ducats for five ships ≈ 136 ducats a ship.

### What this measures, and what it doesn't

- It is a **deep pre-voyage refit** of used ships for a two-year voyage, not repair of known damage. It is the best available stand-in for "0 → full hull", but it is not that.
- Fleet-wide only. Per ship ≈ 86,000 mrs (labour + timber) to 151,000 mrs (all hull) ≈ **230–400 ducats per ~96-tonel nao**.
- The upper figure includes spares carried for the voyage, so it overstates the repair itself. The lower figure leaves out the consumables actually used on the hulls. The truth for the hulls themselves lies in between.

**Grade if used as "full repair ≈ X% of ship price": `qualitative`.** The source states a refit bill and a purchase price; it does not state a repair-from-damage cost.

---

## 2. Duration

**A. Pinta, 1492: rudder and leak, repaired without a shipyard [opened]**
Navarrete t. I (1825), Diario de Colón, pp. 156–158. Text: https://archive.org/download/coleccindelosv01nava/coleccindelosv01nava_djvu.txt

- 6 Aug: "Saltó ó desencajóse el gobernalle á la carabela Pinta".
- 8 Aug: Columbus wanted to leave her at Gran Canaria "porque iba mal acondicionada del gobernalle y hacia agua".
- 9 Aug entry (summarising the following weeks): "adobaron muy bien la Pinta con mucho trabajo y diligencias … Hicieron la Pinta redonda, porque era latina; tornó á la Gomera Domingo á 2 de Setiembre con la Pinta adobada."

→ **≤ 24 days** (9 Aug – 2 Sept) for a caravel with a broken rudder and a leak, **including** re-rigging from lateen to square and the time Columbus spent waiting at Gomera before coming over. The actual work days are not separated. It shows the order of magnitude for a small ship: weeks, not days.

**B. Trinidad at Tidore, 1521–22: keel leak, careening [opened, but Navarrete's narrative]**
Navarrete t. IV, narrative § "Viage primero de Magallanes", p. 81 [OCR header "PRIMERO DE MAGALLANES. Si"]; repeated in the introduction p. lxvii:

> "determinaron dar de quilla á la nao para carenarla; pero esto exigia la detencion de tres meses"

§ VII (p. 98) dates the work "Enero, Febrero y Marzo" 1522, with Tidore labour helping. This is Navarrete's synthesis citing Herrera, Pigafetta and doc. 27; it is not an account entry. It is also a careening **far from a shipyard**, with the cargo unloaded first.

→ **~3 months** for a 110-tonel nao, worst case (no yard, full unload, keel leak).

**C. Seville 1518–19 [mem]**
The ships reached Seville in 1518 and the fleet left Seville in August 1519. That year covers all outfitting, financing delays and the Portuguese dispute, so it is useless as a repair time.

**Not obtained (dead ends, time-boxed):**

- Fernando Oliveira, _Livro da Fábrica das Naus_ (c. 1580): manuscript BNP COD 3702; editions 1898 (Lopes de Mendonça) and 1991 (Academia de Marinha). No full text found online in the time box [snippet: shiplib.org/?p=1017]. It is a construction treatise and probably has no repair durations anyway.
- Lavanha, Regimento dos Armazéns, Gaspar Correia: not searched in depth. The Casa da Índia archive was lost in 1755 [snippet], so Lisbon refit accounts survive mostly indirectly.
- Ingenieros Navales (Galicia) "Capítulo 4: Los preparativos de la expedición" (PDF, https://galicia.ingenierosnavales.com/wp-content/uploads/2022/02/Capitulo-4-Los-preparativos-de-la-expedicion.pdf) may give the Seville beaching dates and the crew sizes of carpenters and caulkers. The text layer could not be extracted here (no pdftotext/poppler). **Worth one more try** with a PDF tool.
- Searches for Seville/Casa de Contratación careening costs in ducats: nothing usable.

---

## 3. Battle damage ("tapar los agujeros") — dead end

Nothing opened. Candidate sources, untried: Navarrete t. V (Loaísa and Saavedra fleets, which refitted after storms and fights in the Moluccas); Gaspar Correia, _Lendas da Índia_ (Portuguese fleet refits at Cochin and Goa after battles). Until something turns up, battle damage should cost the same per point as any other damage.

---

## 4. Mapping to the game

Assumptions (all `unverified`):

- Ship price = **7.3 ducats per ton** (Magellan fleet average, one game ton = one tonel). A 220 t nau extrapolated linearly is outside the 75–120 range. Bigger ships likely cost more per ton, so this is a lower bound for the nau.
- Full repair (0 → max hull) = **33–58% of ship price** (§1 range). Middle proposal **40%**.
- Ship types: latina ≈ 60 t / 90 pts, redonda ≈ 90 t / 120 pts, nau = 220 t / 200 pts.

| Ship    | t   | Price (d) | Full repair 33% | 40% | 58% | d/pt at 33–58% | d/pt at 40% |
| ------- | --- | --------- | --------------- | --- | --- | -------------- | ----------- |
| latina  | 60  | 439       | 145             | 176 | 255 | 1.6–2.8        | **2.0**     |
| redonda | 90  | 658       | 217             | 263 | 382 | 1.8–3.2        | **2.2**     |
| nau     | 220 | 1,608     | 531             | 643 | 933 | 2.7–4.7        | **3.2**     |

### Recommendation

**`repairGoldPerPoint`: 2.5 ducats/pt, grade `unverified`.**

- One scalar fits all three hulls within the 33–58% band: latina 225 (51% of price), redonda 300 (46%), nau 500 (31%).
- The current 5 d/pt makes a full latina repair 450 d ≈ 100% of its price, i.e. above the top of the band. On the nau, 5 d/pt (1,000 d, 62%) is just above the top.
- A per-ship formula (`repairCost = 0.4 × shipPrice × damage / maxHull`) would follow the source better than a flat rate. That is a design choice, not a sourcing one.
- Source note for the table: "Magellan 1519 refit of 5 used naos: hull labour+timber 33%, all hull items 58% of purchase price (Navarrete t. IV pp. 162–166). Mapping to points assumes full repair ≈ 40% of price at 7.3 d/tonel."
- Do not grade it `qualitative`: the source quantity is a refit share, and "per hull point" goes through two assumptions (hull scale, tonel = ton).

**`repairHoursPerPoint`: keep 1 h/pt or raise to 2–3, grade `unverified`.**

- At 1 h/pt a full nau repair takes 200 h ≈ 8 days and a latina ≈ 4 days. At 3 h/pt: nau 25 days, latina 11 days.
- Pinta (≤ 24 days, no yard, with re-rigging) and Trinidad (~3 months, no yard, full unload) are both upper bounds made under worse conditions than a shipyard. A yard repair of a few days to a few weeks fits both without being pinned by either.
- No source gives days per amount of damage, so there is no basis to pick a precise rate. If the hour cost is meant to matter in play, 2 h/pt (nau ~17 days, latina ~7.5) sits in the middle.

---

## Sources

- Navarrete t. IV (1837), Núm. XVII, pp. 162–167, 180–181; narrative pp. 4, 81, 98, lxvii. https://archive.org/download/coleccindelosv_04nava/coleccindelosv_04nava_djvu.txt [opened]
- Navarrete t. I (1825), Diario de Colón, pp. 156–158. https://archive.org/download/coleccindelosv01nava/coleccindelosv01nava_djvu.txt [opened]
- shiplib.org entry for Oliveira's _Liuro da Fabrica das Naos_: https://shiplib.org/?p=1017 [snippet]
