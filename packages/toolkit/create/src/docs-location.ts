import fs from 'node:fs';
import path from 'node:path';

// Decides whether a project's version ships the bundled docs and renders the
// managed block naming them. Resolved at write time rather than left as a rule
// for the agent: AGENTS.md is written once but read on every turn.

const PKG = '@modern-js/app-tools';
export const DOCS_PATH = 'node_modules/@modern-js/app-tools/docs/';
/** First version of `@modern-js/app-tools` that ships bundled docs. */
export const BUNDLED_SINCE = '3.8.0';

/**
 * The version of app-tools this project uses: the installed one when
 * node_modules is populated — a range says what was requested, node_modules
 * says what was resolved — falling back to the declared range otherwise.
 */
export function resolveVersion(cwd: string): string | null {
  const installed = path.join(cwd, 'node_modules', PKG, 'package.json');
  if (fs.existsSync(installed)) {
    try {
      const { version } = JSON.parse(fs.readFileSync(installed, 'utf-8'));
      if (typeof version === 'string') {
        return version;
      }
    } catch {
      // fall through to the declared range
    }
  }
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8'),
    );
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return deps[PKG] ?? null;
  } catch {
    return null;
  }
}

function parseSemver(version: string): [number, number, number] | null {
  const match = version.match(/(\d+)\.(\d+)\.(\d+)/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

function isAtLeast(version: [number, number, number], min: string): boolean {
  const floor = parseSemver(min);
  if (!floor) {
    return false;
  }
  for (let i = 0; i < 3; i++) {
    if (version[i] !== floor[i]) {
      return version[i] > floor[i];
    }
  }
  return true;
}

/**
 * Whether this project's version ships the bundled docs. The version is the
 * only input: anything below gets no files written — a hint instead — so
 * nothing in the project can point at docs that are not there.
 */
export function supportsBundledDocs(version: string | null): boolean {
  if (!version) {
    return false;
  }
  // Trunk builds (canary, workspace links) always carry the docs, and carry no
  // comparable semver.
  if (/^workspace:|-canary[.-]|-alpha[.-]|-beta[.-]/.test(version)) {
    return true;
  }
  const semver = parseSemver(version);
  return semver ? isAtLeast(semver, BUNDLED_SINCE) : false;
}

/** True when the project declares a dependency on Modern.js at all. */
export function isModernProject(cwd: string): boolean {
  try {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8'),
    );
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    return Object.keys(deps).some(name => name.startsWith('@modern-js/'));
  } catch {
    return false;
  }
}

/**
 * Renders the managed block. Kept deliberately short: the one instruction that
 * matters is "read the docs before you code" — knowledge belongs in the docs,
 * not in a file that sits in every agent's context on every turn.
 */
export function buildBlock(markerName: string): string {
  return [
    `<!-- BEGIN:${markerName} -->`,
    '',
    '# Modern.js: read the docs before you code',
    '',
    `> Documentation: **\`${DOCS_PATH}\`**`,
    `> Index: \`${DOCS_PATH}llms.txt\` — start here when unsure which page to open`,
    '',
    'These docs ship inside the package, so they match the Modern.js',
    'version this project installed exactly. Your training data is likely',
    'outdated — **treat them as the source of truth**, and do not answer',
    'from memory on Modern.js configuration, APIs or directory conventions.',
    '',
    '**🟢 Read the docs before you touch anything, except for:**',
    '',
    '- Writing ordinary React components (not route components)',
    '- Editing CSS or style files',
    '- Adding utility functions or business logic',
    '- Installing ordinary npm packages (unrelated to Modern.js)',
    '',
    `<!-- END:${markerName} -->`,
  ].join('\n');
}
