import fs from 'node:fs';
import path from 'node:path';

// Writes the AGENTS.md / CLAUDE.md pair that points AI coding agents at a
// framework's version-matched bundled docs.
//
// Everything is parameterized (marker name, managed block, target directory)
// because frameworks built on Modern.js — EdenX, PIA — ship the same capability
// from their own scaffolders and should reuse this rather than reimplement the
// idempotency rules.
//
// Shipped as plain ESM so downstream packages can import it directly without
// depending on how this package is bundled.

const CLAUDE_IMPORT = '@AGENTS.md';

const markers = name => ({
  begin: `<!-- BEGIN:${name} -->`,
  end: `<!-- END:${name} -->`,
});

/**
 * Extracts the managed block from a template file, so a scaffolder and this
 * codemod can share one source of truth for the block's content.
 *
 * @param {string} templateFile path to an AGENTS.md containing the markers
 * @param {string} markerName e.g. `modernjs-agent-rules`
 * @returns {string} the managed block, markers included
 */
export function readManagedBlock(templateFile, markerName) {
  const { begin, end } = markers(markerName);
  const tpl = fs.readFileSync(templateFile, 'utf-8');
  const from = tpl.indexOf(begin);
  const to = tpl.indexOf(end);
  if (from === -1 || to === -1 || to < from) {
    throw new Error(`${templateFile} is missing the ${markerName} markers`);
  }
  return tpl.slice(from, to + end.length);
}

// Create AGENTS.md, refresh the managed block in place if present, or prepend
// it — the "read the docs first" rule is the highest-priority instruction, so
// it leads the file and the user's own content stays below it.
function applyAgentsMd(targetDir, block, markerName) {
  const { begin, end } = markers(markerName);
  const file = path.join(targetDir, 'AGENTS.md');

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `${block}\n`, 'utf-8');
    return 'created';
  }

  const content = fs.readFileSync(file, 'utf-8');
  const from = content.indexOf(begin);
  const to = content.indexOf(end);
  if (from !== -1 && to !== -1 && to > from) {
    const next =
      content.slice(0, from) + block + content.slice(to + end.length);
    if (next === content) {
      return 'unchanged';
    }
    fs.writeFileSync(file, next, 'utf-8');
    return 'updated';
  }

  const rest = content.replace(/^\s*/, '');
  fs.writeFileSync(file, rest ? `${block}\n\n${rest}` : `${block}\n`, 'utf-8');
  return 'added';
}

// Claude Code reads CLAUDE.md, not AGENTS.md, so the import is what makes both
// tools share a single set of instructions.
function applyClaudeMd(targetDir) {
  const file = path.join(targetDir, 'CLAUDE.md');

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, `${CLAUDE_IMPORT}\n`, 'utf-8');
    return 'created';
  }

  const content = fs.readFileSync(file, 'utf-8');
  if (content.split('\n').some(line => line.trim() === CLAUDE_IMPORT)) {
    return 'unchanged';
  }
  fs.writeFileSync(
    file,
    `${CLAUDE_IMPORT}\n\n${content.replace(/^\s*/, '')}`,
    'utf-8',
  );
  return 'linked';
}

/**
 * Idempotently writes AGENTS.md and CLAUDE.md into `targetDir`.
 *
 * @param {object} options
 * @param {string} options.targetDir project root to write into
 * @param {string} options.block managed block, markers included
 * @param {string} options.markerName marker name used inside `block`
 * @returns {{agents: string, claude: string}} what happened to each file:
 *   `created` | `updated` | `added` | `linked` | `unchanged`
 */
export function applyAgentFiles({ targetDir, block, markerName }) {
  if (!fs.existsSync(targetDir)) {
    throw new Error(`target directory does not exist: ${targetDir}`);
  }
  return {
    agents: applyAgentsMd(targetDir, block, markerName),
    claude: applyClaudeMd(targetDir),
  };
}
