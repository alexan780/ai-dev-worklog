# AI Dev Worklog

A local worklog layer for AI-assisted development.

AI Dev Worklog helps record local evidence from a development session so the current state is easier to review and continue later.

v0.1 is intentionally small: it scans the current git repository and writes a Markdown report plus a JSON report.

## Quick Start

```bash
npm install
npm run build
node dist/index.js scan
```

## Local Output

Running `node dist/index.js scan` writes:

```text
.ai-dev-worklog/
  latest.md
  latest.json
```

`latest.md` is the human-readable report.
`latest.json` is the machine-readable scan result.

## What v0.1 Scans

The local CLI reads these git commands:

```bash
git status --porcelain
git diff --stat
git diff --name-status
```

The scan uses local git evidence as the source of truth for observed code changes.

v0.1 does not read chat windows, call AI APIs, upload code, or integrate with Codex App, Claude Code, Cursor, or MCP tools.

## Local Development

Install dependencies:

```bash
npm install
```

Build the TypeScript CLI:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Run a local scan:

```bash
node dist/index.js scan
```

Generated build output goes to `dist/`.
Generated worklog output goes to `.ai-dev-worklog/`.

## Why This Exists

When context breaks, tools switch, or a task becomes long, it can be hard to answer:

- What files actually changed?
- What git evidence is available?
- What still needs checking?
- How should the next session continue?

AI Dev Worklog turns AI coding sessions into local, reviewable, reusable development records.

## What It Records

v0.1 records observed local git evidence.

Current output includes:

- changed files from `git status --porcelain`
- tracked file changes from `git diff --name-status`
- diff summary from `git diff --stat`
- raw command output for the scanned git commands

Future versions may add declared intent, command history, validation evidence, and continuation prompts with a fuller schema.

## What It Is

- Local first
- Evidence before summary
- Human-readable Markdown
- Machine-readable JSON
- Minimal dependencies

## Roadmap

### v0.1 - Local Core

- Scan the current git repository
- Record changed files from local git evidence
- Generate `latest.md` and `latest.json`
- Keep all data local

### v0.2 - Worklog Schema

- Define a stable JSON structure for AI coding worklogs
- Separate declared intent from observed evidence
- Add basic risk signals
- Add retention and cleanup rules

### v0.3 - Agent Workflows

- Add optional workflows for AI coding tools
- Keep git evidence as the source of truth for observed code changes

### v0.4 - MCP Tools

- Provide local MCP tools for AI agents
- Support worklog start, checkpoint, command record, validation record, and finish

### v0.5 - Other Adapters

- GitHub Actions
- VS Code / IDE integrations

## Status

This project is in early development.
The first milestone is a minimal local CLI that scans a git repository and generates a basic local worklog.
