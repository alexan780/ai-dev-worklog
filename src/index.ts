#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const outputDirectoryName = ".ai-dev-worklog";

export interface GitCommandResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface StatusEntry {
  indexStatus: string;
  workingTreeStatus: string;
  path: string;
  previousPath?: string;
  raw: string;
}

export interface NameStatusEntry {
  status: string;
  path: string;
  previousPath?: string;
  raw: string;
}

export interface WorklogScan {
  schemaVersion: "0.1";
  generatedAt: string;
  cwd: string;
  gitRoot: string;
  summary: {
    statusEntryCount: number;
    diffNameStatusEntryCount: number;
    hasWorkingTreeChanges: boolean;
  };
  git: {
    statusPorcelain: GitCommandResult;
    diffStat: GitCommandResult;
    diffNameStatus: GitCommandResult;
  };
  observed: {
    statusEntries: StatusEntry[];
    diffNameStatusEntries: NameStatusEntry[];
  };
}

interface ExecFileError extends Error {
  stdout?: string | Buffer;
  stderr?: string | Buffer;
  code?: number;
}

export function parseStatusPorcelain(output: string): StatusEntry[] {
  return splitLines(output).map((line) => {
    const status = line.slice(0, 2).padEnd(2, " ");
    const rawPath = line.length > 3 ? line.slice(3) : "";
    const renameSeparator = " -> ";
    const renameIndex = rawPath.indexOf(renameSeparator);

    if (renameIndex >= 0) {
      return {
        indexStatus: status[0],
        workingTreeStatus: status[1],
        previousPath: rawPath.slice(0, renameIndex),
        path: rawPath.slice(renameIndex + renameSeparator.length),
        raw: line,
      };
    }

    return {
      indexStatus: status[0],
      workingTreeStatus: status[1],
      path: rawPath,
      raw: line,
    };
  });
}

export function parseNameStatus(output: string): NameStatusEntry[] {
  return splitLines(output).map((line) => {
    const parts = line.split("\t");
    const status = parts[0] ?? "";

    if ((status.startsWith("R") || status.startsWith("C")) && parts.length >= 3) {
      return {
        status,
        previousPath: parts[1],
        path: parts[2],
        raw: line,
      };
    }

    return {
      status,
      path: parts.slice(1).join("\t"),
      raw: line,
    };
  });
}

export async function scanRepository(cwd: string = process.cwd()): Promise<WorklogScan> {
  const gitRoot = await resolveGitRoot(cwd);
  const [statusPorcelain, diffStat, diffNameStatus] = await Promise.all([
    runGit(["status", "--porcelain"], gitRoot),
    runGit(["diff", "--stat"], gitRoot),
    runGit(["diff", "--name-status"], gitRoot),
  ]);

  assertGitCommandSucceeded(statusPorcelain);
  assertGitCommandSucceeded(diffStat);
  assertGitCommandSucceeded(diffNameStatus);

  const statusEntries = parseStatusPorcelain(statusPorcelain.stdout);
  const diffNameStatusEntries = parseNameStatus(diffNameStatus.stdout);

  return {
    schemaVersion: "0.1",
    generatedAt: new Date().toISOString(),
    cwd: path.resolve(cwd),
    gitRoot,
    summary: {
      statusEntryCount: statusEntries.length,
      diffNameStatusEntryCount: diffNameStatusEntries.length,
      hasWorkingTreeChanges: statusEntries.length > 0,
    },
    git: {
      statusPorcelain,
      diffStat,
      diffNameStatus,
    },
    observed: {
      statusEntries,
      diffNameStatusEntries,
    },
  };
}

export async function writeScanOutputs(scan: WorklogScan): Promise<{ markdownPath: string; jsonPath: string }> {
  const outputDirectory = path.join(scan.gitRoot, outputDirectoryName);
  const markdownPath = path.join(outputDirectory, "latest.md");
  const jsonPath = path.join(outputDirectory, "latest.json");

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(markdownPath, renderMarkdown(scan), "utf8"),
    writeFile(jsonPath, `${JSON.stringify(scan, null, 2)}\n`, "utf8"),
  ]);

  return { markdownPath, jsonPath };
}

