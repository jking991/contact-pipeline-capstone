# Contact Cleaner Skill

Clean and standardize contact data from CSV, Excel, Word, or PDF files. Apply all formatting rules below, add a `needs_review` flag, and output a clean file.

**Default output: CSV.** If the user says "output as Excel" or "save as Excel", output `.xlsx` instead.

---

## Allowed Tools

| Tool | Permitted Usage |
|---|---|
| `Read` | Read input files (CSV, Excel, Word, PDF) |
| `Write` | Write the cleaned output file |
| `Bash` | Python scripts only — `python <script.py>` or inline `python -c "..."` |

**Bash restriction:** Only Python execution is permitted. Do not run arbitrary shell commands.

---

## Input Format Detection

Detect the file format from the extension and load accordingly:

| Extension | Method |
|---|---|
| `.csv` | `pandas.read_csv()` |
| `.xlsx` / `.xls` | `pandas.read_excel()` — first sheet only unless user specifies |
| `.docx` | `python-docx`: extract first table found in the document |
| `.pdf` | `pdfplumber`: extract first table found across all pages |

**Install required libraries if not present:**
```python
import subprocess
subprocess.run(["pip", "install", "python-docx", "-q"])  # Word
subprocess.run(["pip", "install", "pdfplumber", "-q"])   # PDF
subprocess.run(["pip", "install", "openpyxl", "-q"])     # Excel output
```

**Word/PDF parsing notes:**
- Extract the first table found in the document
- Use the first row as column headers
- If no table is found, attempt to parse line-by-line (one contact per line, comma or tab separated)
- If the file cannot be parsed into rows and columns, stop and report: `"Could not extract tabular data from <filename>. Ensure the file contains a table or structured list."`

---

## Output Format

| User says | Output | Filename |
|---|---|---|
| *(nothing / default)* | CSV | `<name>_cleaned.csv` |
| "output as Excel" / "save as Excel" / "Excel output" | Excel (.xlsx) | `<name>_cleaned.xlsx` |

Output is saved to the same directory as the input file.

---

## Workflow

1. **Detect** the file format from the extension
2. **Load** the file using the appropriate method above; install libraries if needed
3. Inspect the first 5 rows to identify column names
4. Ask the user to confirm column mapping if ambiguous (name, phone, address columns)
5. Apply all formatting rules below — **do not ask about address format**; always use Street + City_State_Zip unless the user explicitly included "split addresses" in their prompt
6. **Write** the cleaned file in the requested output format
7. Report a summary: total rows, rows flagged for review, and what was fixed

---

## Formatting Rules

### 1. Name Formatting

**Goal:** Title Case — `First Last`

| Input | Output | Action |
|---|---|---|
| `JOHN SMITH` | `John Smith` | Convert all-caps to Title Case |
| `john smith` | `John Smith` | Convert lowercase to Title Case |
| `Smith, John` | `John Smith` | Reverse Last, First format |
| `SMITH, JOHN` | `John Smith` | Reverse + Title Case |
| *(empty/null)* | *(empty)* | Flag as missing → `needs_review = yes` |

**Rules:**
- Strip leading/trailing whitespace
- Collapse multiple spaces into one
- Handle `Last, First` by detecting the comma and reversing
- Apply `str.title()` — handles hyphenated names (e.g. `Mary-Jane` → `Mary-Jane`)
- If name is missing or blank after stripping: leave empty, flag for review

---

### 2. Phone Formatting

**Goal:** `1XXXXXXXXXX` (11 digits, leading 1)

**Steps:**
1. Strip all non-numeric characters: spaces, dashes, dots, parentheses, `+`
2. Count remaining digits:
   - **10 digits** → prepend `1` → output `1XXXXXXXXXX`
   - **11 digits starting with `1`** → keep as-is → output `1XXXXXXXXXX`
   - **Anything else** → flag as invalid → `needs_review = yes`, output original value

**Examples:**

| Input | Stripped | Output |
|---|---|---|
| `(555) 123-4567` | `5551234567` | `15551234567` |
| `555.123.4567` | `5551234567` | `15551234567` |
| `1-555-123-4567` | `15551234567` | `15551234567` |
| `+1 555 123 4567` | `15551234567` | `15551234567` |
| `5551234` | `5551234` | Flag invalid |
| *(empty)* | — | Flag missing |

---

### 3. SMS Column (derived from Phone)

**Goal:** `XXXXXXXXXX` (10 digits, no leading 1)

- Derived from the cleaned phone number
- If phone is valid (`1XXXXXXXXXX`): SMS = last 10 digits (strip the leading `1`)
- If phone is invalid or missing: SMS = empty

| Phone Output | SMS Output |
|---|---|
| `15551234567` | `5551234567` |
| Invalid/missing | *(empty)* |

---

### 4. Address Formatting

**Default (two columns):**
- `Street` — street number and name (everything before the city)
- `City_State_Zip` — city, state, and zip combined

**If user requests "split addresses" (four columns):**
- `Street` — street address line
- `City` — city name
- `State` — 2-letter state code (uppercase)
- `Zip` — 5-digit zip code (preserve leading zeros)

**Rules:**
- Strip leading/trailing whitespace from each field
- If address is entirely missing or blank: flag → `needs_review = yes`
- Do not attempt to geocode or validate addresses — format only
- If splitting and city/state/zip cannot be parsed, keep combined in `City_State_Zip` and flag
- If an address looks ambiguous (missing street number, unrecognisable format, or very short): flag → `needs_review = yes` and set `address_ambiguous = yes` — this signals the WebSearch sub-agent to attempt validation on that row

---

### 5. needs_review Column

Add a `needs_review` column as the last column in the output.

| Value | When |
|---|---|
| `yes` | Any field was missing, blank, or invalid (name, phone, address) |
| `no` | All fields present and valid |

---

## Output Columns

**Default output columns:**
```
Name, Street, City_State_Zip, Phone, SMS, needs_review
```

**Split address output columns:**
```
Name, Street, City, State, Zip, Phone, SMS, needs_review
```

- Output as UTF-8 (CSV or Excel depending on user request — see Output Format section above)
- Preserve all original rows (do not drop rows, even if fully empty)

---

## Summary Report

After writing the output, print:

```
Cleaning complete.
- Total rows processed: X
- Names fixed: X
- Phones reformatted: X
- Invalid/missing fields flagged: X rows marked needs_review = yes
- Output saved to: <filepath>
```

---

## References

See [`references/formatting-rules.md`](references/formatting-rules.md) for:
- Full formatting rule tables with examples
- Address split-mode rules
- Python implementation patterns
