# Contact Audit Report
_File: demo-contacts.csv_
_Run: 2026-03-25T18:47:01.846Z_

```
Perfect! The audit is complete. Here's the summary:

---

## **=== Contact File Audit Report ===**
**File:** demo-contacts.csv  
**Rows analyzed:** 73

### **--- Volume ---**
- Total rows: 73
- Missing name: 0
- Missing phone: 0
- Missing address: 73
- Missing 2+ fields: 0

### **--- Phone Formats ---**
- Dashes: 6
- Brackets: 24
- Dots: 15
- Spaces only: 0
- +1 prefix: 13
- Already clean: 0
- Missing: 0
- Invalid: 15

### **--- Duplicates ---**
- Duplicate phones: 0
- Duplicate names: 0

### **--- Name Issues ---**
- Last, First format: 23
- ALL CAPS: 52
- all lowercase: 20
- Missing: 0

### **--- Address Issues ---**
- Missing: 73
- Incomplete: 0

### **=== Recommendation ===**
**183 issues found — review before cleaning.**

---

**Key Findings:**
- **Critical:** All 73 rows are missing address data (100% of records)
- **Phone:** Highly inconsistent formatting across 4+ different formats; 15 invalid entries
- **Names:** 52 records in ALL CAPS; 23 in "Last, First" format; 20 all lowercase
- **No duplicates detected** in names or phone numbers

This file requires significant cleanup before it can be reliably used for contact data operations.
```
