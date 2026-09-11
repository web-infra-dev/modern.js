import fs from 'node:fs';
import path from 'node:path';

// Writes the AGENTS.md / CLAUDE.md pair that points AI coding agents at the
// version-matched bundled docs.

type FileOutcome = 'created' | 'updated' | 'added' | 'linked' | 'unchanged';

const CLAUDE_IMPORT = '@AGENTS.md';

const markers = (name: string) => ({
  begin: `<!-- BEGIN:${name} -->`,
  end: `<!-- END:${name} -->`,
});

// Create AGENTS.md, refresh the managed block in place if present, or prepend
// it — the "read the docs first" rule is the highest-priority instruction, so
// it leads the file and the user's own content stays below it.
function applyAgentsMd(
  targetDir: string,
  block: string,
  markerName: string,
): FileOutcome {
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
function applyClaudeMd(targetDir: string): FileOutcome {
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

/** Idempotently writes AGENTS.md and CLAUDE.md into `targetDir`. */
export function applyAgentFiles(options: {
  targetDir: string;
  block: string;
  markerName: string;
}): { agents: FileOutcome; claude: FileOutcome } {
  const { targetDir, block, markerName } = options;
  if (!fs.existsSync(targetDir)) {
    throw new Error(`target directory does not exist: ${targetDir}`);
  }
  return {
    agents: applyAgentsMd(targetDir, block, markerName),
    claude: applyClaudeMd(targetDir),
  };
}
