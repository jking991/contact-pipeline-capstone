# Contact Pipeline — Demo Outline

## Opening Line

"Formatting a contact list manually can take hours — getting names into the right format,
phone numbers consistent, addresses organized into the right fields, especially if it's
going into Excel or a CRM with specific requirements. My pipeline does all of it
automatically, and hands back the file in whatever format you need."

---

## The Problem (30 sec)

- **I'm solving:** The manual effort of cleaning raw contact data before it can be used
  in a CRM, outreach tool, or spreadsheet
- **This helps:** Anyone who regularly receives contact lists from external sources —
  tradeshows, partners, spreadsheets emailed from clients
- **Before my agent:** Hours of manual formatting — fixing name casing, standardizing
  phone numbers across 6 different formats, splitting or combining address fields.
  Excel has formulas that help, but setting those up takes time too.

---

## The Solution (1 min)

- **Architecture:** Skills + Sub-agents + SDK (all three layers of the course)
- **Key components:**
  1. `contact-audit` skill — pre-clean quality report: flags volume issues, phone formats,
     name problems, duplicates, and missing fields before anything is changed
  2. `contact-cleaner` skill — standardises names (Title Case), phones (1XXXXXXXXXX),
     addresses; flags records it can't fix; outputs CSV, Excel, Word, text, or JSON
  3. TypeScript SDK runner — headless pipeline that runs audit → clean → report from a
     single terminal command, no UI required

---

## Live Demo (2.5 min)

- **I'll show:** Running the SDK pipeline on `demo-contacts-short.csv` (10 rows, ~2.5 min runtime)
- **Step 1 — Show input first (30 sec):** Open `demo-contacts-short.csv` before running.
  Walk through the dirty data visually — ALL CAPS names, Last/First reversed, 6 phone
  formats, missing fields. Let the audience see the problem before the fix.
- **Step 2 — Run the command (5 sec):** `npm start -- ../../data/demo-contacts-short.csv`
- **Step 3 — Narrate while it runs:**
  - Stage 1: "Auditing with Haiku — pattern matching, counting every issue before anything changes"
  - Stage 2: "Cleaning with Sonnet — reversing names, standardising phones, flagging what it can't fix"
  - Stage 3: "Report — pure TypeScript, no extra API call, instant"
- **Step 4 — Show the report (30 sec):** Open `output/demo-contacts-short-report.md` —
  10 rows, 8 names fixed, 8 phones reformatted, 4 flagged with a table showing each issue
- **Backup if live fails:** Pre-run output files already saved in `output/` —
  walk through `demo-contacts-short-report.md` and the cleaned CSV directly

---

## Learnings (1 min)

- **What worked well:** Splitting audit and clean into separate agents with different
  models — Haiku for the audit (fast, cheap, pattern-matching), Sonnet for the clean
  (handles judgment calls on ambiguous data). Right model for the right task.
- **What was challenging:** Getting reliable metrics out of the pipeline — the model's
  summary text wasn't consistent enough to parse with regex, so I ended up diffing the
  actual input and output CSV files in TypeScript to count real field changes.
- **What I'd do differently:** The cleaner now outputs CSV, Excel, Word, text, and JSON —
  but the SDK runner always outputs CSV. A `--format` flag would let you specify the
  output format from the command line, so the whole pipeline is truly format-flexible
  end to end.

---

## Demo Day Checklist

- [ ] Terminal open in `contact-pipeline-capstone/agents/contact-pipeline/`
- [ ] `data/demo-contacts-short.csv` open in a second window (to show dirty data first)
- [ ] Run command ready: `npm start -- ../../data/demo-contacts-short.csv`
- [ ] Pre-run output files in `output/` as backup (`demo-contacts-short-report.md`)
- [ ] Notifications disabled
- [ ] Screen sharing tested
