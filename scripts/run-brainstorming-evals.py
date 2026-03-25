#!/usr/bin/env python3
"""
Eval Runner: brainstorming skill
Runs 5 test inputs through the brainstorming skill via separate Claude CLI sub-agents.
Scores each output against 5 binary criteria from evals.md.

Usage:
    python scripts/run-brainstorming-evals.py
    python scripts/run-brainstorming-evals.py --dry-run
"""

import json
import subprocess
import sys
import time
import re
from pathlib import Path

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
SKILL_DIR = PROJECT_DIR / ".agents" / "skills" / "brainstorming"
OUTPUT_DIR = PROJECT_DIR / "output"
CLI_JS = r'C:\Users\operator\AppData\Roaming\npm\node_modules\@anthropic-ai\claude-code\cli.js'

# ── Eval cases ────────────────────────────────────────────────────────────────
# Each input is self-contained so the skill can reach the design/diagram phase.

EVAL_CASES = [
    {
        "id": "brain-001",
        "name": "Contact data pipeline",
        "input": (
            "I want to design a contact data pipeline. It reads a CSV file of raw contacts "
            "(names, phones, addresses), cleans and standardises each field, flags bad rows, "
            "and writes a cleaned CSV. Show me the design."
        ),
        "keywords": ["csv", "contact", "clean", "pipeline"],
    },
    {
        "id": "brain-002",
        "name": "Login form",
        "input": (
            "Design a login form for a web app. It needs email and password fields, "
            "a submit button, a forgot-password link, and an error state for wrong credentials. "
            "Show me the design."
        ),
        "keywords": ["login", "email", "password", "submit"],
    },
    {
        "id": "brain-003",
        "name": "Todo list REST API",
        "input": (
            "Design a REST API for a todo list app. It needs endpoints to create, list, update, "
            "and delete todos. Each todo has a title, status, and due date. "
            "Show me the design."
        ),
        "keywords": ["todo", "api", "endpoint", "create"],
    },
    {
        "id": "brain-004",
        "name": "Sales dashboard",
        "input": (
            "Design a sales dashboard. It shows monthly revenue, a table of top customers, "
            "pipeline status by stage, and a date range filter. Show me the design."
        ),
        "keywords": ["dashboard", "revenue", "sales", "customer"],
    },
    {
        "id": "brain-005",
        "name": "File upload feature",
        "input": (
            "Design a file upload feature for a web app. Users can drag-and-drop or click to "
            "upload images and documents. It shows upload progress, validates file type and size, "
            "and displays a list of uploaded files. Show me the design."
        ),
        "keywords": ["upload", "file", "progress", "drag"],
    },
]

# ── Criteria ──────────────────────────────────────────────────────────────────

CRITERIA = [
    "C1: Shows error/failure state in ASCII",
    "C2: Architecture has 2+ labeled connections",
    "C3: States at least one specific constraint with a value",
    "C4: Avoids hedging language",
    "C5: Makes a recommendation with a stated reason",
]

# Box-drawing characters that indicate an ASCII diagram
ASCII_CHARS = set("┌┐└┘├┤┬┴┼─│╔╗╚╝╠╣╦╩╬═║")

def has_ascii_diagram(text):
    return any(ch in text for ch in ASCII_CHARS)

def count_ascii_blocks(text):
    """Count distinct ASCII diagram blocks (separated by non-diagram lines)."""
    blocks = 0
    in_block = False
    for line in text.splitlines():
        has_box = any(ch in line for ch in ASCII_CHARS)
        if has_box and not in_block:
            blocks += 1
            in_block = True
        elif not has_box and in_block:
            in_block = False
    return blocks

def count_ascii_components(text):
    """Rough count of distinct UI components in ASCII (buttons, inputs, rows, headers)."""
    patterns = [
        r'\[[\w\s/+\-▾⚙✕]+\]',   # [Button] [+ Add] [User ▾]
        r'\[ *[\w\s]+ *\]',        # [ Input field ]
        r'┌[─]+',                  # box top
        r'├[─]+',                  # box row separator (table row)
        r'│.*│',                   # box content row
    ]
    hits = set()
    for pattern in patterns:
        for m in re.finditer(pattern, text):
            hits.add(m.group(0)[:20])
    return len(hits)

def score_output(output, tool_events, keywords):
    """Score one output against all 5 criteria. Returns list of (passed, note)."""
    results = []
    lower = output.lower()

    # C1: Shows error or failure state in ASCII
    error_keywords = ["error", "invalid", "fail", "404", "401", "422", "500",
                      "wrong", "missing", "⚠", "✕", "red border", "← flagged"]
    ascii_lines = [l for l in output.splitlines() if any(ch in l for ch in ASCII_CHARS)]
    ascii_text = ' '.join(ascii_lines).lower()
    c1 = any(kw in ascii_text for kw in error_keywords)
    results.append((c1, "" if c1 else "No error/failure state found in ASCII blocks"))

    # C2: Architecture has 2+ labeled connections (arrow + text on same line)
    labeled_arrow_pattern = re.compile(r'(?:──▶|─▶|──>|->|→)\s*\S+')
    labeled_arrows = labeled_arrow_pattern.findall(output)
    c2 = len(labeled_arrows) >= 2
    results.append((c2, "" if c2 else f"Only {len(labeled_arrows)} labeled connection(s) found — need 2+"))

    # C3: States at least one specific constraint with a concrete value
    constraint_patterns = [
        r'\d+\s*(?:chars?|characters?|MB|KB|GB|bytes?|px|ms|s\b|min\b|max\b)',
        r'(?:max|min|limit|maximum|minimum)\s+\d+',
        r'\d{3}\b',          # HTTP status codes like 404, 401, 422
        r'(?:must be|required|cannot be|not allowed)',
        r'(?:pending|in_progress|done|active|inactive)\b.*(?:enum|status|state)',
        r'ISO 8601',
        r'uuid',
    ]
    c3 = any(re.search(p, lower) for p in constraint_patterns)
    results.append((c3, "" if c3 else "No specific constraint with a concrete value found"))

    # C4: Avoids hedging language
    hedge_phrases = [
        "you could add", "consider adding", "you might want",
        "optionally", "perhaps", "if needed", "might consider",
        "could also", "you may want"
    ]
    found_hedge = next((p for p in hedge_phrases if p in lower), None)
    c4 = found_hedge is None
    results.append((c4, "" if c4 else f'Hedging language found: "{found_hedge}"'))

    # C5: Makes a recommendation with a stated reason
    reason_patterns = [
        r'because\b', r'\bavoids?\b', r'\bprevents?\b', r'\bensures?\b',
        r'this (?:means|allows|lets|gives|keeps)',
        r'recommendation[:\s]', r'recommended[:\s]',
    ]
    c5 = any(re.search(p, lower) for p in reason_patterns)
    results.append((c5, "" if c5 else "No recommendation with stated reason found"))

    return results

