import { query } from "@anthropic-ai/claude-agent-sdk";
import * as fs from "fs";
import * as path from "path";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const OUTPUT_DIR = path.join(REPO_ROOT, "output");

// ── Stage runner ───────────────────────────────────────────────────────────────
// Runs a single pipeline stage and streams progress to the console.

async function runStage(
  prompt: string,
  label: string,
  allowedTools: string[],
  model?: string
): Promise<string> {
  console.log(`\n${"─".repeat(52)}`);
  console.log(`▶ ${label}`);
  console.log(`${"─".repeat(52)}`);

  let resultText = "";
  let toolCallCount = 0;

  for await (const message of query({
    prompt,
    options: {
      allowedTools,
      maxTurns: 15,
      cwd: REPO_ROOT,
      ...(model && { model }),
    },
  })) {
    if (message.type === "assistant" && "message" in message) {
      const content = (
        message.message as {
          content?: Array<{ type: string; name?: string }>;
        }
      ).content ?? [];

      for (const block of content) {
        if (block.type === "tool_use") {
          toolCallCount++;
          process.stdout.write(`  [tool #${toolCallCount}: ${block.name ?? "?"}] `);
        }
        if (block.type === "text") {
          process.stdout.write(".");
        }
      }
    }

    if ("result" in message) {
      resultText = String(message.result);
      console.log(`\n  ✓ Done (${toolCallCount} tool calls)`);
    }
  }

  return resultText;
}

// ── Pipeline ───────────────────────────────────────────────────────────────────

const FORMAT_EXTENSIONS: Record<string, string> = {
  csv:   "csv",
  excel: "xlsx",
  word:  "docx",
  text:  "txt",
  json:  "json",
};

