import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readWorkspace, slash } from './workspace.mjs';

const root = process.cwd();

try {
  const packages = await readWorkspace(root);
  const examples = packages.filter(pkg =>
    slash(pkg.path).startsWith('examples/'),
  );
  const config = JSON.parse(
    await readFile(resolve(root, '.changeset/config.json'), 'utf8'),
  );
  const diagnostics = [];
  if (
    !Array.isArray(config.ignore) ||
    config.ignore.length !== 1 ||
    config.ignore[0] !== '@examples/*'
  ) {
    diagnostics.push('.changeset/config.json: ignore must be ["@examples/*"]');
  }
  for (const { path, manifest } of examples) {
    const file = `${slash(path)}/package.json`;
    // Match the required Changesets glob, including its single path segment
    // and exclusion of dot-prefixed names. Directory ownership defines examples.
    if (!/^@examples\/[^/.][^/]*$/.test(manifest.name ?? '')) {
      diagnostics.push(
        `${file}: name ${JSON.stringify(manifest.name)} is not covered by Changesets ignore "@examples/*"`,
      );
    }
    for (const section of [
      'dependencies',
      'devDependencies',
      'optionalDependencies',
    ]) {
      for (const [name, value] of Object.entries(manifest[section] ?? {})) {
        if (name.startsWith('@modern-js/') && value !== 'latest') {
          diagnostics.push(
            `${file}: ${section}.${name} is ${JSON.stringify(value)}, expected "latest"`,
          );
        }
      }
    }
  }
  for (const diagnostic of diagnostics) console.error(diagnostic);
  console.log(`Checked ${examples.length} user example manifests`);
  if (diagnostics.length) process.exitCode = 1;
} catch (error) {
  console.error(`User example dependency check failed: ${error.message}`);
  process.exitCode = 2;
}
