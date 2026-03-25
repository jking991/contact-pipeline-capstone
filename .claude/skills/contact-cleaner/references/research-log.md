# Research Log: Contact Cleaner

## Skill Location
`.claude/skills/contact-cleaner/SKILL.md`

## Eval Criteria
1. Are all valid phone numbers formatted as `1XXXXXXXXXX` (11 digits, leading 1)?
2. Are all names in `First Last` Title Case format (not Last, First or ALL CAPS)?
3. Does the `SMS` column contain exactly the 10-digit number (no leading 1) for every valid phone?
4. Does every output row have a `needs_review` value of `yes` or `no` (no blank or missing values)?
5. Does the skill print a summary report after cleaning (total rows, rows flagged, output path)?

## Max Score
5 outputs x 5 criteria = 25 points

---

## Baseline Run — 2026-03-22

| Output # | C1 Phones | C2 Names | C3 SMS | C4 needs_review | C5 Summary | Score |
|----------|-----------|----------|--------|-----------------|------------|-------|
| 1 (mixed) | Y | N | Y | Y | Y | 4/5 |
| 2 (Last/First names) | Y | Y | Y | Y | Y | 5/5 |
| 3 (bad phones) | Y | Y | Y | Y | Y | 5/5 |
| 4 (address issues) | Y | Y | Y | N | Y | 4/5 |
| 5 (mixed + empty row) | Y | Y | Y | Y | Y | 5/5 |
| **Total** | **5/5** | **4/5** | **5/5** | **4/5** | **5/5** | **23/25** |

**Baseline score: 23/25 (92%)**

**Failures analysed:**
- C2 Run 1: `WILLIAMS SARAH` — all-caps, no comma. `str.title()` produces `Williams Sarah` but real name may be `Sarah Williams`. Cannot detect without a comma delimiter.
- C4 Run 4: Frank Castle has empty `Street` but full `City_State_Zip`. Old logic only flagged `needs_review` when *both* were empty — so row passed silently despite incomplete address.

**Biggest opportunity:** C4 — silent pass on partial address data. Affects real-world data where only a street or only a city is present.

---

## Run 1 — 2026-03-22

**Score:** 23/25 (baseline)
**Change:** In SKILL.md address rules, changed `"If address is entirely missing or blank"` → `"If either Street or City_State_Zip is missing or blank"` — so a row with only one address field populated is flagged for review.
**Why:** C4 was failing because the `addr_missing` check required both Street AND City_State_Zip to be empty. Frank Castle had a street but no city — slipped through without a `needs_review` flag.
**Result:** Kept — improved from 23/25 to 24/25
**Observation:** "Entirely missing" is ambiguous in natural language — it can mean "the whole address block is gone" or "any part is gone." Explicit field-level conditions (`either X or Y is blank`) are clearer than holistic descriptions and produce more reliable implementations.
