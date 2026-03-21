import { query } from "@anthropic-ai/claude-agent-sdk";
import * as fs from "fs";
import * as path from "path";

const DB_PATH = path.resolve(__dirname, "../../../data/startup-funding.db");
const OUTPUT_DIR = path.resolve(__dirname, "../../../output");

// ── Metric definitions ────────────────────────────────────────────────────────

interface MetricCheck {
  name: string;
  description: string;
  currentQuery: string;   // SQL for current period value
  baselineQuery: string;  // SQL for historical average
  threshold: number;      // Alert if deviation exceeds this (0.2 = 20%)
}

const METRICS: MetricCheck[] = [
  {
    name: "Weekly Funding Volume",
    description: "Total USD raised in the last 7 days vs 90-day weekly average",
    currentQuery: `SELECT COALESCE(SUM(amount_usd), 0) as value
                   FROM funding_rounds
                   WHERE funding_date >= date('2025-01-01', '-7 days')`,
    baselineQuery: `SELECT AVG(weekly_total) as value FROM (
                      SELECT SUM(amount_usd) as weekly_total
                      FROM funding_rounds
                      WHERE funding_date >= date('2025-01-01', '-90 days')
                        AND funding_date < date('2025-01-01', '-7 days')
                      GROUP BY strftime('%Y-%W', funding_date)
                    )`,
    threshold: 0.2,
  },
  {
    name: "Series A Deal Count",
    description: "Series A deals in the last 30 days vs monthly average",
    currentQuery: `SELECT COUNT(*) as value
                   FROM funding_rounds
                   WHERE stage = 'Series A'
                     AND funding_date >= date('2025-01-01', '-30 days')`,
    baselineQuery: `SELECT AVG(monthly_count) as value FROM (
                      SELECT COUNT(*) as monthly_count
                      FROM funding_rounds
                      WHERE stage = 'Series A'
                        AND funding_date < date('2025-01-01', '-30 days')
                      GROUP BY strftime('%Y-%m', funding_date)
                    )`,
    threshold: 0.3,
  },
  {
    name: "Average Deal Size",
    description: "Average round size in the last 30 days vs overall average",
    currentQuery: `SELECT COALESCE(AVG(amount_usd), 0) as value
                   FROM funding_rounds
                   WHERE funding_date >= date('2025-01-01', '-30 days')`,
    baselineQuery: `SELECT AVG(amount_usd) as value
                    FROM funding_rounds
                    WHERE funding_date < date('2025-01-01', '-30 days')`,
    threshold: 0.25,
  },
  {
    name: "New Pre-Seed Activity",
    description: "Pre-Seed rounds in the last 30 days vs monthly average",
    currentQuery: `SELECT COUNT(*) as value
                   FROM funding_rounds
                   WHERE stage = 'Pre-Seed'
                     AND funding_date >= date('2025-01-01', '-30 days')`,
    baselineQuery: `SELECT AVG(monthly_count) as value FROM (
                      SELECT COUNT(*) as monthly_count
                      FROM funding_rounds
                      WHERE stage = 'Pre-Seed'
                        AND funding_date < date('2025-01-01', '-30 days')
                      GROUP BY strftime('%Y-%m', funding_date)
                    )`,
    threshold: 0.25,
  },
];

// ── Agent runner ──────────────────────────────────────────────────────────────

async function runMetricsCheck(): Promise<string> {
  const metricBlock = METRICS.map((m) =>
    `**${m.name}** (${m.description})
- Current period SQL: ${m.currentQuery.replace(/\s+/g, " ").trim()}
- Baseline SQL: ${m.baselineQuery.replace(/\s+/g, " ").trim()}
- Alert threshold: ${m.threshold * 100}% deviation`
  ).join("\n\n");

  const prompt = `You are a metrics monitoring agent. Run the following checks against the SQLite database at ${DB_PATH}.

For each metric:
1. Run the current period SQL query
2. Run the baseline SQL query
3. Calculate % deviation: (current - baseline) / baseline
4. Flag as ANOMALY if |deviation| > threshold
5. If anomaly, provide a 1-sentence hypothesis for the cause

Here are the metrics to check:

${metricBlock}

After checking all metrics, produce:
- A markdown table summarising all results
- A separate ANOMALIES section (if any)
- An overall status line: ALL CLEAR or X ANOMALIES DETECTED

Use sqlite3 via Bash for all queries.`;

  let resultText = "";
  let toolCalls = 0;

  console.log("Running metrics checks...\n");

  for await (const message of query({
    prompt,
    options: {
      allowedTools: ["Bash"],
      maxTurns: 12,
      cwd: path.resolve(__dirname, "../../.."),
    },
  })) {
    if (message.type === "assistant" && "message" in message) {
      const content = (message.message as { content?: Array<{ type: string }> }).content ?? [];
      for (const block of content) {
        if (block.type === "tool_use") {
          toolCalls++;
          process.stdout.write(`  [query #${toolCalls}]`);
        }
      }
    }
    if ("result" in message) {
      resultText = String(message.result);
      console.log(`\n  ✓ Completed (${toolCalls} queries run)\n`);
    }
  }

  return resultText;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const runDate = new Date().toISOString().replace("T", " ").slice(0, 19);

  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║       Daily Metrics Monitoring Agent            ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log(`Run date : ${runDate}`);
  console.log(`Metrics  : ${METRICS.length} checks`);
  console.log(`Database : ${DB_PATH}\n`);

  const start = Date.now();
  const report = await runMetricsCheck();
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  // Build output document
  const output = [
    `# Daily Metrics Report`,
    `_Run: ${runDate}_`,
    "",
    report,
    "",
    `---`,
    `_Agent completed in ${elapsed}s | ${METRICS.length} metrics checked_`,
  ].join("\n");

  // Save
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  const outputPath = path.join(OUTPUT_DIR, "week6-daily-metrics.md");
  fs.writeFileSync(outputPath, output);

  console.log(report);
  console.log(`\n✓ Report saved to output/week6-daily-metrics.md (${elapsed}s)`);
}

main().catch(console.error);
