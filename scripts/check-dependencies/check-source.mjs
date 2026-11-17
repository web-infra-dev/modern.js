import { realpath } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { createIndexSnapshot, stagedChanges } from './git-index.mjs';
import { checkSourceDependencies } from './source-dependencies.mjs';
import {
  affectedPackages,
  readWorkspace,
  sourceExtensions,
} from './workspace.mjs';

export async function runCheck(root, { staged = false } = {}) {
  const started = performance.now();
  if (!staged) return checkSourceDependencies(root);
  const changes = await stagedChanges(root);
  if (
    !changes.some(
      path =>
        sourceExtensions.test(path) ||
        /(?:^|\/)(?:package\.json|tsconfig[^/]*\.json|pnpm-workspace\.yaml)$/.test(
          path,
        ),
    )
  ) {
    return {
      packages: 0,
      files: 0,
      diagnostics: [],
      elapsedMs: performance.now() - started,
    };
  }
  const snapshot = await createIndexSnapshot(root);
  try {
    const packages = await readWorkspace(snapshot.root);
    const selectedPaths = affectedPackages(snapshot.changes, packages).map(
      pkg => pkg.path,
    );
    const result = await checkSourceDependencies(snapshot.root, {
      selectedPaths,
    });
    return { ...result, elapsedMs: performance.now() - started };
  } finally {
    await snapshot.cleanup();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Usage: pnpm check-source-dependencies [--staged] [--json]');
    return;
  }
  if (args.some(argument => !['--staged', '--json'].includes(argument)))
    throw new Error('Unknown argument. Use --help for usage.');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
  const result = await runCheck(root, { staged: args.includes('--staged') });
  if (args.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    for (const diagnostic of result.diagnostics) {
      const print =
        diagnostic.severity === 'error' ? console.error : console.warn;
      print(`${diagnostic.path}: [${diagnostic.rule}] ${diagnostic.message}`);
    }
    console.log(
      `Checked ${result.packages} packages, ${result.files} source files in ${(result.elapsedMs / 1000).toFixed(3)}s.`,
    );
  }
  if (result.diagnostics.some(diagnostic => diagnostic.severity === 'error'))
    process.exitCode = 1;
}

if (
  process.argv[1] &&
  (await realpath(process.argv[1])) === fileURLToPath(import.meta.url)
) {
  main().catch(error => {
    console.error(`Source dependency check failed: ${error.message}`);
    process.exitCode = 2;
  });
}
