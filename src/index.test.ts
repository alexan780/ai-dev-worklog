import assert from "node:assert/strict";
import test from "node:test";

import {
  buildObservedFiles,
  buildRiskSignals,
  parseNameStatus,
  parseStatusPorcelain,
  renderMarkdown,
  type WorklogScan,
} from "./index.js";

test("parseStatusPorcelain parses simple and renamed entries", () => {
  const entries = parseStatusPorcelain(" M README.md\nR  old.ts -> new.ts\n?? package.json");

  assert.deepEqual(entries, [
    {
      indexStatus: " ",
      workingTreeStatus: "M",
      path: "README.md",
      raw: " M README.md",
    },
    {
      indexStatus: "R",
      workingTreeStatus: " ",
      previousPath: "old.ts",
      path: "new.ts",
      raw: "R  old.ts -> new.ts",
    },
    {
      indexStatus: "?",
      workingTreeStatus: "?",
      path: "package.json",
      raw: "?? package.json",
    },
  ]);
});

test("parseNameStatus parses modified and renamed entries", () => {
  const entries = parseNameStatus("M\tREADME.md\nR100\told.ts\tnew.ts");

  assert.deepEqual(entries, [
    {
      status: "M",
      path: "README.md",
      raw: "M\tREADME.md",
    },
    {
      status: "R100",
      previousPath: "old.ts",
      path: "new.ts",
      raw: "R100\told.ts\tnew.ts",
    },
  ]);
});

test("buildObservedFiles merges status and diff name-status evidence", () => {
  const statusEntries = parseStatusPorcelain(" M README.md\n?? notes.md\nR  old.ts -> new.ts");
  const diffNameStatusEntries = parseNameStatus("M\tREADME.md\nR100\told.ts\tnew.ts");

  const files = buildObservedFiles(statusEntries, diffNameStatusEntries);

  assert.deepEqual(files, [
    {
      path: "README.md",
      previousPath: null,
      status: "modified",
      sources: ["git status --porcelain", "git diff --name-status"],
    },
    {
      path: "notes.md",
      previousPath: null,
      status: "untracked",
      sources: ["git status --porcelain"],
    },
    {
      path: "new.ts",
      previousPath: "old.ts",
      status: "renamed",
      sources: ["git status --porcelain", "git diff --name-status"],
    },
  ]);
});

test("buildRiskSignals reports untracked, deleted, and renamed files", () => {
  const files = buildObservedFiles(
    parseStatusPorcelain("?? notes.md\n D removed.ts\nR  old.ts -> new.ts"),
    parseNameStatus("D\tremoved.ts\nR100\told.ts\tnew.ts"),
  );

  const riskSignals = buildRiskSignals(files);

  assert.deepEqual(riskSignals, {
    items: [
      {
        kind: "untracked_files",
        severity: "info",
        message: "Untracked files are present.",
        paths: ["notes.md"],
      },
      {
        kind: "deleted_files",
        severity: "warning",
        message: "Deleted files are present.",
        paths: ["removed.ts"],
      },
      {
        kind: "renamed_files",
        severity: "info",
        message: "Renamed files are present.",
        paths: ["new.ts"],
      },
    ],
  });
});

test("renderMarkdown includes command output and observed changes", () => {
  const scan: WorklogScan = {
    schemaVersion: "0.2",
    generatedAt: "2026-06-06T00:00:00.000Z",
    tool: {
      name: "ai-dev-worklog",
      version: "0.2.0",
      command: "ai-dev-worklog scan",
    },
    repository: {
      cwd: "C:\\repo",
      gitRoot: "C:\\repo",
    },
    declaredIntent: {
      status: "not_provided",
      source: "not_provided",
      summary: null,
    },
    summary: {
      statusEntryCount: 1,
      diffNameStatusEntryCount: 1,
      changedFileCount: 1,
      hasWorkingTreeChanges: true,
      validationStatus: "not_recorded",
      riskSignalCount: 0,
    },
    evidence: {
      git: {
        statusPorcelain: {
          command: "git status --porcelain",
          stdout: " M README.md",
          stderr: "",
          exitCode: 0,
        },
        diffStat: {
          command: "git diff --stat",
          stdout: " README.md | 1 +",
          stderr: "",
          exitCode: 0,
        },
        diffNameStatus: {
          command: "git diff --name-status",
          stdout: "M\tREADME.md",
          stderr: "",
          exitCode: 0,
        },
      },
    },
    observedChanges: {
      statusEntries: [
        {
          indexStatus: " ",
          workingTreeStatus: "M",
          path: "README.md",
          raw: " M README.md",
        },
      ],
      diffNameStatusEntries: [
        {
          status: "M",
          path: "README.md",
          raw: "M\tREADME.md",
        },
      ],
      files: [
        {
          path: "README.md",
          previousPath: null,
          status: "modified",
          sources: ["git status --porcelain", "git diff --name-status"],
        },
      ],
    },
    validation: {
      status: "not_recorded",
      commands: [],
    },
    riskSignals: {
      items: [],
    },
    nextSteps: {
      items: [],
      continuationPrompt: "Use this local git evidence to continue the development session. Review the changed files, verify the listed commands, and decide the next implementation or validation step from the current repository state.",
    },
  };

  const json = JSON.parse(JSON.stringify(scan)) as Record<string, unknown>;
  assert.equal(json.schemaVersion, "0.2");
  assert.deepEqual(Object.keys(json), [
    "schemaVersion",
    "generatedAt",
    "tool",
    "repository",
    "declaredIntent",
    "summary",
    "evidence",
    "observedChanges",
    "validation",
    "riskSignals",
    "nextSteps",
  ]);
  assert.equal("cwd" in json, false);
  assert.equal("gitRoot" in json, false);
  assert.equal("git" in json, false);
  assert.equal("observed" in json, false);

  const markdown = renderMarkdown(scan);

  assert.match(markdown, /# AI Dev Worklog Scan/);
  assert.match(markdown, /Changed files: 1/);
  assert.match(markdown, /\| modified \| README\.md \|  \| git status --porcelain, git diff --name-status \|/);
  assert.match(markdown, /\|  M \| README\.md \|/);
  assert.match(markdown, /git diff --name-status/);
  assert.match(markdown, /M\tREADME\.md/);
});
