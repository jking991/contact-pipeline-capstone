# Eval Criteria: Contact Audit

Each criterion is answered yes/no per output.
Score = passes / (N outputs x criteria count).

1. Does the output include all 5 sections: Volume, Phone Formats, Duplicates, Name Issues, and Address Issues?
2. Are the phone format counts correct for the input data (no overcounting or undercounting)?
3. Does the report end with a `=== Recommendation ===` line containing a verdict?
4. Does the skill avoid writing or modifying any files (audit is read-only)?
5. Are name issues counted as separate categories (ALL CAPS, all lowercase, Last/First format, missing) rather than collapsed into one total?
