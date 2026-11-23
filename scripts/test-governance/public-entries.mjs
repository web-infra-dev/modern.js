import { posix } from 'node:path';
import { workspacePatterns } from '../check-dependencies/workspace.mjs';

const sourceExtensions = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mts',
  '.cts',
  '.mjs',
  '.cjs',
  '.d.ts',
];
const moduleExtension = /(?:\.d)?\.[cm]?[jt]sx?$/;

function sourceFile(path, files) {
  if (files.has(path)) return path;
  // Emitted JS specifiers can refer to TypeScript without a build.
  const stem = path.replace(moduleExtension, '');
  for (const candidate of [stem, posix.join(stem, 'index')]) {
    for (const extension of sourceExtensions) {
      if (files.has(candidate + extension)) return candidate + extension;
    }
  }
  return path;
}

function sourceTarget(target) {
  const path = target.replace(/^\.\//, '');
  if (/^src(?:\/|$)/.test(path)) return path;
  if (path.startsWith('dist/'))
    return path
      .replace(/^dist\/(?:(?:cjs|esm|esm-node|types)\/)?/, 'src/')
      .replace(moduleExtension, '');
}

// Node substitutes the same subpath into every "*" in an export target.
function exportPattern(target) {
  const parts = target
    .split('*')
    .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${parts[0]}(.+)${parts.slice(1).join('\\1')}$`);
}

function publicEntries(root, manifest, files) {
  const entries = new Set();
  const exports = manifest.exports;
  const subpaths = Object.keys(exports || {}).some(key => key.startsWith('.'))
    ? exports
    : { '.': exports };
  // Exact keys override patterns, then the longest prefix and suffix win.
  const patterns = Object.keys(subpaths)
    .filter(key => key.includes('*'))
    .sort((a, b) => b.indexOf('*') - a.indexOf('*') || b.length - a.length)
    .map(key => ({ key, regex: exportPattern(key) }));

  function collect(target, key) {
    if (target && typeof target === 'object') {
      Object.values(target).forEach(value => collect(value, key));
      return;
    }
    if (typeof target !== 'string') return;
    const mapped = sourceTarget(target);
    if (!mapped) return;
    const path = posix.join(root, mapped);
    if (!path.includes('*')) {
      entries.add(sourceFile(path, files));
      return;
    }
    const regex = exportPattern(path);
    const compiledModule =
      /^\.?\/?dist\//.test(target) && moduleExtension.test(target);
    for (const file of files) {
      if (compiledModule && !moduleExtension.test(file)) continue;
      const candidate = compiledModule
        ? file.replace(moduleExtension, '')
        : file;
      const match = regex.exec(candidate);
      if (!match) continue;
      const subpath = key.replace('*', () => match[1]);
      if (
        !Object.hasOwn(subpaths, subpath) &&
        patterns.find(pattern => pattern.regex.test(subpath))?.key === key
      )
        entries.add(file);
    }
  }
  collect(manifest.main, '.');
  for (const [key, target] of Object.entries(subpaths)) collect(target, key);
  return entries;
}

// Git paths use forward slashes in every mode, including on Windows.
export async function packageImportCheck(files, content) {
  const patterns = workspacePatterns(await content('pnpm-workspace.yaml'));
  const included = patterns.filter(pattern => !pattern.startsWith('!'));
  const excluded = patterns
    .filter(pattern => pattern.startsWith('!'))
    .map(pattern => pattern.slice(1));
  const roots = [...files]
    .filter(path => path.endsWith('/package.json'))
    .map(path => posix.dirname(path))
    .filter(
      root =>
        included.some(pattern => posix.matchesGlob(root, pattern)) &&
        !excluded.some(pattern => posix.matchesGlob(root, pattern)),
    )
    .sort((a, b) => b.length - a.length);
  const entriesByRoot = new Map();
  return async testPath => {
    if (!testPath.startsWith('packages/')) return;
    const root = roots.find(root => testPath.startsWith(root + '/'));
    if (!root) return;
    if (!entriesByRoot.has(root)) {
      const manifest = JSON.parse(
        await content(posix.join(root, 'package.json')),
      );
      entriesByRoot.set(root, publicEntries(root, manifest, files));
    }
    const entries = entriesByRoot.get(root);
    const testDirectory = posix
      .relative(root, testPath)
      .match(/^(?:.*?\/)?(?:tests|__tests__)(?=\/)/)?.[0];
    return specifier => {
      if (!/^\.{1,2}(?:\/|$)/.test(specifier)) return false;
      const path = posix
        .join(posix.dirname(testPath), specifier)
        .replace(/\/$/, '');
      const sourceRoot = roots.find(
        root => path === root + '/src' || path.startsWith(root + '/src/'),
      );
      if (!sourceRoot) return false;
      if (sourceRoot !== root) return true;
      if (testDirectory && `${path}/`.startsWith(`${root}/${testDirectory}/`))
        return false;
      return !entries.has(sourceFile(path, files));
    };
  };
}
