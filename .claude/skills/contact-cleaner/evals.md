# Eval Criteria: Contact Cleaner

Each criterion is answered yes/no per output.
Score = passes / (N outputs x criteria count).

1. Are all valid phone numbers formatted as `1XXXXXXXXXX` (11 digits, leading 1) in the output?
2. Are all names in `First Last` Title Case format (not Last, First or ALL CAPS)?
3. Does the `SMS` column contain exactly the 10-digit number (no leading 1) for every valid phone?
4. Does every output row have a `needs_review` value of `yes` or `no` (no blank or missing values)?
5. Does the skill print a summary report after cleaning (total rows, rows flagged, output path)?
