# Changelog

All notable changes to AI Dev Worklog are recorded here.

## 0.4.0 - Unreleased

- Add GitHub Actions CI for install, build, and test validation.
- Add a formal JSON Schema for `latest.json` at `schema/worklog.schema.json`.
- Add this changelog as a lightweight release history.
- Refresh the README roadmap and demo flow around current local CLI capabilities.

## 0.3.0

- Add `.ai-dev-worklog/continue-prompt.md`.
- Add continuation prompt rendering from the structured worklog scan.
- Keep `schemaVersion` at `0.2` because the JSON output structure did not change.
- Update examples and documentation for the continuation prompt output.

## 0.2.0

- Define the structured worklog JSON output shape.
- Set `schemaVersion` to `0.2`.
- Preserve raw git command output under `evidence.git`.
- Add unified observed file changes, validation status, risk signals, and next steps.
- Update README and examples for the structured schema.

## 0.1.0

- Add the local TypeScript CLI core.
- Scan local git evidence from `git status --porcelain`, `git diff --stat`, and `git diff --name-status`.
- Write `.ai-dev-worklog/latest.md` and `.ai-dev-worklog/latest.json`.
- Keep all scan output local to the repository.
