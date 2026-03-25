# Eval Criteria: brainstorming

Each criterion is answered yes/no per output.
Score = passes / (N outputs x criteria count).

1. Does the design show at least one error or failure state in the ASCII (e.g., error banner in UI mockup, failure path in architecture, or error response shape)?
2. Does the architecture diagram have at least 2 labeled connections — arrows with text describing what data or message flows between components (not just bare arrows or lines)?
3. Does the design state at least one specific constraint with a concrete value (e.g., character limit, file size, status code, enum value, rate limit)?
4. Does the response avoid hedging language ("you could add", "consider adding", "you might want", "optionally", "perhaps", "if needed")?
5. Does the design make at least one explicit recommendation with a stated reason — using "because", "avoids", "prevents", or equivalent causal language?
