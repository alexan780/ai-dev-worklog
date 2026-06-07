# Public Launch Kit

This page keeps short public-facing copy for early feedback and open-source program applications.

## Project Snapshot

AI Dev Worklog is a local TypeScript CLI that turns git evidence into a Markdown worklog, a structured JSON report, and a continuation prompt. It is designed for AI-assisted development sessions where a maintainer needs a local, reviewable record of what changed and how to continue.

Current public proof points:

- MIT licensed
- GitHub Actions CI
- JSON Schema for worklog output
- Versioned release history
- Local-first CLI with no API key requirement
- Example worklog output under `examples/basic-worklog`

## Lightweight Outreach Post

I built AI Dev Worklog, a small local CLI for AI-assisted development sessions.

It reads local git evidence and writes:

- `.ai-dev-worklog/latest.md`
- `.ai-dev-worklog/latest.json`
- `.ai-dev-worklog/continue-prompt.md`

The goal is simple: make it easier to review what changed, keep a machine-readable worklog, and continue the next coding session with the right context.

Try it:

```bash
npx ai-dev-worklog scan --intent "Review local changes before opening a pull request"
```

Feedback on the output shape, JSON schema, and continuation prompt would be very useful.

Repository: https://github.com/alexan780/ai-dev-worklog

## Feedback Request

Useful feedback areas:

- Is the Markdown report easy to review before a commit or pull request?
- Does the JSON schema include the right local evidence for automation?
- Is the continuation prompt enough to restart an AI-assisted coding session?
- Which validation evidence should be added next?

## Codex For OSS Application Draft

Project explanation:

AI Dev Worklog is an early open-source local TypeScript CLI for AI-assisted software development. It scans local git evidence and generates a Markdown worklog, structured JSON report, and continuation prompt. The project helps maintainers preserve reviewable context across long coding sessions, pull request preparation, and release checks while keeping source code and generated records local. Current proof points include MIT licensing, GitHub Actions CI, a JSON Schema, example output, and versioned releases.

API credit usage:

I would use API credits to prototype optional open-source maintainer workflows on top of the local JSON output, such as pull request summaries, issue triage notes, release checklists, and risk explanations. The core CLI will remain local-first and dependency-light. Any API-backed workflow would be explicit, optional, documented separately, and tested against public example repositories before being presented as a stable feature.

Current status:

AI Dev Worklog is an early project. Its strongest evidence today is implementation clarity, local-first boundaries, public release history, CI, and a narrow problem that is increasingly common in AI-assisted open-source maintenance.
