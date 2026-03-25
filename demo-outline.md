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

- **I'll show:** Running the SDK pipeline on `demo-contacts.csv`
- **Sample input:** 73-row CSV — ALL CAPS names, Last/First reversed, 6 different phone
  formats, missing fields, mix of Canadian and US contacts
- **Expected output:**
  - `demo-contacts_cleaned.csv` — standardised, flagged rows marked `needs_review = yes`
  - `output/demo-contacts-audit.md` — pre-clean quality report
  - `output/demo-contacts-report.md` — summary of what was found and fixed, with a
    table of rows requiring manual review
- **Backup if live fails:** Pre-run output files are already saved in `output/` —
  walk through the audit report and pipeline report to show the results

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
- [ ] `data/demo-contacts.csv` ready
- [ ] Run command ready: `npm start -- ../../data/demo-contacts.csv`
- [ ] Pre-run output files in `output/` as backup
- [ ] Notifications disabled
- [ ] Screen sharing tested
