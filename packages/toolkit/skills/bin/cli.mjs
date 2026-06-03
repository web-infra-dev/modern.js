#!/usr/bin/env node
// @modern-js/skills — 把 Modern.js 官方 Agent Skills 安装到用户项目的 Agent 目录。
// 零依赖，可直接 `npx @modern-js/skills <cmd>` 运行。
//
// 命令：
//   list                                  列出可安装的 Skills
//   add <skill> [--target=t] [--dir=d]    安装某个 Skill 到 Agent 目录
//     --target  claude | codex | cursor | all（默认 all）
//     --dir     安装到哪个项目根（默认当前目录）

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SKILLS_DIR = path.join(PKG_ROOT, 'skills');

// Agent 工具目录约定：Claude Code → .claude/skills，Codex → .agents/skills，Cursor → .cursor/skills
const TARGETS = {
  claude: '.claude/skills',
  codex: '.agents/skills',
  cursor: '.cursor/skills',
};

function listSkillNames() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
}

// 从 SKILL.md frontmatter 取 name/description
function readMeta(skill) {
  const p = path.join(SKILLS_DIR, skill, 'SKILL.md');
  const meta = { name: skill, description: '' };
  if (!fs.existsSync(p)) return meta;
  const text = fs.readFileSync(p, 'utf-8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (m) {
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^(name|description):\s*(.*)$/);
      if (kv) meta[kv[1]] = kv[2].trim();
    }
  }
  return meta;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function parseAddArgs(argv) {
  const rest = argv.slice(3);
  const skill = rest.find(a => !a.startsWith('--'));
  const targetArg = rest.find(a => a.startsWith('--target='));
  const dirArg = rest.find(a => a.startsWith('--dir='));
  const target = targetArg ? targetArg.split('=')[1] : 'all';
  const dir = dirArg ? path.resolve(dirArg.split('=')[1]) : process.cwd();
  return { skill, target, dir };
}

function cmdList() {
  const skills = listSkillNames();
  if (!skills.length) {
    console.log('（暂无可安装的 Skill）');
    return;
  }
  console.log('可安装的 Modern.js Skills：\n');
  for (const s of skills) {
    const { name, description } = readMeta(s);
    console.log(`  ${name}`);
    if (description) console.log(`    ${description}\n`);
  }
  console.log(
    '安装：npx @modern-js/skills add <skill> --target=claude|codex|cursor|all',
  );
}

function cmdAdd(argv) {
  const { skill, target, dir } = parseAddArgs(argv);
  if (!skill) {
    console.error(
      '用法：npx @modern-js/skills add <skill> [--target=claude|codex|cursor|all] [--dir=.]',
    );
    process.exit(1);
  }
  const srcDir = path.join(SKILLS_DIR, skill);
  if (!fs.existsSync(srcDir)) {
    console.error(
      `未找到 Skill：${skill}\n可用：${listSkillNames().join(', ') || '(无)'}`,
    );
    process.exit(1);
  }
  const targets =
    target === 'all'
      ? Object.keys(TARGETS)
      : target.split(',').map(t => t.trim());
  const unknown = targets.filter(t => !TARGETS[t]);
  if (unknown.length) {
    console.error(
      `未知 target：${unknown.join(', ')}（可选：claude | codex | cursor | all）`,
    );
    process.exit(1);
  }

  console.log(`安装 ${skill} → ${dir}`);
  for (const t of targets) {
    const dest = path.join(dir, TARGETS[t], skill);
    copyDir(srcDir, dest);
    console.log(`  ✓ ${t}: ${path.relative(dir, dest)}`);
  }
  console.log('完成。可在对应 Agent 里触发该 Skill。');
}

function main() {
  const cmd = process.argv[2];
  if (cmd === 'list') return cmdList();
  if (cmd === 'add') return cmdAdd(process.argv);
  console.log(
    '@modern-js/skills\n\n命令：\n  list                                  列出可安装的 Skills\n  add <skill> [--target=t] [--dir=d]    安装 Skill（target: claude|codex|cursor|all，默认 all）',
  );
}

main();