export function renderMarkdown(scan: WorklogScan): string {
  const statusRows = scan.observed.statusEntries
    .map((entry) => {
      const status = `${entry.indexStatus}${entry.workingTreeStatus}`;
      return `| ${escapeMarkdownTableCell(status)} | ${escapeMarkdownTableCell(entry.path)} | ${escapeMarkdownTableCell(entry.previousPath ?? "")} |`;
    })
    .join("\n");

  const diffRows = scan.observed.diffNameStatusEntries
    .map((entry) => {
      return `| ${escapeMarkdownTableCell(entry.status)} | ${escapeMarkdownTableCell(entry.path)} | ${escapeMarkdownTableCell(entry.previousPath ?? "")} |`;
    })
    .join("\n");

  return [
    "# AI Dev Worklog Scan",
    "",
    `Generated: ${scan.generatedAt}`,
    `Repository: ${scan.gitRoot}`,
    `Working directory: ${scan.cwd}`,
    "",
    "## Summary",
    "",
    `- Git status entries: ${scan.summary.statusEntryCount}`,
    `- Git diff name-status entries: ${scan.summary.diffNameStatusEntryCount}`,
    `- Working tree has changes: ${scan.summary.hasWorkingTreeChanges ? "yes" : "no"}`,
    "",
    "## Changed Files From Status",
    "",
    "| Status | Path | Previous path |",
    "| --- | --- | --- |",
    statusRows || "|  |  |  |",
    "",
    "## Changed Files From Diff",
    "",
    "| Status | Path | Previous path |",
    "| --- | --- | --- |",
    diffRows || "|  |  |  |",
    "",
    "## git status --porcelain",
    "",
    codeBlock(scan.git.statusPorcelain.stdout),
    "",
    "## git diff --stat",
    "",
    codeBlock(scan.git.diffStat.stdout),
    "",
    "## git diff --name-status",
    "",
    codeBlock(scan.git.diffNameStatus.stdout),
    "",
    "## Continue Prompt",
    "",
    "Use this local git evidence to continue the development session. Review the changed files, verify the listed commands, and decide the next implementation or validation step from the current repository state.",
    "",
  ].join("\n");
}

export async function runCli(argv: string[] = process.argv.slice(2), cwd: string = process.cwd()): Promise<number> {
  const [command] = argv;

  if (command === "scan") {
    const scan = await scanRepository(cwd);
    const outputs = await writeScanOutputs(scan);
    console.log(`Wrote ${outputs.markdownPath}`);
    console.log(`Wrote ${outputs.jsonPath}`);
    return 0;
  }

  if (command === "--help" || command === "-h" || command === undefined) {
    printHelp();
    return 0;
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  return 1;
}

async function resolveGitRoot(cwd: string): Promise<string> {
  const result = await runGit(["rev-parse", "--show-toplevel"], cwd);
  assertGitCommandSucceeded(result);
  return path.resolve(result.stdout.trim());
}

async function runGit(args: string[], cwd: string): Promise<GitCommandResult> {
  const command = `git ${args.join(" ")}`;

  try {
    const { stdout, stderr } = await execFileAsync("git", args, {
      cwd,
      maxBuffer: 10 * 1024 * 1024,
    });

    return {
      command,
      stdout: trimTrailingNewline(stdout),
      stderr: trimTrailingNewline(stderr),
      exitCode: 0,
    };
  } catch (error) {
    const execError = error as ExecFileError;

    return {
      command,
      stdout: trimTrailingNewline(execError.stdout ?? ""),
      stderr: trimTrailingNewline(execError.stderr ?? execError.message),
      exitCode: typeof execError.code === "number" ? execError.code : 1,
    };
  }
}

function assertGitCommandSucceeded(result: GitCommandResult): void {
  if (result.exitCode !== 0) {
    throw new Error(`${result.command} failed with exit code ${result.exitCode}: ${result.stderr}`);
  }
}

function splitLines(output: string): string[] {
  if (output.length === 0) {
    return [];
  }

  return output.split(/\r?\n/).filter((line) => line.length > 0);
}

function codeBlock(value: string): string {
  return ["```text", value || "(no output)", "```"].join("\n");
}

function escapeMarkdownTableCell(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("|", "\\|").replace(/\r?\n/g, " ");
}

function printHelp(): void {
  console.log("Usage: ai-dev-worklog scan");
}

function trimTrailingNewline(value: string | Buffer): string {
  return value.toString().replace(/\r?\n$/, "");
}

function isDirectExecution(): boolean {
  if (process.argv[1] === undefined) {
    return false;
  }

  return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);
}

if (isDirectExecution()) {
  runCli().then((exitCode) => {
    process.exitCode = exitCode;
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