# ── Runner ────────────────────────────────────────────────────────────────────

def run_eval(case, dry_run=False):
    """Run one eval in an isolated Claude CLI subprocess."""
    skill_md = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")

    prompt = f"""You are a brainstorming assistant. Follow the skill instructions below exactly.

<skill>
{skill_md}
</skill>

User request: {case['input']}

Work through the process and produce the full design including ASCII diagrams. Do not ask follow-up questions — proceed directly to the design."""

    if dry_run:
        print(f"  [DRY RUN] Would run: {case['input'][:60]}...")
        return None

    start = time.time()
    tool_events = []
    output = ""

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

        for line in process.stdout:
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
                tool_events.append(event)

                if event.get('type') == 'assistant':
                    for block in event.get('message', {}).get('content', []):
                        if block.get('type') == 'text':
                            print(block.get('text', ''), end='', flush=True)
                        elif block.get('type') == 'tool_use':
                            print(f"\n  [tool: {block.get('name')}]", flush=True)

                elif event.get('type') == 'result':
                    output = event.get('result', '')

            except json.JSONDecodeError:
                pass

        process.wait(timeout=240)

        # Fallback: collect text from assistant messages
        if not output:
            for event in tool_events:
                if event.get('type') == 'assistant':
                    for block in event.get('message', {}).get('content', []):
                        if block.get('type') == 'text':
                            output += block.get('text', '')

    except subprocess.TimeoutExpired:
        process.kill()
        output = "ERROR: timeout"
    except Exception as e:
        output = f"ERROR: {e}"

    duration = int((time.time() - start) * 1000)
    criteria = score_output(output, tool_events, case['keywords'])

    return {
        "id": case['id'],
        "name": case['name'],
        "criteria": criteria,
        "score": sum(1 for passed, _ in criteria if passed),
        "max": len(criteria),
        "output_snippet": output[:500],
        "duration_ms": duration,
    }

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    dry_run = '--dry-run' in sys.argv
    count = next((int(a.split('=')[1]) for a in sys.argv if a.startswith('--count=')), None)

    cases = EVAL_CASES[:count] if count else EVAL_CASES

    print(f"\n{'=' * 60}")
    print("  Brainstorming Skill — Eval Runner")
    print(f"  {len(cases)} runs × {len(CRITERIA)} criteria = {len(cases) * len(CRITERIA)} max points")
    print(f"{'=' * 60}\n")

    results = []
    for case in cases:
        print(f"\n{'─' * 50}")
        print(f"[{case['id']}] {case['name']}")
        print(f"{'─' * 50}")

        result = run_eval(case, dry_run=dry_run)
        if result is None:
            continue
        results.append(result)

        print(f"\n  Score: {result['score']}/{result['max']}  ({result['duration_ms']//1000}s)")
        for i, (passed, note) in enumerate(result['criteria']):
            icon = "  ✓" if passed else "  ✗"
            note_str = f"  ← {note}" if note else ""
            print(f"{icon}  {CRITERIA[i]}{note_str}")

    if dry_run or not results:
        return

    # ── Summary ───────────────────────────────────────────────────────────────
    total_score = sum(r['score'] for r in results)
    max_score = sum(r['max'] for r in results)
    pct = int(total_score / max_score * 100) if max_score else 0

    print(f"\n{'=' * 60}")
    print("  RESULTS")
    print(f"{'=' * 60}")
    print(f"\n  Total: {total_score}/{max_score} ({pct}%)\n")

    print(f"  {'Run':<20} {'Score':>6}  Criteria")
    print(f"  {'─'*20} {'─'*6}  {'─'*25}")
    for r in results:
        icons = ''.join('✓' if p else '✗' for p, _ in r['criteria'])
        print(f"  {r['name']:<20} {r['score']}/{r['max']}    {icons}")

    print(f"\n  Per-criterion pass rate:")
    for i, crit in enumerate(CRITERIA):
        passes = sum(1 for r in results if r['criteria'][i][0])
        print(f"    {passes}/{len(results)}  {crit}")

    # Save results
    OUTPUT_DIR.mkdir(exist_ok=True)
    out_path = OUTPUT_DIR / "brainstorming-eval-results.json"
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "skill": "brainstorming",
            "total_score": total_score,
            "max_score": max_score,
            "pct": pct,
            "results": [
                {**r, "criteria": [(p, n) for p, n in r["criteria"]]}
                for r in results
            ]
        }, f, indent=2, ensure_ascii=False)
    print(f"\n  Saved: output/brainstorming-eval-results.json")


if __name__ == "__main__":
    main()
