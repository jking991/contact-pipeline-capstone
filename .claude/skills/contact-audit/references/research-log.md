# Research Log: Contact Audit

## Skill Location
`.claude/skills/contact-audit/SKILL.md`

## Eval Criteria
1. Does the output include all 5 sections: Volume, Phone Formats, Duplicates, Name Issues, and Address Issues?
2. Are the phone format counts correct for the input data (no overcounting or undercounting)?
3. Does the report end with a `=== Recommendation ===` line containing a verdict?
4. Does the skill avoid writing or modifying any files (audit is read-only)?
5. Are name issues counted as separate categories (ALL CAPS, all lowercase, Last/First format, missing) rather than collapsed into one total?

## Max Score
5 outputs x 5 criteria = 25 points

---

## Baseline Run — 2026-03-22

| Output # | C1 All sections | C2 Phone counts | C3 Recommendation | C4 Read-only | C5 Name categories | Score |
|----------|-----------------|-----------------|-------------------|--------------|-------------------|-------|
| 1 (mixed) | Y | Y | Y | Y | Y | 5/5 |
| 2 (Last/First, bare 10-digit phones) | Y | N | Y | Y | Y | 4/5 |
| 3 (bad/missing phones) | Y | Y | Y | Y | Y | 5/5 |
| 4 (address issues) | Y | Y | Y | Y | Y | 5/5 |
| 5 (mixed + empty row) | Y | Y | Y | Y | Y | 5/5 |
| **Total** | **5/5** | **4/5** | **5/5** | **5/5** | **5/5** | **24/25** |

**Baseline score: 24/25 (96%)**

**Failure analysis:**
- C2 Run 2: All phones are plain 10-digit numbers (e.g. `6175550142`) with no formatting characters. They don't match Dashes, Brackets, Dots, Spaces, +1, or Already Clean (which requires 11 digits). They aren't Invalid either (10 digits is valid). The skill has no "bare 10-digit" category — these phones fall through all format checks and show as 0 across the board, which is misleading.

**Decision:** No mutation. 96% is a strong baseline and the gap is a spec ambiguity (bare 10-digit numbers are technically valid and cleanable), not a skill failure. If a "bare 10-digit" category were added, it would be a spec enhancement, not a bug fix.

**Observation:** Phone format detection works well for explicitly formatted numbers but has a blind spot for clean 10-digit inputs — the most common format in well-maintained contact lists.
