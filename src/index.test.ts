import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildObservedFiles,
  buildRiskSignals,
  parseNameStatus,
  parseStatusPorcelain,
  renderContinuePrompt,
  renderMarkdown,
  writeScanOutputs,
  type WorklogScan,
} from "./index.js";

function createSampleScan(gitRoot: string = "C:\\repo"): WorklogScan {
  return {
    schemaVersion: "0.3",
    generatedAt: "2026-06-06T00:00:00.000Z",
    tool: {
      name: "ai-dev-worklog",
      version: "0.5.0",
      command: "ai-dev-worklog scan",
    },
    repository: {
      cwd: gitRoot,
      gitRoot,
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
}

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
  const scan = createSampleScan();

  const json = JSON.parse(JSON.stringify(scan)) as Record<string, unknown>;
  assert.equal(json.schemaVersion, "0.3");
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
  assert.match(markdown, /Declared intent: Not provided by this local scan\./);
  assert.match(markdown, /\| modified \| README\.md \|  \| git status --porcelain, git diff --name-status \|/);
  assert.match(markdown, /\|  M \| README\.md \|/);
  assert.match(markdown, /git diff --name-status/);
  assert.match(markdown, /M\tREADME\.md/);
});

test("renderContinuePrompt includes continuation sections and empty states", () => {
  const prompt = renderContinuePrompt(createSampleScan());

  assert.match(prompt, /# Continue This Development Session/);
  assert.match(prompt, /## Original Task Goal/);
  assert.match(prompt, /Not provided by this local scan\./);
  assert.match(prompt, /## Repository/);
  assert.match(prompt, /- Working directory: C:\\repo/);
  assert.match(prompt, /## Changed Files/);
  assert.match(prompt, /\| modified \| README\.md \|  \| git status --porcelain, git diff --name-status \|/);
  assert.match(prompt, /## Command Results/);
  assert.match(prompt, /- `git status --porcelain`: exit code 0/);
  assert.match(prompt, /- `git diff --stat`: exit code 0/);
  assert.match(prompt, /- `git diff --name-status`: exit code 0/);
  assert.match(prompt, /## Risk Signals/);
  assert.match(prompt, /No risk signals recorded\./);
  assert.match(prompt, /## Remaining Checks/);
  assert.match(prompt, /- Validation has not been recorded by this local scan\./);
  assert.match(prompt, /## Suggested Next Steps/);
  assert.match(prompt, /Use this local git evidence to continue the development session/);
});

test("renderContinuePrompt handles empty changed files", () => {
  const scan = createSampleScan();
  scan.observedChanges.files = [];
  scan.summary.changedFileCount = 0;

  const prompt = renderContinuePrompt(scan);

  assert.match(prompt, /No changed files observed\./);
});

test("render outputs include provided CLI intent", () => {
  const scan = createSampleScan();
  scan.declaredIntent = {
    status: "provided",
    source: "cli_option",
    summary: "Prepare public credibility materials before applying to an OSS program.",
  };

  const markdown = renderMarkdown(scan);
  const prompt = renderContinuePrompt(scan);

  assert.match(markdown, /Declared intent: Prepare public credibility materials before applying to an OSS program\./);
  assert.match(prompt, /Prepare public credibility materials before applying to an OSS program\./);
});

test("writeScanOutputs writes markdown, json, and continuation prompt outputs", async () => {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "ai-dev-worklog-test-"));

  try {
    const scan = createSampleScan(tempDirectory);
    const outputs = await writeScanOutputs(scan);

    assert.equal(outputs.markdownPath, path.join(tempDirectory, ".ai-dev-worklog", "latest.md"));
    assert.equal(outputs.jsonPath, path.join(tempDirectory, ".ai-dev-worklog", "latest.json"));
    assert.equal(outputs.continuePromptPath, path.join(tempDirectory, ".ai-dev-worklog", "continue-prompt.md"));

    const [markdown, json, prompt] = await Promise.all([
      readFile(outputs.markdownPath, "utf8"),
      readFile(outputs.jsonPath, "utf8"),
      readFile(outputs.continuePromptPath, "utf8"),
    ]);

    assert.match(markdown, /# AI Dev Worklog Scan/);
    assert.equal(JSON.parse(json).tool.version, "0.5.0");
    assert.match(prompt, /# Continue This Development Session/);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test("worklog JSON schema describes the current JSON contract", async () => {
  const schemaPath = path.join(process.cwd(), "schema", "worklog.schema.json");
  const schema = JSON.parse(await readFile(schemaPath, "utf8")) as {
    $schema?: string;
    properties?: {
      schemaVersion?: {
        const?: string;
      };
    };
  };

  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.properties?.schemaVersion?.const, "0.3");
});
