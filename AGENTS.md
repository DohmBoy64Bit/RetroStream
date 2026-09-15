# Project Rules

## Model Selection

**Default model:** Qwen3.6-35B-A3B (text-only, fast, general-purpose)
**Vision model:** Qwen3-VL-4B-Instruct (image analysis, UI review)

### When to switch to vision model

Use the vision model (`Qwen3-VL-4B-Instruct`) when:
- Analyzing screenshots or UI mockups
- Reviewing visual design, contrast, or accessibility
- Comparing design specs to rendered output
- Validating responsive layouts from screenshots
- Any task involving image input

### When to stay on text model

Use the default model (`Qwen3.6-35B-A3B`) for:
- Code editing, refactoring, debugging
- Writing tests, documentation, config
- Running commands, linting, type-checking
- General development tasks
- When no image is involved

### How to switch

- For text tasks: use the default model (no action needed)
- For vision tasks: spawn a subagent with `model: "models--unsloth--qwen3-vl-4b-instruct-gguf-snapshots-00c00da0690c4b14b5539b02c4ea5d7c9-9a7c9846"`
- Or use the `@vision-analyst` agent for dedicated UI review

## Documentation Lookup

**Skill:** `find-docs` — retrieves up-to-date documentation via Context7 CLI

### When to use find-docs

Always use the `find-docs` skill when:
- The user mentions a library, framework, SDK, CLI tool, or cloud service
- Asking "how do I" with a library name (e.g., "how do I set up Tailwind config")
- Debugging library-specific behavior
- Migrating between versions
- Looking up API syntax, configuration options, or CLI flags
- Any question about a specific technology's current behavior

### Rule: Never rely on training data for API details

Your training data may be outdated. Even for well-known libraries (React, Next.js, Prisma, Tailwind, etc.), always verify against current docs first.

### How to use

```bash
# Step 1: Resolve library ID
npx ctx7@latest library <name> "<query>"

# Step 2: Query documentation
npx ctx7@latest docs <libraryId> "<query>"
```

**Important:**
- Always run `library` first to get the valid ID
- Use descriptive queries (not single words): `"React useEffect cleanup async"` not `"hooks"`
- One topic per query — split multi-topic questions
- Max 3 attempts per question
- CONTEXT7_API_KEY is configured — no auth needed for basic usage

## Custom Agents

| Agent | When to use |
|-------|-------------|
| `@css-polisher` | Visual polish — spacing, alignment, typography, color, motion, micro-interactions, contrast fixes, design-system compliance |
| `@documenter` | Writing or updating project docs — README, DESIGN.md, API docs, user guides, onboarding materials |
| `@tester` | Writing tests, debugging failures, verifying code coverage, running the full test/lint suite |
| `@vision-analyst` | Analyzing screenshots, UI mockups, visual design review, contrast/accessibility checks on rendered output |

Delegate to the appropriate agent instead of handling the work yourself when the task matches the column. The agent carries project-specific context (design tokens, test commands, doc conventions) that the main model doesn't.

## File Editing

Prefer targeted edit operations for existing files; use `write` primarily for new files or when most of a file genuinely needs replacement.

## Impeccable Skill Routing

Impeccable workflow commands are Pi skill commands, NOT shell/CLI commands.

When an Impeccable workflow is requested or implied, including when continuing
a list of previously recommended Impeccable actions:

- `polish`
- `typeset`
- `clarify`
- `delight`
- `audit`
- `critique`
- `adapt`
- `animate`
- `bolder`
- `quieter`
- `distill`
- `harden`
- `onboard`
- `colorize`
- `layout`
- `optimize`
- `overdrive`
- `shape`
- `document`
- `extract`
- `craft`

NEVER execute:

`.pi/skills/impeccable/scripts/impeccable <workflow>`
`.pi/skills/impeccable/scripts/impeccable.cmd <workflow>`

For example, NEVER run:

`impeccable.cmd polish`
`impeccable.cmd typeset`
`impeccable.cmd clarify`

Those are not executable CLI verbs.

Instead, treat the requested workflow as `/skill:impeccable <workflow> <target>`.
Load the appropriate Impeccable reference/playbook and perform the work using
the normal Pi tools.

The Impeccable executable under `scripts/` is only for the administrative,
context, detector, hook, and helper operations explicitly instructed by the
Impeccable skill, such as `context`, `detect`, `signals`, `hooks`, `doctor`,
and `pin`.

If the user says "run these one at a time" after Impeccable recommended actions,
continue by loading and executing each recommended Impeccable workflow in order.
Do not translate the workflow names into shell commands.
