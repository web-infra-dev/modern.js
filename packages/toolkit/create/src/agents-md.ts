import fs from 'node:fs';
import path from 'node:path';
import { i18n, localeKeys } from './locale';

// Codemod for existing projects: add or refresh AGENTS.md / CLAUDE.md so AI
// coding agents are pointed at the version-matched docs bundled in
// node_modules/@modern-js/app-tools/docs/. `@modern-js/create` only scaffolds
// these for new projects; this brings existing projects up to date on upgrade.
//
// The Modern.js-managed rules live between these markers. Everything outside
// them belongs to the user and is never touched, and the block itself is
// replaced in place on re-run, so this command is idempotent.
const BEGIN = '<!-- BEGIN:modernjs-agent-rules -->';
const END = '<!-- END:modernjs-agent-rules -->';
const CLAUDE_IMPORT = '@AGENTS.md';

// Read the managed block from the create template, so the codemod and the
// scaffolding share a single source of truth.
function readManagedBlock(templateDir: string): string {
  const tpl = fs.readFileSync(path.join(templateDir, 'AGENTS.md'), 'utf-8');
  const begin = tpl.indexOf(BEGIN);
  const end = tpl.indexOf(END);
  if (begin === -1 || end === -1 || end < begin) {
    throw new Error(
      'template/AGENTS.md is missing the modernjs-agent-rules markers',
    );
  }
  return tpl.slice(begin, end + END.length);
}

function report(key: string, file: string): void {
  console.log(i18n.t(key, { file }));
}

// Create AGENTS.md, refresh the managed block if present, or append it while
// preserving the user's own content.
function applyAgentsMd(targetDir: string, block: string): void {
  const file = path.join(targetDir, 'AGENTS.md');
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `${block}\n`, 'utf-8');
    report(localeKeys.agentsCmd.created, 'AGENTS.md');
    return;
  }

  const content = fs.readFileSync(file, 'utf-8');
  const begin = content.indexOf(BEGIN);
  const end = content.indexOf(END);
  if (begin !== -1 && end !== -1 && end > begin) {
    const next =
      content.slice(0, begin) + block + content.slice(end + END.length);
    if (next === content) {
      report(localeKeys.agentsCmd.unchanged, 'AGENTS.md');
    } else {
      fs.writeFileSync(file, next, 'utf-8');
      report(localeKeys.agentsCmd.updatedBlock, 'AGENTS.md');
    }
    return;
  }

  // No managed block yet: put ours at the top (the "read the docs first" rule
  // should lead the file), keeping the user's existing content below it.
  const rest = content.replace(/^\s*/, '');
  fs.writeFileSync(file, rest ? `${block}\n\n${rest}` : `${block}\n`, 'utf-8');
  report(localeKeys.agentsCmd.addedBlock, 'AGENTS.md');
}

// Create CLAUDE.md as an @AGENTS.md import, or add the import to an existing
// one (Claude Code reads CLAUDE.md, not AGENTS.md, so the bridge is required).
function applyClaudeMd(targetDir: string): void {
  const file = path.join(targetDir, 'CLAUDE.md');
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `${CLAUDE_IMPORT}\n`, 'utf-8');
    report(localeKeys.agentsCmd.created, 'CLAUDE.md');
    return;
  }

  const content = fs.readFileSync(file, 'utf-8');
  if (content.split('\n').some(line => line.trim() === CLAUDE_IMPORT)) {
    report(localeKeys.agentsCmd.unchanged, 'CLAUDE.md');
    return;
  }
  fs.writeFileSync(
    file,
    `${CLAUDE_IMPORT}\n\n${content.replace(/^\s*/, '')}`,
    'utf-8',
  );
  report(localeKeys.agentsCmd.linked, 'CLAUDE.md');
}

export function runAgentsMd(templateDir: string, targetDir: string): void {
  if (!fs.existsSync(targetDir)) {
    console.error(
      i18n.t(localeKeys.agentsCmd.targetNotFound, { dir: targetDir }),
    );
    process.exit(1);
  }
  const block = readManagedBlock(templateDir);
  applyAgentsMd(targetDir, block);
  applyClaudeMd(targetDir);
  console.log('');
  console.log(i18n.t(localeKeys.agentsCmd.done));
}
