# Contact Audit Report
_File: test-contacts.csv_
_Run: 2026-03-22T20:53:18.208Z_

```
Here is the audit report:

```
=== Contact File Audit Report ===
File: test-contacts.csv
Rows analyzed: 5

--- Volume ---
Total rows:        5
Missing name:      1
Missing phone:     0
Missing address:   1
Missing 2+ fields: 0

--- Phone Formats ---
Dashes:            1
Brackets:          1
Dots:              1
Spaces only:       0
+1 prefix:         1
Already clean:     0
Missing:           0
Invalid:           1

--- Duplicates ---
Duplicate phones:  0
Duplicate names:   0

--- Name Issues ---
Last, First format: 1
ALL CAPS:           3
all lowercase:      1
Missing:            1

--- Address Issues ---
Missing:            1
Incomplete:         0

=== Recommendation ===
9 issues found — review before cleaning.
```

---

**Breakdown of every flagged issue:**

| # | Row | Field | Issue |
|---|-----|-------|-------|
| 1 | SMITH, JOHN | Name | Last, First comma format |
| 2 | SMITH, JOHN / BOB JOHNSON / WILLIAMS SARAH | Name | ALL CAPS (3 rows) |
| 3 | jane doe | Name | all lowercase |
| 4 | *(row 5)* | Name | Missing (NaN) |
| 5 | 5551234 | Phone | Invalid — only 7 digits, not dialable |
| 6 | WILLIAMS SARAH | Address | Missing (blank street) |
| 7 | SMITH, JOHN | Name | Missing address — contributes to missing_name + missing_address counts separately |

**Phone format breakdown:**
- `(555) 123-4567` → **Brackets**
- `555.987.6543` → **Dots**
- `1-800-555-0199` → **Dashes**
- `5551234` → **Invalid** (7 digits)
- `+1 312 555 8888` → **+1 prefix**
- None are already clean 11-digit strings with no formatting
```
