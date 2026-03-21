import { query } from "@anthropic-ai/claude-agent-sdk";
import * as fs from "fs";
import * as path from "path";

const DB_PATH = path.resolve(__dirname, "../../../data/startup-funding.db");
const OUTPUT_DIR = path.resolve(__dirname, "../../../output");
const MAX_RETRIES = 3;

// ── Streaming helper ──────────────────────────────────────────────────────────
// Runs a query with live progress logging and returns the final result text.
// Captures session_id on first call so it can be passed back for session chaining.

async function runAnalysis(
  prompt: string,
  label: string,
  resumeSessionId?: string,
  retryCount = 0
): Promise<{ text: string; sessionId: string }> {
  console.log(`\n${"─".repeat(50)}`);
  console.log(`▶ ${label}`);
  console.log(`${"─".repeat(50)}`);

  let resultText = "";
  let sessionId = resumeSessionId ?? "";
  let toolCallCount = 0;

  try {
    for await (const message of query({
      prompt,
      options: {
        allowedTools: ["Bash"],
        maxTurns: 10,
        cwd: path.resolve(__dirname, "../../.."),
        ...(resumeSessionId ? { resume: resumeSessionId } : {}),
      },
    })) {
      // Capture session ID from init message
      if (message.type === "system" && message.subtype === "init") {
        sessionId = (message as unknown as { session_id: string }).session_id ?? sessionId;
      }

      // Stream tool calls as progress indicators
      if (message.type === "assistant" && "message" in message) {
        const content = (message.message as { content?: Array<{ type: string; name?: string; input?: unknown }> }).content ?? [];
        for (const block of content) {
          if (block.type === "tool_use") {
            toolCallCount++;
            process.stdout.write(`  [tool #${toolCallCount}: Bash] `);
          }
          if (block.type === "text") {
            const text = (block as { type: string; text?: string }).text ?? "";
            if (text.trim()) process.stdout.write(".");
          }
        }
      }

      // Capture final result
      if ("result" in message) {
        resultText = String(message.result);
        console.log(`\n  ✓ Done (${toolCallCount} tool calls)`);
      }
    }
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const wait = (retryCount + 1) * 3000;
      console.log(`\n  ⚠ Error: ${error instanceof Error ? error.message : "Unknown"}. Retrying in ${wait / 1000}s... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, wait));
      return runAnalysis(prompt, label, resumeSessionId, retryCount + 1);
    }
    console.log(`\n  ✗ Failed after ${MAX_RETRIES} retries: ${error instanceof Error ? error.message : "Unknown"}`);
    resultText = `> ⚠ Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`;
  }

  return { text: resultText, sessionId };
}

// ── Report generator ──────────────────────────────────────────────────────────

async function generateReport(): Promise<string> {
  const sections: string[] = [];
  let sessionId: string | undefined;

  // ── Section 1: Funding trends by quarter ────────────────────────────────
  const q1 = await runAnalysis(
    `Using sqlite3 against the database at ${DB_PATH}, analyze funding trends by quarter.
Show:
- Total amount raised per quarter (format: YYYY-Q#)
- Number of deals per quarter
- Average deal size per quarter
- Which quarters had the most activity

Present as a markdown table and add 2-3 sentences of commentary on the trend.`,
    "Section 1: Funding Trends by Quarter"
  );
  sections.push("## 1. Funding Trends by Quarter\n\n" + q1.text);
  sessionId = q1.sessionId;

  // ── Section 2: Top investors ─────────────────────────────────────────────
  const q2 = await runAnalysis(
    `Using sqlite3 against ${DB_PATH}, analyze the top investors by deal count.
Show:
- Top 10 investors by number of deals led
- Their investor type (VC, Seed Fund, Corporate, etc.)
- Total capital deployed across their deals
- Most common stage they invest in

Present as a markdown table with a brief commentary paragraph.`,
    "Section 2: Top Investors by Deal Count",
    sessionId
  );
  sections.push("## 2. Top Investors by Deal Count\n\n" + q2.text);

  // ── Section 3: Industry breakdown ───────────────────────────────────────
  const q3 = await runAnalysis(
    `Using sqlite3 against ${DB_PATH}, provide an industry breakdown.
Show:
- Number of startups per industry
- Total funding raised per industry
- Average funding round size per industry
- Which industries are most represented at Series A+

Present as a markdown table and highlight the top 3 industries worth watching.`,
    "Section 3: Industry Breakdown",
    sessionId
  );
  sections.push("## 3. Industry Breakdown\n\n" + q3.text);

  // ── Follow-up: Session-based synthesis ──────────────────────────────────
  const q4 = await runAnalysis(
    `Based on the funding trends, investor activity, and industry data you've just analyzed, write an executive summary covering:
- The overall health of the startup ecosystem in this dataset
- Which sectors and stages are attracting the most capital
- 3 key observations an investor or founder should take away
- Any data quality caveats worth noting (e.g. sparse metrics coverage)

Write in markdown, 200-300 words.`,
    "Follow-up: Executive Summary (session context)",
    sessionId
  );
  sections.push("## Executive Summary\n\n" + q4.text);

  // ── Assemble full report ─────────────────────────────────────────────────
  const date = new Date().toISOString().split("T")[0];
  const report = [
    `# Startup Funding Analysis Report`,
    `_Generated: ${date}_`,
    `_Database: startup-funding.db (200 startups, 479 funding rounds, 66 investors)_`,
    "",
    ...sections,
  ].join("\n\n");

  return report;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║     Automated Report Generator — Week 6 HW      ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`\nDatabase : ${DB_PATH}`);
  console.log(`Output   : ${OUTPUT_DIR}/week6-homework-report.md`);
  console.log(`Retries  : up to ${MAX_RETRIES} per section`);

  const start = Date.now();
  const report = await generateReport();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  // Save report
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  const outputPath = path.join(OUTPUT_DIR, "week6-homework-report.md");
  fs.writeFileSync(outputPath, report);

  console.log(`\n${"═".repeat(50)}`);
  console.log(`✓ Report saved to output/week6-homework-report.md`);
  console.log(`  Total time: ${elapsed}s`);
  console.log(`  Sections  : 3 analyses + 1 executive summary`);
  console.log(`${"═".repeat(50)}`);
}

main().catch(console.error);