async function runPipeline(inputFile: string, format: string = "csv"): Promise<void> {
  const absInput = path.resolve(inputFile);
  const filename = path.basename(absInput);
  const stem = filename.replace(/\.[^.]+$/, "");
  const ext = FORMAT_EXTENSIONS[format] ?? "csv";
  const outputFile = path.join(path.dirname(absInput), `${stem}_cleaned.${ext}`);
  const auditReportPath = path.join(OUTPUT_DIR, `${stem}-audit.md`);

  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║        Contact Pipeline — Headless Runner          ║");
  console.log("╚════════════════════════════════════════════════════╝");
  console.log(`\nInput  : ${absInput}`);
  console.log(`Output : ${outputFile} (${format})`);
  console.log(`Audit  : ${auditReportPath}`);

  if (!fs.existsSync(absInput)) {
    console.error(`\n✗ File not found: ${absInput}`);
    process.exit(1);
  }

  const start = Date.now();

  // ── Stage 1: Audit ───────────────────────────────────────────────────────
  const auditPrompt = `You are a contact data auditor. Analyze the contact file at: ${absInput}

Load it with pandas (use python -c "..." via Bash). Then audit for:

1. VOLUME — total rows, missing name, missing phone, missing address, missing 2+ fields
2. PHONE FORMATS — count each: dashes, brackets, dots, spaces-only, +1 prefix, already clean (11 digits starting with 1), missing, invalid
3. DUPLICATES — duplicate phones (same digits after stripping), duplicate names (case-insensitive)
4. NAME ISSUES — Last/First format (has comma), ALL CAPS, all lowercase, missing
5. ADDRESS ISSUES — missing (blank), incomplete (no digits or under 5 chars)

Print the audit report in exactly this format:

=== Contact File Audit Report ===
File: ${filename}
Rows analyzed: X

--- Volume ---
Total rows:        X
Missing name:      X
Missing phone:     X
Missing address:   X
Missing 2+ fields: X

--- Phone Formats ---
Dashes:            X
Brackets:          X
Dots:              X
Spaces only:       X
+1 prefix:         X
Already clean:     X
Missing:           X
Invalid:           X

--- Duplicates ---
Duplicate phones:  X
Duplicate names:   X

--- Name Issues ---
Last, First format: X
ALL CAPS:           X
all lowercase:      X
Missing:            X

--- Address Issues ---
Missing:            X
Incomplete:         X

=== Recommendation ===
<"File is ready to clean." OR "X issues found — review before cleaning.">

Do not modify the input file. Print only the report above.`;

  const auditResult = await runStage(
    auditPrompt,
    "Stage 1 — Audit",
    ["Bash", "Read"],
    "claude-haiku-4-5-20251001"
  );

  // Save audit report
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  const auditMd = `# Contact Audit Report\n_File: ${filename}_\n_Run: ${new Date().toISOString()}_\n\n\`\`\`\n${auditResult}\n\`\`\`\n`;
  fs.writeFileSync(auditReportPath, auditMd);
  console.log(`\n  Audit report saved to: output/${stem}-audit.md`);

  // ── Stage 2: Clean ───────────────────────────────────────────────────────
  const cleanPrompt = `You are a contact data cleaner. Clean the contact file at: ${absInput}

Use pandas via Python (Bash tool). Apply these rules:

NAMES:
- Strip whitespace, collapse multiple spaces
- Detect "Last, First" by comma → reverse to "First Last"
- Apply str.title() for Title Case
- Missing/blank → leave empty, set needs_review = yes

PHONES (target format: 1XXXXXXXXXX):
- Strip all non-numeric characters
- 10 digits → prepend 1
- 11 digits starting with 1 → keep as-is
- Anything else → keep original, set needs_review = yes

SMS COLUMN:
- Valid phone → last 10 digits (strip leading 1)
- Invalid/missing → empty string

ADDRESSES:
- Keep Street and City_State_Zip as separate columns
- If either Street OR City_State_Zip is blank → set needs_review = yes

NEEDS_REVIEW COLUMN:
- "yes" if any field is missing, blank, or invalid
- "no" otherwise
- Must be the last column

Output columns: Name, Street, City_State_Zip, Phone, SMS, needs_review

Write the cleaned data to: ${outputFile}
Output format: ${format === "excel" ? "Excel (.xlsx) — use openpyxl: df.to_excel(path, index=False)" :
               format === "word"  ? "Word (.docx) — use python-docx: create a Document, add a table, one row per contact, first row bold headers" :
               format === "text"  ? "Tab-delimited text (.txt) — use df.to_csv(path, sep='\\t', index=False)" :
               format === "json"  ? "JSON (.json) — use df.to_json(path, orient='records', indent=2, force_ascii=False)" :
               "CSV (.csv) — use df.to_csv(path, index=False)"}

Then print this summary (use these exact labels):
Cleaning complete.
- Total rows processed: X
- Names fixed: X
- Phones reformatted: X
- Invalid/missing fields flagged: X rows marked needs_review = yes
- Output saved to: ${outputFile}

On the final line, print exactly: FLAGGED_ROWS: X  (replace X with the number of rows where needs_review = yes)`;

  const cleanResult = await runStage(
    cleanPrompt,
    "Stage 2 — Clean",
    ["Bash", "Read", "Write"]
  );

  // ── Stage 3: Report ──────────────────────────────────────────────────────
  const reportPath = path.join(OUTPUT_DIR, `${stem}-report.md`);
  const reportMd = generateReport(auditResult, cleanResult, absInput, outputFile, filename, new Date().toISOString());
  fs.writeFileSync(reportPath, reportMd);
  console.log(`\n${"─".repeat(52)}`);
  console.log(`▶ Stage 3 — Report`);
  console.log(`${"─".repeat(52)}`);
  console.log(`  ✓ Done — saved to: output/${stem}-report.md`);

  // ── Pipeline summary ─────────────────────────────────────────────────────
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  // Extract flagged row count from clean result
  const flaggedMatch = cleanResult.match(/FLAGGED_ROWS:\s*(\d+)/i);
  const flaggedCount = flaggedMatch ? flaggedMatch[1] : "?";

  // Extract total rows from audit result
  const totalMatch = auditResult.match(/Total rows:\s+(\d+)/i);
  const totalRows = totalMatch ? totalMatch[1] : "?";

  console.log(`\n${"═".repeat(52)}`);
  console.log("  PIPELINE COMPLETE");
  console.log(`${"═".repeat(52)}`);
  console.log(`  Input file    : ${filename}`);
  console.log(`  Output file   : ${stem}_cleaned.${ext} (${format})`);
  console.log(`  Audit report  : output/${stem}-audit.md`);
  console.log(`  Pipeline report: output/${stem}-report.md`);
  console.log(`  Rows processed: ${totalRows}`);
  console.log(`  Rows flagged  : ${flaggedCount}`);
  console.log(`  Total time    : ${elapsed}s`);
  console.log(`${"═".repeat(52)}`);
}

