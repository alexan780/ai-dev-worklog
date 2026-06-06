# AI Dev Worklog

A local worklog layer for AI coding agents.

AI coding agents are great at changing code.
AI Dev Worklog helps you keep a local, structured record of what happened: the task intent, observed code changes, commands, validations, risks, and continuation context.

It is designed for Codex, Claude Code, Cursor, and other AI coding workflows.

## Why this exists

AI coding work often lives inside chat windows.

When context breaks, tools switch, or a task becomes long, it can be hard to answer:

* What was the original goal?
* What files actually changed?
* Which commands were really run?
* What was verified?
* What still needs checking?
* How should the next AI session continue?

AI Dev Worklog turns AI coding sessions into local, reviewable, reusable development records.

## What it records

AI Dev Worklog is designed to record two kinds of information:

### Declared intent

What the AI agent says it is trying to do.

Examples:

* task goal
* user constraints
* implementation plan
* checkpoint summaries
* final task summary

### Observed evidence

What can be verified from the local development environment.

Examples:

* changed files
* git diff summary
* commands run
* command exit codes
* test/build/lint evidence
* risk signals
* continuation prompt

The goal is not to trust the AI blindly.
The goal is to combine AI-declared context with local evidence.

## What it is not

AI Dev Worklog is not a code reviewer.

It does not prove that code is correct.
It does not replace tests.
It does not read private chat windows.
It does not monitor your whole computer.

It focuses on local AI coding worklogs: what changed, what was run, what was verified, and how to continue.

## Planned workflow

A future AI coding session may produce a local worklog like this:

```text
.ai-dev-worklog/
  latest.md
  latest.json
  sessions/
    2026-06-06-fix-login-layout/
      worklog.md
      worklog.json
      observed-changes.json
      commands.jsonl
      continue-prompt.md
```

The human should be able to open `latest.md` and quickly understand:

* what the AI tried to do
* what actually changed
* what commands were run
* what still needs manual verification
* how to continue in a new AI session

## Roadmap

### v0.1 — Local core

* Scan the current git repository
* Record changed files
* Generate `latest.md` and `latest.json`
* Generate a basic continuation prompt
* Keep all data local

### v0.2 — Worklog schema

* Define a stable JSON structure for AI coding worklogs
* Separate declared intent from observed evidence
* Add basic risk signals
* Add retention and cleanup rules

### v0.3 — Codex integration

* Provide a Codex-friendly workflow
* Add AGENTS.md / Skill instructions
* Let Codex actively write structured worklog events
* Keep git diff as the source of truth for real code changes

### v0.4 — MCP tools

* Provide local MCP tools for AI agents
* Support worklog start, checkpoint, command record, validation record, and finish
* Make the worklog usable across AI coding tools

### v0.5 — Other adapters

* Claude Code
* Cursor
* GitHub Actions
* VS Code / IDE integrations

## Design principles

* Local first
* Evidence before summary
* Human-readable reports
* Machine-readable JSON
* No code upload by default
* No dependency on a single AI coding tool
* Useful even when chat context is lost

## Status

This project is in the early planning and prototyping stage.

The first milestone is a minimal local CLI that can scan a git repository and generate a basic AI development worklog.
