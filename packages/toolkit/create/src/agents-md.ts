import fs from 'node:fs';
import { applyAgentFiles } from './agent-files';
import {
  BUNDLED_SINCE,
  DOCS_PATH,
  buildBlock,
  isModernProject,
  resolveVersion,
  supportsBundledDocs,
} from './docs-location';
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

export function runAgentsMd(_templateDir: string, targetDir: string): void {
  if (!fs.existsSync(targetDir)) {
    console.error(
      i18n.t(localeKeys.agentsCmd.targetNotFound, { dir: targetDir }),
    );
    process.exit(1);
  }

  // Writing these into a project that does not use Modern.js would point its
  // agent at documentation for a framework it has nothing to do with.
  if (!isModernProject(targetDir)) {
    console.error(i18n.t(localeKeys.agentsCmd.notAProject));
    process.exit(1);
  }

  // Versions without bundled docs get no files at all: a block written now
  // would name docs that are not there, and a file the tool half-manages on an
  // old version would only need migrating again after the upgrade.
  const version = resolveVersion(targetDir);
  if (!supportsBundledDocs(version)) {
    console.log(
      i18n.t(localeKeys.agentsCmd.unsupportedVersion, {
        version: version ?? 'unknown',
        since: BUNDLED_SINCE,
      }),
    );
    return;
  }

  const block = buildBlock(MARKER_NAME);
  const result = applyAgentFiles({ targetDir, block, markerName: MARKER_NAME });

  console.log(i18n.t(AGENTS_MESSAGES[result.agents], { file: 'AGENTS.md' }));
  console.log(i18n.t(CLAUDE_MESSAGES[result.claude], { file: 'CLAUDE.md' }));
  console.log('');
  console.log(i18n.t(localeKeys.agentsCmd.done, { location: DOCS_PATH }));
}
