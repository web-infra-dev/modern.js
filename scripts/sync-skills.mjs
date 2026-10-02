#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// 维护者内部 skill 放在 scripts/skills/ 下（仓库根 skills/ 是「用户向」分发源，由标准
// `skills` CLI 消费；内部 skill 单独放 scripts/skills/ 避免被对外 CLI 默认发现）。
// 仅含 SKILL.md 的目录会被识别，README.md 等跳过。
const SOURCE_DIR = path.join(REPO_ROOT, 'scripts', 'skills');

const TARGETS = {
  claude: '.claude/skills',
  codex: '.agents/skills',
  cursor: '.cursor/skills',
};
const LEGACY_SKILL_NAMES = ['modernjs-dependency-audit'];

function usage() {
  console.log(`Sync Modern.js maintainer skills into agent tool directories.

Usage:
  node scripts/sync-skills.mjs [--target=claude|codex|cursor|all] [--dry-run]

不带 --target 且在终端运行时，会交互式让你选择目标 Agent 目录；非交互环境默认 all.`);
}

function parseArgs(argv) {
  const args = {
    target: 'all',
    targetExplicit: false,
    dryRun: false,
  };

  for (const arg of argv.slice(2)) {
    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }
    if (arg === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (arg.startsWith('--target=')) {
      args.target = arg.slice('--target='.length);
      args.targetExplicit = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

// 交互式让开发者选择目标 Agent 目录
function promptTarget() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => {
    rl.question(
      '把维护者 skill 同步到哪个 Agent 目录？[claude/codex/cursor/all]（默认 all）: ',
      answer => {
        rl.close();
        resolve(answer.trim() || 'all');
      },
    );
  });
}

function resolveTargets(target) {
  const names =
    target === 'all'
      ? Object.keys(TARGETS)
      : target
          .split(',')
          .map(name => name.trim())
          .filter(Boolean);
  const unknown = names.filter(name => !TARGETS[name]);

  if (unknown.length > 0) {
    throw new Error(
      `Unknown target: ${unknown.join(', ')}. Expected claude, codex, cursor, or all.`,
    );
  }
  if (names.length === 0) {
    throw new Error('No target selected.');
  }

  return names;
}

function listSkillDirs() {
  if (!fs.existsSync(SOURCE_DIR)) {
    return [];
  }

  return fs
    .readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .filter(entry =>
      fs.existsSync(path.join(SOURCE_DIR, entry.name, 'SKILL.md')),
    )
    .map(entry => ({
      name: entry.name,
      source: path.join(SOURCE_DIR, entry.name),
    }));
}

function relativeSymlinkTarget(fromDir, toDir) {
  const relative = path.relative(fromDir, toDir);
  return relative.startsWith('.') ? relative : `.${path.sep}${relative}`;
}

function cleanupLegacyLinks(targetRoot, dryRun) {
  for (const name of LEGACY_SKILL_NAMES) {
    const legacyPath = path.join(targetRoot, name);
    try {
      fs.lstatSync(legacyPath);
    } catch {
      continue;
    }

    if (dryRun) {
      console.log(
        `[dry-run] remove legacy: ${path.relative(REPO_ROOT, legacyPath)}`,
      );
      continue;
    }
    fs.rmSync(legacyPath, { recursive: true, force: true });
  }
}

function cleanupBrokenSkillLinks(targetRoot, dryRun) {
  if (!fs.existsSync(targetRoot)) return;

  for (const entry of fs.readdirSync(targetRoot)) {
    const fullPath = path.join(targetRoot, entry);
    let stat;
    try {
      stat = fs.lstatSync(fullPath);
    } catch {
      continue;
    }
    if (!stat.isSymbolicLink()) continue;

    let target;
    try {
      target = fs.realpathSync(fullPath);
    } catch {
      if (dryRun) {
        console.log(
          `[dry-run] remove broken: ${path.relative(REPO_ROOT, fullPath)}`,
        );
        continue;
      }
      fs.rmSync(fullPath, { recursive: true, force: true });
      continue;
    }

    if (target.startsWith(SOURCE_DIR) && !fs.existsSync(target)) {
      if (dryRun) {
        console.log(
          `[dry-run] remove missing source: ${path.relative(REPO_ROOT, fullPath)}`,
        );
        continue;
      }
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }
}

function syncSkill(skill, targetName, dryRun) {
  const targetRoot = path.join(REPO_ROOT, TARGETS[targetName]);
  const dest = path.join(targetRoot, skill.name);
  const linkTarget = relativeSymlinkTarget(targetRoot, skill.source);

  if (dryRun) {
    console.log(
      `[dry-run] ${targetName}: ${path.relative(REPO_ROOT, dest)} -> ${linkTarget}`,
    );
    return;
  }

  fs.mkdirSync(targetRoot, { recursive: true });
  fs.rmSync(dest, { recursive: true, force: true });
  fs.symlinkSync(linkTarget, dest, 'dir');
  console.log(
    `${targetName}: ${path.relative(REPO_ROOT, dest)} -> ${linkTarget}`,
  );
}

async function main() {
  const { target, targetExplicit, dryRun } = parseArgs(process.argv);
  // 不带 --target 且在终端里运行 → 交互式选择；否则用默认/显式值
  const chosen =
    !targetExplicit && process.stdin.isTTY ? await promptTarget() : target;
  const targetNames = resolveTargets(chosen);
  const skills = listSkillDirs();

  if (skills.length === 0) {
    console.log('No maintainer skills found under scripts/skills/.');
    return;
  }

  for (const targetName of targetNames) {
    const targetRoot = path.join(REPO_ROOT, TARGETS[targetName]);
    cleanupLegacyLinks(targetRoot, dryRun);
    cleanupBrokenSkillLinks(targetRoot, dryRun);
    for (const skill of skills) {
      syncSkill(skill, targetName, dryRun);
    }
  }
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
