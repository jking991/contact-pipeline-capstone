# Contact Audit Skill

Analyze a contact CSV file and produce a summary report of data quality issues. Do not clean or modify the file — audit only.

---

## Allowed Tools

| Tool | Permitted Usage |
|---|---|
| `Read` | Read the input CSV file |
| `Bash` | Python scripts only — `python <script.py>` or inline `python -c "..."` |

**Bash restriction:** Only Python execution is permitted. Do not run arbitrary shell commands.

---

## Workflow

1. **Read** the input file to inspect raw content and identify columns
2. Run a Python audit script to analyze all five categories below
3. Print the formatted summary report to the console
4. End with a one-line recommendation

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

A phone may match multiple format categories (e.g. brackets + dashes). Count each pattern independently.

### 3. Duplicates
- Count of duplicate phone numbers (same digits after stripping non-numeric characters)
- Count of duplicate names (case-insensitive, after stripping whitespace)
- List each duplicate with the row numbers where it appears

### 4. Name Issues
Count names matching each issue:

| Issue | Detection |
|---|---|
| Last, First format | contains a comma |
| ALL CAPS | all alphabetic characters are uppercase |
| all lowercase | all alphabetic characters are lowercase |
| Mixed/embedded phone | contains digits or `–` or `\|` separators |
| Missing | blank after strip |

### 5. Address Issues
- Count of rows where address is entirely missing or blank
- Count of rows where address appears incomplete (no digits = likely missing street number, or very short < 5 chars)

---

## Output Format

Print the report in this structure:

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
- If 0 issues across all categories → `"File is ready to clean."`
- Otherwise → `"X issues found — review before cleaning."` where X is the total count of flagged rows

---

## References

See [`references/audit-patterns.md`](references/audit-patterns.md) for:
- Phone format detection logic and examples
- Name issue detection rules
- Duplicate normalization approach
- Python implementation patterns
