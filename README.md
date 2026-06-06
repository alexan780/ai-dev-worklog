# AI Dev Worklog

[![CI](https://github.com/alexan780/ai-dev-worklog/actions/workflows/ci.yml/badge.svg)](https://github.com/alexan780/ai-dev-worklog/actions/workflows/ci.yml)

A local CLI that turns git evidence into a readable AI development worklog.

AI Dev Worklog scans the current git repository and writes a Markdown report, a JSON report, and a continuation prompt. It is useful when an AI-assisted coding session needs a local, reviewable record of what changed and how to continue.

The CLI is intentionally small and local-first: it reads git evidence, writes files under `.ai-dev-worklog/`, and keeps the output on your machine.

## What It Does Now

`ai-dev-worklog scan` records:

- changed files from `git status --porcelain`
- tracked file changes from `git diff --name-status`
- diff summary from `git diff --stat`
- raw command output for the scanned git commands
- structured JSON fields for evidence, observed changes, validation status, risk signals, and next steps
- a continuation prompt file for the next development session

## Quick Start

```bash
git clone https://github.com/alexan780/ai-dev-worklog.git
cd ai-dev-worklog
npm ci
npm run build
node dist/index.js scan
```

## Local Output

Running `node dist/index.js scan` writes:

```text
.ai-dev-worklog/
  latest.md
  latest.json
  continue-prompt.md
```

`latest.md` is the human-readable report.
`latest.json` is the machine-readable scan result. It uses a structured worklog schema that separates git evidence, observed changes, validation status, risk signals, and next steps. The formal JSON Schema is available at [`schema/worklog.schema.json`](schema/worklog.schema.json).
`continue-prompt.md` is a prompt-oriented summary for continuing the development session.

Example output is available in [`examples/basic-worklog`](examples/basic-worklog).

Example summary:

```text
## Summary

- Git status entries: 2
- Git diff name-status entries: 2
- Changed files: 2
- Working tree has changes: yes
- Validation: not_recorded
- Risk signals: 0
```

## What The CLI Scans

The local CLI reads these git commands:

```bash
git status --porcelain
git diff --stat
git diff --name-status
```

The scan uses local git evidence as the source of truth for observed code changes.

The CLI does not read chat windows, call AI APIs, upload code, or integrate with Codex App, Claude Code, Cursor, or MCP tools.

## Why This Exists

When context breaks, tools switch, or a task becomes long, it can be hard to answer:

- What files actually changed?
- What git evidence is available?
- What still needs checking?
- How should the next session continue?

AI Dev Worklog turns AI-assisted coding sessions into local, reviewable development records.

## Local Development

Install dependencies:

```bash
npm ci
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

GitHub Actions runs the same install, build, and test checks on pushes to `main` and on pull requests.

## What It Records

The CLI records observed local git evidence.

Current output includes:

- changed files from `git status --porcelain`
- tracked file changes from `git diff --name-status`
- diff summary from `git diff --stat`
- raw command output for the scanned git commands
- a JSON worklog schema with declared intent, evidence, observed changes, validation status, risk signals, and next steps
- a continuation prompt file with changed files, command results, risk signals, remaining checks, and suggested next steps

Future versions may add user-provided declared intent, command history, and validation evidence.

## What It Is

- Local first
- Evidence before summary
- Human-readable Markdown
- Machine-readable JSON
- Minimal dependencies

## Roadmap

### Released

#### v0.1 - Local Core

- Scan the current git repository
- Record changed files from local git evidence
- Generate `latest.md` and `latest.json`
- Keep all data local

#### v0.2 - Worklog Schema

- Define a stable JSON structure for AI coding worklogs
- Separate declared intent from observed evidence
- Add unified observed file changes
- Add validation status and basic risk signals

#### v0.3 - Continuation Prompt

- Generate a continuation prompt for the next development session
- Keep git evidence as the source of truth for observed code changes

#### v0.4 - Open-source Readiness

- Add GitHub Actions CI
- Add a formal JSON Schema file for `latest.json`
- Add a changelog and release history
- Improve README demo flow and roadmap clarity

### Future Work

- User-provided declared intent
- Command history and validation evidence
- Optional workflow guides for AI coding tools
- Package publishing strategy

## Status

This project is in early development.
The CLI scans a git repository and generates a local Markdown worklog, a structured JSON scan result, and a continuation prompt.

The next milestones focus on strengthening the local CLI contract before adding optional workflow integrations.
