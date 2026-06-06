import assert from "node:assert/strict";
import test from "node:test";

import { parseNameStatus, parseStatusPorcelain, renderMarkdown, type WorklogScan } from "./index.js";

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

test("renderMarkdown includes command output and observed changes", () => {
  const scan: WorklogScan = {
    schemaVersion: "0.1",
    generatedAt: "2026-06-06T00:00:00.000Z",
    cwd: "C:\\repo",
    gitRoot: "C:\\repo",
    summary: {
      statusEntryCount: 1,
      diffNameStatusEntryCount: 1,
      hasWorkingTreeChanges: true,
    },
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
    observed: {
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
    },
  };

  const markdown = renderMarkdown(scan);

  assert.match(markdown, /# AI Dev Worklog Scan/);
  assert.match(markdown, /\|  M \| README\.md \|/);
  assert.match(markdown, /git diff --name-status/);
  assert.match(markdown, /M\tREADME\.md/);
});
