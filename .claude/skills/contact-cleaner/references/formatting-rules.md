# Contact Cleaner — Formatting Rules Reference

## Name Formatting

**Goal:** Title Case — `First Last`

| Input | Output | Action |
|---|---|---|
| `JOHN SMITH` | `John Smith` | Convert all-caps to Title Case |
| `john smith` | `John Smith` | Convert lowercase to Title Case |
| `Smith, John` | `John Smith` | Reverse Last, First format |
| `SMITH, JOHN` | `John Smith` | Reverse + Title Case |
| *(empty/null)* | *(empty)* | Flag → `needs_review = yes` |

- Strip leading/trailing whitespace; collapse multiple spaces
- Detect `Last, First` by comma presence and reverse
- Apply `str.title()` — handles hyphenated names (e.g. `Mary-Jane`)
- Missing or blank after stripping: leave empty, flag for review

---

## Phone Formatting

**Goal:** `1XXXXXXXXXX` (11 digits, leading 1)

1. Strip all non-numeric characters: spaces, dashes, dots, parentheses, `+`
2. Count remaining digits:
   - **10 digits** → prepend `1`
   - **11 digits starting with `1`** → keep as-is
   - **Anything else** → flag invalid → `needs_review = yes`, keep original value

| Input | Stripped | Output |
|---|---|---|
| `(555) 123-4567` | `5551234567` | `15551234567` |
| `555.123.4567` | `5551234567` | `15551234567` |
| `1-555-123-4567` | `15551234567` | `15551234567` |
| `+1 555 123 4567` | `15551234567` | `15551234567` |
| `5551234` | `5551234` | Flag invalid |
| *(empty)* | — | Flag missing |

---

## SMS Column

**Goal:** `XXXXXXXXXX` (10 digits, no leading 1) — derived from cleaned phone

| Phone Output | SMS Output |
|---|---|
| `15551234567` | `5551234567` |
| Invalid/missing | *(empty)* |

---

## Address Formatting

**Default (two columns):**
- `Street` — street number and name (everything before the last comma)
- `City_State_Zip` — city, state, and zip combined (everything after the last comma)

**Split mode (four columns)** — only when user explicitly says "split addresses":
- `Street`, `City`, `State` (2-letter uppercase), `Zip` (5-digit, preserve leading zeros)

- Strip leading/trailing whitespace from each field
- Missing/blank address → flag `needs_review = yes`
- Do not geocode or validate — format only
- If splitting fails, keep combined in `City_State_Zip` and flag

---

## needs_review Column

| Value | When |
|---|---|
| `yes` | Any field missing, blank, or invalid |
| `no` | All fields present and valid |

---

## Python Patterns

```python
import re, csv

def clean_name(val):
    val = str(val).strip()
    if not val:
        return '', True  # (cleaned, needs_review)
    if ',' in val:
        parts = val.split(',', 1)
        val = parts[1].strip() + ' ' + parts[0].strip()
    return val.title(), False

def clean_phone(val):
    digits = re.sub(r'\D', '', str(val))
    if len(digits) == 10:
        return '1' + digits, False
    elif len(digits) == 11 and digits[0] == '1':
        return digits, False
    else:
        return str(val).strip(), True  # invalid

def derive_sms(phone_cleaned, phone_invalid):
    if phone_invalid or not phone_cleaned:
        return ''
    return phone_cleaned[1:]  # strip leading 1

def clean_address(val):
    val = str(val).strip()
    if not val:
        return '', '', True
    parts = val.rsplit(',', 1)
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip(), False
    return val, '', False
```
