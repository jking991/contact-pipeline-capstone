#!/usr/bin/env python3
"""
Eval Runner: contact-cleaner golden dataset
Runs the contact-cleaner skill on data/golden-inputs.csv via Claude CLI,
then compares the output CSV row-by-row against expected values.

Usage:
    python scripts/run-golden-evals.py
    python scripts/run-golden-evals.py --dry-run
"""

import csv
import json
import subprocess
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

SCRIPT_DIR   = Path(__file__).parent
PROJECT_DIR  = SCRIPT_DIR.parent
SKILL_MD     = PROJECT_DIR / ".claude" / "skills" / "contact-cleaner" / "SKILL.md"
INPUT_CSV    = PROJECT_DIR / "data" / "golden-inputs.csv"
OUTPUT_CSV   = PROJECT_DIR / "data" / "golden-inputs_cleaned.csv"
OUTPUT_DIR   = PROJECT_DIR / "output"
CLI_JS       = r'C:\Users\operator\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\cli.js'

# ── Expected outputs ───────────────────────────────────────────────────────────
# Each dict matches one row in golden-inputs.csv (same order).
# Fields checked: Name, Phone, SMS, needs_review
# Use None to skip checking a field.

EXPECTED = [
    # 1 — ALL CAPS + bracketed phone
    {"Name": "Jennifer Walsh",  "Phone": "14165550101", "SMS": "4165550101", "needs_review": "no"},
    # 2 — Last, First + dots
    {"Name": "Miguel Torres",   "Phone": "14165550142", "SMS": "4165550142", "needs_review": "no"},
    # 3 — lowercase + +1 prefix
    {"Name": "Robert Kim",      "Phone": "14165550183", "SMS": "4165550183", "needs_review": "no"},
    # 4 — ALL CAPS + 10-digit
    {"Name": "Amanda Price",    "Phone": "14165550224", "SMS": "4165550224", "needs_review": "no"},
    # 5 — Last, First + brackets
    {"Name": "Priya Patel",     "Phone": "14165550265", "SMS": "4165550265", "needs_review": "no"},
    # 6 — already clean name + dashes
    {"Name": "David Nguyen",    "Phone": "14165550306", "SMS": "4165550306", "needs_review": "no"},
    # 7 — invalid phone (8 digits) → flagged
    {"Name": "Yuki Nakamura",   "Phone": "41655506",    "SMS": "",           "needs_review": "yes"},
    # 8 — missing name → flagged
    {"Name": "",                "Phone": "14165550798", "SMS": "4165550798", "needs_review": "yes"},
    # 9 — missing address → flagged
    {"Name": "Diana Ross",      "Phone": "14165550839", "SMS": "4165550839", "needs_review": "yes"},
    # 10 — US contact, already clean 11-digit phone
    {"Name": "Emily Harrison",  "Phone": "12125550234", "SMS": "2125550234", "needs_review": "no"},
]

CASE_NAMES = [
    "ALL CAPS + bracketed phone",
    "Last,First + dot phone",
    "lowercase + +1 prefix",
    "ALL CAPS + 10-digit phone",
    "Last,First + bracketed phone",
    "Already clean name + dashes",
    "Invalid phone (8 digits)",
    "Missing name",
    "Missing address",
    "US contact + clean 11-digit",
]

# ── Run cleaner ────────────────────────────────────────────────────────────────

