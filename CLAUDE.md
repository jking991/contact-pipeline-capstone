# Contact Pipeline Capstone

Claude Agents Workshop — Capstone Project

## Project Purpose

A headless AI agent pipeline that ingests raw contact data (CSV/Excel), audits it for quality issues, cleans and standardises it, and generates a formatted output report — all driven programmatically via the Claude Agent SDK.

## Pipeline Stages

1. **Audit** — `contact-audit` skill: flags volume, phone formats, duplicates, name issues, address issues
2. **Clean** — `contact-cleaner` skill: standardises names (Title Case), phones (1XXXXXXXXXX), addresses
3. **Report** — structured markdown output summarising what was found and fixed

## Skills Available

- `/contact-audit` — pre-clean audit report. Run this first.
- `/contact-cleaner` — cleans names, phones, addresses. Run after audit.
- `/database-profiler` — profiles SQLite databases
- `/data-analyst` — SQL-based data analysis loop

## Key Preferences

- Use simple, readable solutions
- Always audit before cleaning
- Save outputs to `output/`
- Format reports as markdown tables where appropriate
- Phone output format: `1XXXXXXXXXX` + separate `SMS` column
- Address default: Street + City_State_Zip combined unless split is requested
- Never ask about address format — default to combined

## My Focus

Cleaning and formatting structured contact data (names, phone numbers, addresses) in Excel/CSV files for consistency and usability.

Key metrics:
- Data accuracy (correctly parsed/formatted fields)
- Consistency (uniform formatting across records)
- Completeness (identifying missing or incomplete entries)
