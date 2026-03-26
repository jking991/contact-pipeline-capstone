# Golden Dataset: Contact Cleaner

Each example shows a specific transformation. Use these as concrete test cases
to verify the skill produces the expected output for known inputs.

---

## Case 1 — ALL CAPS name + bracketed phone

**Input:**
| Name | Phone | Street | City_State_Zip |
|---|---|---|---|
| JENNIFER WALSH | (416) 555-0101 | 200 Bay St | Toronto, ON M5J 2J1 |

**Expected output:**
| Name | Street | City_State_Zip | Phone | SMS | needs_review |
|---|---|---|---|---|---|
| Jennifer Walsh | 200 Bay St | Toronto, ON M5J 2J1 | 14165550101 | 4165550101 | no |

**What changed:** ALL CAPS → Title Case, `(416) 555-0101` → `14165550101`, SMS derived

---

## Case 2 — Last, First format + dot-separated phone

**Input:**
| Name | Phone | Street | City_State_Zip |
|---|---|---|---|
| TORRES, MIGUEL | 416.555.0142 | 100 King St W | Toronto, ON M5X 1A9 |

**Expected output:**
| Name | Street | City_State_Zip | Phone | SMS | needs_review |
|---|---|---|---|---|---|
| Miguel Torres | 100 King St W | Toronto, ON M5X 1A9 | 14165550142 | 4165550142 | no |

**What changed:** `TORRES, MIGUEL` → `Miguel Torres` (reversed + Title Case), `416.555.0142` → `14165550142`

---

## Case 3 — all lowercase name + +1 prefix phone

**Input:**
| Name | Phone | Street | City_State_Zip |
|---|---|---|---|
| robert kim | +14165550183 | 66 Wellington St W | Toronto, ON M5K 1A1 |

**Expected output:**
| Name | Street | City_State_Zip | Phone | SMS | needs_review |
|---|---|---|---|---|---|
| Robert Kim | 66 Wellington St W | Toronto, ON M5K 1A1 | 14165550183 | 4165550183 | no |

**What changed:** lowercase → Title Case, `+14165550183` → `14165550183` (stripped `+`)

---

## Case 4 — all lowercase name + 10-digit phone (no country code)

**Input:**
| Name | Phone | Street | City_State_Zip |
|---|---|---|---|
| AMANDA PRICE | 4165550224 | 145 King St W | Toronto, ON M5H 1J8 |

**Expected output:**
| Name | Street | City_State_Zip | Phone | SMS | needs_review |
|---|---|---|---|---|---|
| Amanda Price | 145 King St W | Toronto, ON M5H 1J8 | 14165550224 | 4165550224 | no |

**What changed:** ALL CAPS → Title Case, `4165550224` (10 digits) → `14165550224` (prepend `1`)

---

## Case 5 — Last, First format + bracketed phone

**Input:**
| Name | Phone | Street | City_State_Zip |
|---|---|---|---|
| PATEL, PRIYA | (416) 555-0265 | 181 Bay St | Toronto, ON M5J 2T3 |

**Expected output:**
| Name | Street | City_State_Zip | Phone | SMS | needs_review |
|---|---|---|---|---|---|
| Priya Patel | 181 Bay St | Toronto, ON M5J 2T3 | 14165550265 | 4165550265 | no |

**What changed:** `PATEL, PRIYA` → `Priya Patel`, `(416) 555-0265` → `14165550265`

---

## Case 6 — Already clean name + dash-separated phone

**Input:**
| Name | Phone | Street | City_State_Zip |
|---|---|---|---|
| David Nguyen | 416-555-0306 | 20 Queen St W | Toronto, ON M5H 3R3 |

**Expected output:**
| Name | Street | City_State_Zip | Phone | SMS | needs_review |
|---|---|---|---|---|---|
| David Nguyen | 20 Queen St W | Toronto, ON M5H 3R3 | 14165550306 | 4165550306 | no |

**What changed:** Name unchanged (already Title Case), `416-555-0306` → `14165550306`

---

## Case 7 — Invalid phone (too short) → flagged

**Input:**
| Name | Phone | Street | City_State_Zip |
|---|---|---|---|
| NAKAMURA, YUKI | 41655506 | 250 Yonge St | Toronto, ON M5B 2L7 |

**Expected output:**
| Name | Street | City_State_Zip | Phone | SMS | needs_review |
|---|---|---|---|---|---|
| Yuki Nakamura | 250 Yonge St | Toronto, ON M5B 2L7 | 41655506 | | yes |

**What changed:** Name reversed + Title Case, phone kept as-is (only 8 digits — invalid), SMS blank, flagged for review

---

## Case 8 — Missing name → flagged

**Input:**
| Name | Phone | Street | City_State_Zip |
|---|---|---|---|
| *(blank)* | (416) 555-0798 | 333 Bay St | Toronto, ON M5H 2R2 |

**Expected output:**
| Name | Street | City_State_Zip | Phone | SMS | needs_review |
|---|---|---|---|---|---|
| *(blank)* | 333 Bay St | Toronto, ON M5H 2R2 | 14165550798 | 4165550798 | yes |

**What changed:** Phone cleaned normally, name left blank, flagged for review

---

## Case 9 — Missing City_State_Zip → flagged

**Input:**
| Name | Phone | Street | City_State_Zip |
|---|---|---|---|
| DIANA ROSS | (416) 555-0839 | 100 Simcoe St | *(blank)* |

**Expected output:**
| Name | Street | City_State_Zip | Phone | SMS | needs_review |
|---|---|---|---|---|---|
| Diana Ross | 100 Simcoe St | *(blank)* | 14165550839 | 4165550839 | yes |

**What changed:** Name Title Cased, phone cleaned, City_State_Zip left blank, flagged for review

---

## Case 10 — US contact + already clean 11-digit phone

**Input:**
| Name | Phone | Street | City_State_Zip |
|---|---|---|---|
| "HARRISON, EMILY" | 12125550234 | 350 Fifth Ave | New York, NY 10118 |

**Expected output:**
| Name | Street | City_State_Zip | Phone | SMS | needs_review |
|---|---|---|---|---|---|
| Emily Harrison | 350 Fifth Ave | New York, NY 10118 | 12125550234 | 2125550234 | no |

**What changed:** `HARRISON, EMILY` → `Emily Harrison`, phone already 11 digits starting with 1 — kept as-is

---

## Summary of Transformations Covered

| Case | Name fix | Phone fix | Flag |
|---|---|---|---|
| 1 | ALL CAPS → Title Case | brackets stripped | no |
| 2 | Last, First + ALL CAPS → First Last Title Case | dots stripped | no |
| 3 | lowercase → Title Case | +1 prefix stripped | no |
| 4 | ALL CAPS → Title Case | 10-digit → prepend 1 | no |
| 5 | Last, First + ALL CAPS → First Last Title Case | brackets stripped | no |
| 6 | Already clean | dashes stripped | no |
| 7 | Last, First → First Last | invalid (8 digits) → kept | yes |
| 8 | Missing | valid phone cleaned | yes |
| 9 | ALL CAPS → Title Case | valid phone cleaned | yes |
| 10 | Last, First + ALL CAPS → First Last | already clean 11-digit | no |
