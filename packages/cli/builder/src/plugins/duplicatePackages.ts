import fs from 'node:fs';
import path from 'node:path';
import { logger, type RsbuildPlugin, type Rspack } from '@rsbuild/core';

export interface DuplicatePackagesOptions {
  /**
   * `warn` prints the duplicates after each build, `error` also fails a production build.
   * @default 'warn'
   */
  level?: 'warn' | 'error';
  /**
   * Only check modules in initial chunks (loaded before the first render).
   * Async chunks are listed too when `false`.
   * @default true
   */
  initialOnly?: boolean;
  /** Package names allowed to appear in several versions. */
  allow?: (string | RegExp)[];
}

export interface DuplicatePackage {
  name: string;
  versions: { version: string; root: string; modules: number }[];
}

const NODE_MODULES = `${path.sep}node_modules${path.sep}`;

const packageRootOf = (resource: string): string | undefined => {
  const index = resource.lastIndexOf(NODE_MODULES);
  if (index === -1) {
    return undefined;
  }
  const rest = resource.slice(index + NODE_MODULES.length).split(path.sep);
  const depth = rest[0]?.startsWith('@') ? 2 : 1;
  if (rest.length <= depth) {
    return undefined;
  }
  return (
    resource.slice(0, index + NODE_MODULES.length) +
    rest.slice(0, depth).join(path.sep)
  );
};

type PackageInfo = { name: string; version: string } | null;

const readPackage = (
  root: string,
  cache: Map<string, PackageInfo>,
): PackageInfo => {
  if (cache.has(root)) {
    return cache.get(root) as PackageInfo;
  }
  let info: PackageInfo = null;
  try {
    const json = JSON.parse(
      fs.readFileSync(path.join(root, 'package.json'), 'utf-8'),
    );
    if (typeof json.name === 'string' && typeof json.version === 'string') {
      info = { name: json.name, version: json.version };
    }
  } catch {
    info = null;
  }
  cache.set(root, info);
  return info;
};

const isAllowed = (name: string, allow: (string | RegExp)[] = []): boolean =>
  allow.some(rule =>
    typeof rule === 'string' ? rule === name : rule.test(name),
  );

/** Packages bundled from more than one version (by package root) in the given chunks. */
export const findDuplicatePackages = (
  compilation: Rspack.Compilation,
  options: DuplicatePackagesOptions = {},
): DuplicatePackage[] => {
  const initialOnly = options.initialOnly ?? true;
  const cache = new Map<string, PackageInfo>();
  const byName = new Map<
    string,
    Map<string, { version: string; root: string; modules: number }>
  >();
  const { chunkGraph } = compilation;
  for (const chunk of compilation.chunks) {
    if (initialOnly && !chunk.canBeInitial()) {
      continue;
    }
    for (const module of chunkGraph.getChunkModulesIterable(chunk)) {
      const resource = (module as { resource?: string }).resource;
      if (!resource) {
        continue;
      }
      const root = packageRootOf(resource.split('?')[0]);
      if (!root) {
        continue;
      }
      const info = readPackage(root, cache);
      if (!info || isAllowed(info.name, options.allow)) {
        continue;
      }
      const roots = byName.get(info.name) ?? new Map();
      byName.set(info.name, roots);
      const entry = roots.get(root) ?? {
        version: info.version,
        root,
        modules: 0,
      };
      entry.modules += 1;
      roots.set(root, entry);
    }
  }
  const result: DuplicatePackage[] = [];
  for (const [name, roots] of byName) {
    const versions = [
      ...new Map(
        [...roots.values()].map(item => [item.version, item]),
      ).values(),
    ];
    if (versions.length > 1) {
      result.push({
        name,
        versions: versions.sort((a, b) =>
          a.version.localeCompare(b.version, undefined, { numeric: true }),
        ),
      });
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
};

export const formatDuplicatePackages = (
  duplicates: DuplicatePackage[],
  cwd: string,
): string =>
  duplicates
    .map(
      ({ name, versions }) =>
        `  ${name}\n${versions
          .map(
            item =>
              `    ${item.version} (${item.modules} modules) ${path.relative(cwd, item.root)}`,
          )
          .join('\n')}`,
    )
    .join('\n');

/**
 * Report packages that are bundled in several versions, e.g. two router majors in the
 * first-screen chunks. Each extra copy is downloaded, parsed and executed on every visit.
 */
export const pluginDuplicatePackages = (
  options: DuplicatePackagesOptions = {},
): RsbuildPlugin => ({
  name: 'builder:duplicate-packages',

  setup(api) {
    api.onAfterEnvironmentCompile(({ stats, environment }) => {
      if (!stats || environment.config.output.target !== 'web') {
        return;
      }
      const duplicates = findDuplicatePackages(stats.compilation, options);
      if (duplicates.length === 0) {
        return;
      }
      const scope = options.initialOnly === false ? 'chunks' : 'initial chunks';
      const message = `[duplicate-packages] ${duplicates.length} package(s) are bundled in more than one version in the ${scope} of "${environment.name}":\n${formatDuplicatePackages(duplicates, api.context.rootPath)}`;
      if (options.level === 'error' && api.context.action === 'build') {
        throw new Error(message);
      }
      logger.warn(message);
    });
  },
});
