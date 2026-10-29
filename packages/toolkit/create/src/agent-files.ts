import fs from 'node:fs';
import path from 'node:path';

// Writes AGENTS.md to point AI coding agents at the
// version-matched bundled docs.

type FileOutcome = 'created' | 'updated' | 'added' | 'unchanged';

const markers = (name: string) => ({
  begin: `<!-- BEGIN:${name} -->`,
  end: `<!-- END:${name} -->`,
});

// Create AGENTS.md, refresh the managed block in place if present, or prepend
// it — the "read the docs first" rule is the highest-priority instruction, so
// it leads the file and the user's own content stays below it.
export function applyAgentsMd(options: {
  targetDir: string;
  block: string;
  markerName: string;
}): FileOutcome {
  const { targetDir, block, markerName } = options;
  if (!fs.existsSync(targetDir)) {
    throw new Error(`target directory does not exist: ${targetDir}`);
  }
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
