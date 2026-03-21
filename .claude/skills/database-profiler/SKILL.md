---
name: database-profiler
description: Profile SQLite databases to understand structure, quality, and statistics. Use when analyzing a new database, checking data quality, or exploring data before analysis.
---

# Database Profiler

When profiling a database, provide:

## 1. Structure Overview
- List all tables
- For each table: column names, data types, row count
- Identify primary keys and foreign key relationships

## 2. Quality Assessment
- Missing values per column (count and percentage)
- Duplicate rows per table
- Referential integrity issues (orphaned foreign keys)

## 3. Statistical Summary
For numeric columns:
- Min, max, mean, median
- Standard deviation
- Outlier candidates (beyond 3 std devs)

For categorical columns:
- Unique value count
- Most common values (top 5)
- Distribution skew

For date columns:
- Date range (earliest to latest)
- Gaps or clustering

## 4. Recommendations
Based on findings, suggest:
- Data quality issues to address
- Interesting patterns to explore
- Next steps for analysis

## Context Management
- Always use LIMIT when exploring individual tables
- Start with aggregations before drilling down
- Report row counts so analyst knows the scale

## Output Format

Use markdown tables for statistics. Be concise but thorough.
