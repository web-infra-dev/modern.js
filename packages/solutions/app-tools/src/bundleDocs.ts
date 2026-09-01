import fs from 'node:fs';
import path from 'node:path';

// Copies a docs site's build output into a package as `docs/`, giving every
// project version-matched offline docs for AI coding agents. The source is the
// site's build output rather than the MDX sources: rspress renders components
// and inlines fragments at build time, so the output is self-contained
// Markdown. Exposed via the `./bundle-docs` export and the `modern-bundle-docs`
// bin so other docs sites can be bundled the same way.

// Only one language's Markdown plus llms.txt as an index; llms-full.txt would
// duplicate the same pages.
const DEFAULT_INDEX_FILE = 'llms.txt';
const DEFAULT_EXCLUDED_DIRS = ['zh'];

export interface BundleDocsOptions {
  /** Docs site build output (e.g. `doc_build`). */
  source: string;
  /** Directory to write the bundle to. */
  target: string;
  /** Index file to ship alongside the pages. */
  indexFile?: string;
  /** Top-level directories to skip. */
  excludedDirs?: string[];
}

/** @returns files copied, or 0 when the source is absent */
export function bundleDocs({
  source,
  target,
  indexFile = DEFAULT_INDEX_FILE,
  excludedDirs = DEFAULT_EXCLUDED_DIRS,
}: BundleDocsOptions): number {
  if (!fs.existsSync(source)) {
    // Not fatal: most builds skip the docs site. The release gate is what
    // refuses to ship a tarball without the bundle.
    console.warn(`[bundle-docs] docs build output not found: ${source}`);
    console.warn(
      '[bundle-docs] skipping the bundled docs — build the docs site first if you need them',
    );
    return 0;
  }

  fs.rmSync(target, { recursive: true, force: true });

  const isBundled = (rel: string) =>
    rel === indexFile ||
    (rel.endsWith('.md') &&
      !excludedDirs.some(dir => rel.startsWith(`${dir}${path.sep}`)));

  let count = 0;
  for (const entry of fs.readdirSync(source, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!entry.isFile()) {
      continue;
    }
    const from = path.join(entry.parentPath ?? entry.path, entry.name);
    const rel = path.relative(source, from);
    if (!isBundled(rel)) {
      continue;
    }
    const to = path.join(target, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
    count++;
  }

  if (count === 0) {
    throw new Error(`[bundle-docs] no files copied from ${source}`);
  }
  return count;
}

function parseArgs(argv: string[]): Record<string, string> {
  const options: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    const value = argv[i + 1];
    if (key && value) {
      options[key] = value;
    }
  }
  return options;
}

/**
 * `modern-bundle-docs --source <doc_build> --target <pkg>/docs`; both default
 * to this repo's layout.
 *
 * @param pkgRoot supplied by the bin shim — the compiled module cannot know
 * its own package root portably across output formats.
 */
export function runBundleDocsCli(pkgRoot: string): void {
  const args = parseArgs(process.argv.slice(2));
  const source = args.source
    ? path.resolve(process.cwd(), args.source)
    : path.resolve(pkgRoot, '../../document/doc_build');
  const target = args.target
    ? path.resolve(process.cwd(), args.target)
    : path.resolve(pkgRoot, 'docs');

  try {
    const count = bundleDocs({ source, target, indexFile: args.index });
    if (count > 0) {
      console.log(`[bundle-docs] bundled ${count} doc files into docs`);
    }
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}
