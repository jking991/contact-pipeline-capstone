# Contact Audit Report
_File: demo-contacts-short.csv_
_Run: 2026-03-26T18:01:59.394Z_

```
Perfect! The audit is complete. Here's the report for your contact file:

```
=== Contact File Audit Report ===
File: demo-contacts-short.csv
Rows analyzed: 10

--- Volume ---
Total rows:        10
Missing name:      1
Missing phone:     0
Missing address:   0
Missing 2+ fields: 0

--- Phone Formats ---
Dashes:            5
Brackets:          0
Dots:              2
Spaces only:       0
+1 prefix:         1
Already clean:     0
Missing:           0
Invalid:           2

--- Duplicates ---
Duplicate phones:  0
Duplicate names:   0

--- Name Issues ---
Last, First format: 3
ALL CAPS:           4
all lowercase:      1
Missing:            1

--- Address Issues ---
Missing:            0
Incomplete:         0

=== Recommendation ===
10 issues found — review before cleaning.
```

**Key Findings:**
- **Phone formats need standardization**: 5 use dashes, 2 use dots, 1 uses +1 prefix, and 2 are invalid (malformed)
- **Name formatting inconsistencies**: 4 records in ALL CAPS, 3 in Last, First format, 1 in all lowercase, 1 missing
- **No duplicates detected** in phone or name fields (case-insensitive)
- **Data is complete** for phone and address fields (no missing values in those fields, minimal incomplete addresses)

The file should be cleaned to standardize phone formats and name capitalization before use.
```