// ── Stage 3: Report ────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { fields.push(current); current = ""; }
    else { current += ch; }
  }
  fields.push(current);
  return fields;
}

function generateReport(
  auditResult: string,
  cleanResult: string,
  inputCsvPath: string,
  cleanedCsvPath: string,
  filename: string,
  runTimestamp: string
): string {
  // ── Parse audit stats ──────────────────────────────────────────────────────
  const auditNum = (label: string) => {
    const m = auditResult.match(new RegExp(`${label}[:\\s]+(\\d+)`, "i"));
    return m ? parseInt(m[1]) : 0;
  };
  const totalRows    = auditNum("Total rows");
  const lastFirst    = auditNum("Last, First format");
  const allCaps      = auditNum("ALL CAPS");
  const allLower     = auditNum("all lowercase");
  const phoneInvalid = auditNum("Invalid");
  const phoneMissing = auditNum("Missing");
  const phoneIssues  = auditNum("Dashes") + auditNum("Brackets") + auditNum("Dots") +
                       auditNum("Spaces only") + auditNum("\\+1 prefix");

  // ── Compute actual changes by diffing input vs output CSVs ────────────────
  let namesFixed = 0;
  let phonesFixed = 0;
  try {
    const inputLines  = fs.readFileSync(inputCsvPath,  "utf-8").trim().split(/\r?\n/);
    const outputLines = fs.readFileSync(cleanedCsvPath, "utf-8").trim().split(/\r?\n/);
    const inHeaders  = parseCsvLine(inputLines[0]);
    const outHeaders = parseCsvLine(outputLines[0]);
    const inNameIdx  = inHeaders.indexOf("Name");
    const inPhoneIdx = inHeaders.indexOf("Phone");
    const outNameIdx  = outHeaders.indexOf("Name");
    const outPhoneIdx = outHeaders.indexOf("Phone");
    const rowCount = Math.min(inputLines.length, outputLines.length) - 1;
    for (let i = 1; i <= rowCount; i++) {
      const inCols  = parseCsvLine(inputLines[i]  ?? "");
      const outCols = parseCsvLine(outputLines[i] ?? "");
      const inName  = inCols[inNameIdx]?.trim()  ?? "";
      const outName = outCols[outNameIdx]?.trim() ?? "";
      const inPhone  = inCols[inPhoneIdx]?.trim()  ?? "";
      const outPhone = outCols[outPhoneIdx]?.trim() ?? "";
      if (inName  && outName  && inName  !== outName)  namesFixed++;
      if (inPhone && outPhone && inPhone !== outPhone) phonesFixed++;
    }
  } catch { /* if either file missing, leave counts at 0 */ }

  // ── Parse flagged row count from clean result ──────────────────────────────
  const flaggedMatch = cleanResult.match(/FLAGGED_ROWS:\s*(\d+)/i);
  const flaggedRows  = flaggedMatch ? parseInt(flaggedMatch[1]) : 0;

  // ── Parse cleaned CSV for flagged rows ────────────────────────────────────
  const csvContent = fs.readFileSync(cleanedCsvPath, "utf-8");
  const lines = csvContent.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  const nameIdx  = headers.indexOf("Name");
  const phoneIdx = headers.indexOf("Phone");
  const streetIdx = headers.indexOf("Street");
  const cityIdx  = headers.indexOf("City_State_Zip");
  const reviewIdx = headers.indexOf("needs_review");

  interface FlaggedRow { name: string; phone: string; street: string; city: string; issues: string[]; }
  const flagged: FlaggedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols[reviewIdx]?.trim().toLowerCase() !== "yes") continue;
    const name  = cols[nameIdx]?.trim()  ?? "";
    const phone = cols[phoneIdx]?.trim() ?? "";
    const street = cols[streetIdx]?.trim() ?? "";
    const city  = cols[cityIdx]?.trim()  ?? "";
    const issues: string[] = [];
    if (!name)  issues.push("Missing name");
    if (!city)  issues.push("Missing address");
    if (!phone || !/^1\d{10}$/.test(phone)) issues.push("Invalid/missing phone");
    flagged.push({ name: name || "*(blank)*", phone: phone || "*(blank)*", street, city: city || "*(blank)*", issues });
  }

  // ── Build markdown ─────────────────────────────────────────────────────────
  const pad = (s: string, w: number) => s.padEnd(w);

  let md = `# Contact Pipeline Report\n`;
  md += `_File: ${filename}_\n`;
  md += `_Run: ${runTimestamp}_\n\n`;

  md += `## Summary\n\n`;
  md += `| | Count |\n|---|---|\n`;
  md += `| Total rows processed | ${totalRows} |\n`;
  md += `| Names standardized | ${namesFixed} |\n`;
  md += `| Phones reformatted | ${phonesFixed} |\n`;
  md += `| Rows flagged for review | ${flaggedRows} |\n\n`;

  md += `## Issues Found (Pre-Clean)\n\n`;
  md += `| Category | Count |\n|---|---|\n`;
  if (lastFirst)    md += `| Last, First format | ${lastFirst} |\n`;
  if (allCaps)      md += `| ALL CAPS names | ${allCaps} |\n`;
  if (allLower)     md += `| all lowercase names | ${allLower} |\n`;
  if (phoneIssues)  md += `| Phone format issues | ${phoneIssues} |\n`;
  if (phoneInvalid) md += `| Invalid phones | ${phoneInvalid} |\n`;
  if (phoneMissing) md += `| Missing phones | ${phoneMissing} |\n`;
  md += `\n`;

  md += `## Rows Requiring Manual Review\n\n`;
  if (flagged.length === 0) {
    md += `_No rows flagged — all records cleaned successfully._\n`;
  } else {
    md += `| Name | Phone | Street | City / State / Zip | Issue |\n`;
    md += `|---|---|---|---|---|\n`;
    for (const r of flagged) {
      md += `| ${r.name} | ${r.phone} | ${r.street} | ${r.city} | ${r.issues.join(", ")} |\n`;
    }
  }

  return md;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const inputFile = args.find(a => !a.startsWith("--"));
  const formatArg = args.find(a => a.startsWith("--format="))?.split("=")[1]
                 ?? (args.indexOf("--format") !== -1 ? args[args.indexOf("--format") + 1] : undefined);
  const format = formatArg && FORMAT_EXTENSIONS[formatArg] ? formatArg : "csv";

  if (!inputFile) {
    console.error("Usage: ts-node src/index.ts <path-to-contact-file> [--format csv|excel|word|text|json]");
    console.error("  Example: ts-node src/index.ts data/contacts.csv --format excel");
    process.exit(1);
  }

  if (formatArg && !FORMAT_EXTENSIONS[formatArg]) {
    console.error(`✗ Unknown format: "${formatArg}". Valid options: csv, excel, word, text, json`);
    process.exit(1);
  }

  await runPipeline(inputFile, format);
}

main().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
