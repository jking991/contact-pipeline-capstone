---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---

# Brainstorming Ideas Into Designs

Help turn ideas into fully formed designs through natural collaborative dialogue. Present all designs as ASCII diagrams directly in the conversation — NO files written to disk, NO browser tools.

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY project regardless of perceived simplicity.
Do NOT write any spec or design document to disk.
Do NOT offer, mention, or use a visual companion, browser tool, or local server.
</HARD-GATE>

## Anti-Pattern: "This Is Too Simple To Need A Design"

Every project goes through this process. A todo list, a single-function utility, a config change — all of them. "Simple" projects are where unexamined assumptions cause the most wasted work. The design can be short (a few sentences for truly simple projects), but you MUST present it and get approval.

## Checklist

You MUST complete these items in order:

1. **Explore project context** — check files, docs, recent commits
2. **Ask clarifying questions** — one at a time, understand purpose/constraints/success criteria
3. **Propose 2-3 approaches** — with trade-offs and your recommendation
4. **Present ASCII UI mockup** — draw the app itself: screens, buttons, inputs, panels, navigation. See ASCII Design section below.
5. **Present ASCII architecture diagram** — draw how components/systems connect and data flows between them
6. **Get user approval** — confirm both diagrams look right before proceeding
7. **Transition to implementation** — invoke writing-plans skill to create implementation plan

## Process Flow

```
Explore context
      │
      ▼
Ask clarifying questions (one at a time)
      │
      ▼
Propose 2-3 approaches
      │
      ▼
Draw ASCII UI mockup  ──── revise? ──▶ redraw
      │
      ▼
Draw ASCII architecture diagram  ──── revise? ──▶ redraw
      │
      ▼
User approves both diagrams
      │
      ▼
Invoke writing-plans
```

**The terminal state is invoking writing-plans.** Do NOT invoke any other implementation skill.

## ASCII Design

Every design session produces TWO ASCII drawings, presented in the conversation. Nothing is written to disk.

### 1. UI Mockup

Draw the actual app — what the user sees and interacts with. Show:
- Screen layout (header, sidebar, main content, footer)
- Buttons, inputs, dropdowns, tables, cards
- Navigation elements
- Key states (empty state, filled state, error state if relevant)

Use box-drawing characters for panels and borders:

```
┌─────────────────────────────────────────┐
│  MyApp                    [User ▾] [⚙]  │
├──────────┬──────────────────────────────┤
│ Nav      │  Main Content                │
│ ─────    │                              │
│ > Home   │  ┌──────────────────────┐    │
│   Items  │  │  [ Search...      ]  │    │
│   Reports│  └──────────────────────┘    │
│          │                              │
│          │  [+ Add]   [Export ▾]        │
│          │                              │
│          │  ┌──────┬────────┬───────┐   │
│          │  │ Name │ Status │ Date  │   │
│          │  ├──────┼────────┼───────┤   │
│          │  │ ...  │  ...   │  ...  │   │
│          │  └──────┴────────┴───────┘   │
└──────────┴──────────────────────────────┘
```

Scale detail to the complexity of the project. Simple projects need simple mockups.

### 2. Architecture Diagram

Draw how the system is built — components, data flow, integrations:

```
  [Browser]
      │  HTTP
      ▼
  [Frontend]  ──── API calls ────▶  [Backend API]
                                         │
                                    ┌────┴────┐
                                    │   DB    │
                                    └─────────┘
```

Show:
- Major components (frontend, backend, database, external services)
- How they connect (HTTP, events, queues, direct calls)
- Where data lives and flows

Keep it simple. If a component doesn't exist yet, draw it as `[Component?]`.

## The Process

**Understanding the idea:**

- Check out the current project state first (files, docs, recent commits)
- Before asking detailed questions, assess scope: if the request describes multiple independent subsystems, flag this immediately
- If the project is too large for a single design, help the user decompose into sub-projects
- For appropriately-scoped projects, ask questions one at a time to refine the idea
- Prefer multiple choice questions when possible
- Only one question per message
- Focus on understanding: purpose, constraints, success criteria

**Exploring approaches:**

- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

**Drawing the design:**

- Once you understand what you're building, draw the UI mockup first
- Then draw the architecture diagram
- Ask after each drawing whether it looks right
- Be ready to redraw if something doesn't match the user's mental model
- Keep drawings proportional to complexity — don't over-engineer the ASCII

**Design for isolation and clarity:**

- Break the system into smaller units that each have one clear purpose
- For each unit: what does it do, how do you use it, what does it depend on?
- Smaller, well-bounded units are easier to implement and reason about

**Working in existing codebases:**

- Explore the current structure before proposing changes. Follow existing patterns.
- Include targeted improvements as part of the design where existing code has problems
- Don't propose unrelated refactoring

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Always propose 2-3 approaches before settling
- **Draw, don't describe** - Show the design as ASCII, don't just write paragraphs about it
- **No files, no browser** - Everything stays in the conversation
- **Be flexible** - Redraw when something doesn't make sense
