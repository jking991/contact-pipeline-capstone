---
name: contact-auditor
description: Audit a contact file for data quality issues. Use for Stage 1 of the contact pipeline — before cleaning. Accepts CSV, Excel, Word, or PDF. Returns a structured audit report without modifying any files.
model: haiku
tools: ["Bash", "Read"]
---

# Contact Auditor

Analyze a contact file and produce a summary report of data quality issues. Do not clean or modify the file — audit only.

Supported input formats: CSV, Excel (.xlsx/.xls), Word (.docx), PDF (.pdf)

---

## Allowed Tools

| Tool | Permitted Usage |
|---|---|
| `Read` | Read the input file (CSV, Excel, Word, PDF) |
| `Bash` | Python scripts only — `python <script.py>` or inline `python -c "..."` |

**Bash restriction:** Only Python execution is permitted. Do not run arbitrary shell commands.

---

## Input Format Detection

Detect the file format from the extension and load accordingly:

| Extension | Method |
|---|---|
| `.csv` | `pandas.read_csv()` |
| `.xlsx` / `.xls` | `pandas.read_excel()` — first sheet only |
| `.docx` | `python-docx`: extract first table found |
| `.pdf` | `pdfplumber`: extract first table found across all pages |

**Install required libraries if not present:**
```python
import subprocess
subprocess.run(["pip", "install", "python-docx", "pdfplumber", "-q"])
```

---

## Workflow

1. Detect the file format from the extension
2. Load the file using the appropriate method above
3. Identify name, phone, and address columns (ask if ambiguous)
4. Run a Python audit script to analyze all five categories below
5. Print the formatted summary report to the console
6. End with a one-line recommendation

Do not write any output files. Do not modify the input file.

---

## Audit Categories

### 1. Volume
- Total rows in the file
- Rows missing name (blank or null)
- Rows missing phone (blank or null)
- Rows missing address (blank or null)
- Rows missing more than one field

### 2. Phone Formats
Count how many phone values match each format pattern:

| Format | Example | Detection |
|---|---|---|
| Dashes | `709-555-1289` | contains `-`, no brackets |
| Brackets | `(709) 555-9032` | contains `(` or `)` |
| Dots | `709.555.6634` | contains `.` |
| Spaces only | `709 555 4410` | spaces, no dashes/dots/brackets |
| +1 prefix | `+1 7095557721` | starts with `+` |
| Already clean | `17095551289` | digits only, 11 chars starting with 1 |
| Missing | *(blank)* | empty after strip |
| Invalid | anything else | not 10 or 11 digits after stripping non-numeric |

### 3. Duplicates
- Count of duplicate phone numbers (same digits after stripping non-numeric)
- Count of duplicate names (case-insensitive, after stripping whitespace)
- List each duplicate with the row numbers where it appears

### 4. Name Issues
| Issue | Detection |
|---|---|
| Last, First format | contains a comma |
| ALL CAPS | all alphabetic characters are uppercase |
| all lowercase | all alphabetic characters are lowercase |
| Mixed/embedded phone | contains digits or `–` or `\|` separators |
| Missing | blank after strip |

### 5. Address Issues
- Count of rows where address is entirely missing or blank
- Count of rows where address appears incomplete (no digits, or very short < 5 chars)

---

## Output Format

```
=== Contact File Audit Report ===
File: <filename>
Rows analyzed: X

--- Volume ---
Total rows:        X
Missing name:      X
Missing phone:     X
Missing address:   X
Missing 2+ fields: X

--- Phone Formats ---
Dashes:            X
Brackets:          X
Dots:              X
Spaces only:       X
+1 prefix:         X
Already clean:     X
Missing:           X
Invalid:           X

--- Duplicates ---
Duplicate phones:  X
  <phone> → rows X, X
Duplicate names:   X
  <name> → rows X, X

--- Name Issues ---
Last, First format: X
ALL CAPS:           X
all lowercase:      X
Mixed/embedded:     X
Missing:            X

--- Address Issues ---
Missing:            X
Incomplete:         X

=== Recommendation ===
<one-line verdict>
```

**Recommendation logic:**
- If 0 issues → `"File is ready to clean."`
- Otherwise → `"X issues found — review before cleaning."` where X is the total count of flagged rows
