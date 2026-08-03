import fs from 'node:fs';
import path from 'node:path';

// Decides which documentation a project's agent should read, and renders the
// managed block that says so.
//
// The decision happens here, when the file is written, rather than being left
// as a rule for the agent to resolve: AGENTS.md is written once and read on
// every turn, so the block must state one address.

const PKG = '@modern-js/app-tools';
const DOCS_PATH = 'node_modules/@modern-js/app-tools/docs/';
/** First version of `@modern-js/app-tools` that ships bundled docs. */
const BUNDLED_SINCE = '3.8.0';
const CURRENT_INDEX = 'https://modernjs.dev/llms.txt';
/**
 * Superseded majors, ascending. Those lines will never ship bundled docs, so
 * they always resolve online. v1 has no site of its own, so it reads v2's.
 */
const LEGACY_INDEXES = [
  { maxMajor: 2, url: 'https://modernjs.dev/v2/llms.txt' },
];

/**
 * The installed version of app-tools, preferring what is on disk over what
 * package.json asks for — a range says what was requested, node_modules says
 * what was resolved.
 */
function resolveVersion(cwd: string): string | null {
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

/** Where this project's agent should read the docs. */
export function resolveDocsLocation(cwd: string): string {
  const version = resolveVersion(cwd);

  // Trunk builds (canary, workspace links) always carry the docs, and carry no
  // comparable semver.
  if (
    !version ||
    /^workspace:|-canary[.-]|-alpha[.-]|-beta[.-]/.test(version)
  ) {
    return DOCS_PATH;
  }

  const semver = parseSemver(version);
  if (!semver) {
    return DOCS_PATH;
  }

  const legacy = LEGACY_INDEXES.find(entry => semver[0] <= entry.maxMajor);
  if (legacy) {
    return legacy.url;
  }

  return isAtLeast(semver, BUNDLED_SINCE) ? DOCS_PATH : CURRENT_INDEX;
}

export function isBundled(location: string): boolean {
  return !location.startsWith('http');
}

/**
 * Renders the managed block. Kept deliberately short: the one instruction that
 * matters is "read the docs before you code" — knowledge belongs in the docs,
 * not in a file that sits in every agent's context on every turn.
 */
export function buildBlock(location: string, markerName: string): string {
  const source = isBundled(location)
    ? [
        `> Documentation: **\`${location}\`**`,
        `> Index: \`${location}llms.txt\` — start here when unsure which page to open`,
        '',
        'These docs ship inside the package, so they match the Modern.js',
        'version this project installed exactly. Your training data is likely',
        'outdated — **treat them as the source of truth**, and do not answer',
        'from memory on Modern.js configuration, APIs or directory conventions.',
      ]
    : [
        `> Documentation: **${location}**`,
        '',
        'This index covers the Modern.js version this project uses. Your',
        'training data is likely outdated — **treat it as the source of',
        'truth**, and do not answer from memory on Modern.js configuration,',
        'APIs or directory conventions.',
      ];

  return [
    `<!-- BEGIN:${markerName} -->`,
    '',
    '# Modern.js: read the docs before you code',
    '',
    ...source,
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