def run_cleaner():
    """Run the contact-cleaner skill on golden-inputs.csv via Claude CLI."""
    skill_md = SKILL_MD.read_text(encoding="utf-8")

    prompt = f"""You are a contact data cleaner. Follow the skill instructions below exactly.

<skill>
{skill_md}
</skill>

Clean the contacts file at: {INPUT_CSV}

Use the default output format (CSV). Do not ask any questions — apply all rules and write the output."""

    print("  Running contact-cleaner skill via Claude CLI...")
    start = time.time()

    try:
        cmd = [
            'node', CLI_JS, '-p', prompt,
            '--output-format', 'stream-json',
            '--verbose',
            '--allowedTools', 'Bash,Read,Write'
        ]

        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            encoding='utf-8',
            cwd=str(PROJECT_DIR)
        )

        tool_count = 0
        for line in process.stdout:
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
                if event.get('type') == 'assistant':
                    for block in event.get('message', {}).get('content', []):
                        if block.get('type') == 'tool_use':
                            tool_count += 1
                            print(f"  [tool #{tool_count}: {block.get('name')}]")
            except json.JSONDecodeError:
                pass

        process.wait(timeout=300)
        elapsed = int(time.time() - start)
        print(f"  Done ({tool_count} tool calls, {elapsed}s)")
        return True

    except subprocess.TimeoutExpired:
        process.kill()
        print("  ERROR: timeout after 300s")
        return False
    except Exception as e:
        print(f"  ERROR: {e}")
        return False

# ── Compare output ─────────────────────────────────────────────────────────────

def compare_output():
    """Read cleaned CSV and compare each row against EXPECTED."""
    if not OUTPUT_CSV.exists():
        print(f"\n  ERROR: output file not found: {OUTPUT_CSV}")
        return []

    with open(OUTPUT_CSV, encoding='utf-8', newline='') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    results = []
    for i, (expected, case_name) in enumerate(zip(EXPECTED, CASE_NAMES)):
        if i >= len(rows):
            results.append({
                "id": f"G{i+1:02d}",
                "name": case_name,
                "passed": False,
                "failures": ["Row missing from output"],
            })
            continue

        actual = rows[i]
        failures = []

        for field, exp_val in expected.items():
            act_val = actual.get(field, "").strip()
            exp_val = exp_val.strip()
            if act_val != exp_val:
                failures.append(f"{field}: expected '{exp_val}', got '{act_val}'")

        results.append({
            "id": f"G{i+1:02d}",
            "name": case_name,
            "passed": len(failures) == 0,
            "failures": failures,
        })

    return results

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    dry_run = '--dry-run' in sys.argv

    print(f"\n{'=' * 60}")
    print("  Contact Cleaner — Golden Dataset Eval Runner")
    print(f"  {len(EXPECTED)} test cases × 4 fields = {len(EXPECTED) * 4} max checks")
    print(f"{'=' * 60}\n")

    if dry_run:
        print("  [DRY RUN] Would run cleaner on:")
        print(f"  Input:  {INPUT_CSV}")
        print(f"  Output: {OUTPUT_CSV}")
        print(f"\n  {len(EXPECTED)} cases to check:")
        for i, name in enumerate(CASE_NAMES):
            print(f"  G{i+1:02d}: {name}")
        return

    # Step 1: run the cleaner
    print(f"  Input:  {INPUT_CSV.name}")
    print(f"  Output: {OUTPUT_CSV.name}\n")
    success = run_cleaner()

    if not success:
        print("\n  Cleaner failed — cannot compare output.")
        sys.exit(1)

    # Step 2: compare
    print(f"\n{'─' * 60}")
    print("  Comparing output against expected values...")
    print(f"{'─' * 60}\n")

    results = compare_output()

    passed = sum(1 for r in results if r['passed'])
    total  = len(results)

    for r in results:
        icon = "✓" if r['passed'] else "✗"
        print(f"  {icon}  [{r['id']}] {r['name']}")
        for f in r['failures']:
            print(f"        ✗ {f}")

    # ── Summary ───────────────────────────────────────────────────────────────
    pct = int(passed / total * 100) if total else 0

    print(f"\n{'=' * 60}")
    print("  RESULTS")
    print(f"{'=' * 60}")
    print(f"\n  Passed: {passed}/{total} ({pct}%)\n")

    # Save results
    OUTPUT_DIR.mkdir(exist_ok=True)
    out_path = OUTPUT_DIR / "golden-eval-results.json"
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "skill": "contact-cleaner",
            "eval_type": "golden-dataset",
            "passed": passed,
            "total": total,
            "pct": pct,
            "results": results,
        }, f, indent=2, ensure_ascii=False)
    print(f"  Saved: output/golden-eval-results.json")


if __name__ == "__main__":
    main()
