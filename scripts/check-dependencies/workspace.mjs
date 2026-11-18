import { readFile, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import glob from 'fast-glob';
import yaml from 'js-yaml';

export const sourceExtensions = /\.[cm]?[jt]sx?$/;
export const generatedDirectory =
  /(?:^|\/)(?:node_modules|compiled|dist|fixtures|__fixtures__|templates?|__tests__|tests)(?:\/|$)/;

export function slash(path) {
  return path.split(sep).join('/');
}

export function contains(directory, file) {
  const path = relative(directory, file);
  return (
    path === '' ||
    (!isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`))
  );
}

export async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

export async function readWorkspace(root) {
  const configuration = yaml.load(
    await readFile(resolve(root, 'pnpm-workspace.yaml'), 'utf8'),
  );
  if (
    !Array.isArray(configuration?.packages) ||
    !configuration.packages.every(item => typeof item === 'string')
  ) {
    throw new Error('pnpm-workspace.yaml must contain a packages array');
  }
  const directories = await glob(configuration.packages, {
    cwd: root,
    onlyDirectories: true,
    followSymbolicLinks: false,
    ignore: ['**/node_modules/**', '**/dist/**', '**/compiled/**'],
  });
  const packages = [];
  for (const path of ['.', ...directories.sort()]) {
    const directory = resolve(root, path);
    if (!(await exists(resolve(directory, 'package.json')))) {
      // A workspace source directory without its manifest must not silently disappear.
      if (
        path.startsWith('packages/') &&
        (await exists(resolve(directory, 'src')))
      ) {
        throw new Error(`${path}/package.json is missing`);
      }
      continue;
    }
    const manifest = JSON.parse(
      await readFile(resolve(directory, 'package.json'), 'utf8'),
    );
    packages.push({ path, directory, manifest });
  }
  return packages;
}

export function ownerOf(file, packages) {
  return packages
    .filter(pkg => contains(pkg.directory, file))
    .sort((a, b) => b.directory.length - a.directory.length)[0];
}

export async function sourceFiles(pkg) {
  if (!pkg.path.startsWith('packages/')) return [];
  return glob('src/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}', {
    cwd: pkg.directory,
    onlyFiles: true,
    followSymbolicLinks: false,
    ignore: [
      '**/{fixtures,__fixtures__,template,templates,__tests__,tests,compiled,dist,node_modules}/**',
      '**/*.{test,spec}.{js,jsx,ts,tsx,mjs,cjs,mts,cts}',
    ],
  });
}

export function affectedPackages(changes, packages) {
  const selected = new Set();
  for (const file of changes) {
    const path = slash(file);
    const owner = ownerOf(resolve(packages[0].directory, file), packages);
    const configuration =
      /(?:^|\/)(?:package\.json|tsconfig[^/]*\.json|pnpm-workspace\.yaml)$/.test(
        path,
      );
    const checker = path.startsWith('scripts/check-dependencies/');
    // Shared compiler configuration can change the meaning of imports in any package.
    if (
      checker ||
      (configuration &&
        (!owner ||
          owner.path === '.' ||
          !owner.path.startsWith('packages/') ||
          owner.path === 'packages/tsconfig'))
    ) {
      return packages;
    }
    if (
      owner &&
      (configuration ||
        (sourceExtensions.test(path) && !generatedDirectory.test(path)))
    ) {
      selected.add(owner);
    }
    // A config may be inherited from a sibling package. Conservatively rescan all.
    if (configuration && /(?:^|\/)tsconfig[^/]*\.json$/.test(path))
      return packages;
  }
  return [...selected];
}
