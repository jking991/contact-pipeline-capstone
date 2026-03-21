# Contact Audit — Patterns Reference

## Phone Format Detection

| Format | Example | Detection Logic |
|---|---|---|
| Dashes | `709-555-1289` | contains `-` |
| Brackets | `(709) 555-9032` | contains `(` or `)` |
| Dots | `709.555.6634` | contains `.` |
| Spaces only | `709 555 4410` | spaces, no dashes/dots/brackets |
| +1 prefix | `+1 7095557721` | starts with `+` |
| Already clean | `17095551289` | digits only, 11 chars starting with 1 |
| Missing | *(blank)* | empty after strip |
| Invalid | anything else | not 10 or 11 digits after stripping non-numeric |

A phone may match multiple format categories (e.g. brackets + dashes). Count each independently.

---

## Name Issue Detection

| Issue | Detection |
|---|---|
| Last, First format | contains a comma |
| ALL CAPS | all alphabetic characters are uppercase |
| all lowercase | all alphabetic characters are lowercase |
| Mixed/embedded phone | contains digits or `–` or `\|` separators |
| Missing | blank after strip |

---

## Duplicate Detection

- **Phone duplicates:** normalize by stripping all non-numeric characters, then group identical values
- **Name duplicates:** normalize to lowercase + stripped whitespace, then group identical values
- List each duplicate with the row numbers where it appears

---

## Address Completeness

- **Missing:** address field is entirely blank
- **Incomplete:** no digits in the address (likely missing street number), or total length < 5 chars

---

## Python Patterns

```python
import re, csv
from collections import defaultdict

def strip_digits(val):
    return re.sub(r'\D', '', str(val))

def audit_phone_format(val):
    val = str(val).strip()
    if not val:
        return ['missing']
    formats = []
    if '(' in val or ')' in val:
        formats.append('brackets')
    if '-' in val:
        formats.append('dashes')
    if '.' in val:
        formats.append('dots')
    if val.startswith('+'):
        formats.append('+1 prefix')
    digits = strip_digits(val)
    if not formats and ' ' in val:
        formats.append('spaces only')
    if not formats and re.match(r'^1\d{10}$', digits):
        formats.append('already clean')
    if len(digits) not in (10, 11):
        formats.append('invalid')
    return formats if formats else ['unknown']

def audit_name(val):
    val = str(val).strip()
    if not val:
        return ['missing']
    issues = []
    if ',' in val:
        issues.append('last_first')
    alpha = re.sub(r'[^a-zA-Z]', '', val)
    if alpha and alpha == alpha.upper():
        issues.append('all_caps')
    elif alpha and alpha == alpha.lower():
        issues.append('all_lowercase')
    if re.search(r'[\d\u2013|]', val):
        issues.append('mixed_embedded')
    return issues
```

---

## Recommendation Logic

- 0 issues → `"File is ready to clean."`
- Any issues → `"X issues found — review before cleaning."` where X = total flagged rows
