import fs from 'node:fs';
import path from 'node:path';
// Shared with downstream frameworks (EdenX, PIA) via the `./agent-files`
// export, so the idempotency rules live in exactly one place.
import { applyAgentFiles, readManagedBlock } from '../agent-files.mjs';
import { i18n, localeKeys } from './locale';

// Codemod for existing projects: add or refresh AGENTS.md / CLAUDE.md so AI
// coding agents are pointed at the version-matched docs bundled in
// node_modules/@modern-js/app-tools/docs/. `@modern-js/create` only scaffolds
// these for new projects; this brings existing projects up to date on upgrade.
const MARKER_NAME = 'modernjs-agent-rules';

// Maps what the shared helper did to the message we print.
const AGENTS_MESSAGES: Record<string, string> = {
  created: localeKeys.agentsCmd.created,
  updated: localeKeys.agentsCmd.updatedBlock,
  added: localeKeys.agentsCmd.addedBlock,
  unchanged: localeKeys.agentsCmd.unchanged,
};
const CLAUDE_MESSAGES: Record<string, string> = {
  created: localeKeys.agentsCmd.created,
  linked: localeKeys.agentsCmd.linked,
  unchanged: localeKeys.agentsCmd.unchanged,
};

export function runAgentsMd(templateDir: string, targetDir: string): void {
  if (!fs.existsSync(targetDir)) {
    console.error(
      i18n.t(localeKeys.agentsCmd.targetNotFound, { dir: targetDir }),
    );
    process.exit(1);
  }

  const block = readManagedBlock(
    path.join(templateDir, 'AGENTS.md'),
    MARKER_NAME,
  );
  const result = applyAgentFiles({ targetDir, block, markerName: MARKER_NAME });

  console.log(i18n.t(AGENTS_MESSAGES[result.agents], { file: 'AGENTS.md' }));
  console.log(i18n.t(CLAUDE_MESSAGES[result.claude], { file: 'CLAUDE.md' }));
  console.log('');
  console.log(i18n.t(localeKeys.agentsCmd.done));
}
