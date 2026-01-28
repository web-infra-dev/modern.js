import { dirname, join } from 'path';
import { pathToFileURL } from 'url';
import fs from 'fs-extra';
import { moduleResolve } from 'import-meta-resolve';
import pkgUp from 'pkg-up';
import { DIST_DIR, PACKAGES_DIR, TASKS } from './constant';
import type { ParsedTask } from './types';

export function findDepPath(name: string) {
  let entry = dirname(require.resolve(join(name)));

  while (!dirname(entry).endsWith('node_modules')) {
    entry = dirname(entry);
  }

  if (name.includes('/')) {
    return join(dirname(entry), name);
  }

  return entry;
}

const resolveESMDependency = (entry: string) => {
  const conditions = new Set(['import', 'module', 'default']);
  try {
    return moduleResolve(
      entry,
      pathToFileURL(`${__dirname}/`),
      conditions,
      false,
    ).pathname.replace(/^\/(\w)\:/, '$1:');
  } catch (err) {
    // ignore
  }
};

export async function parseTasks() {
  const result: ParsedTask[] = [];

  for (const { packageName, packageDir, dependencies } of TASKS) {
    for (const dep of dependencies) {
      const depName = typeof dep === 'string' ? dep : dep.name;
      const importPath = join(packageName, DIST_DIR, depName);
      const packagePath = join(PACKAGES_DIR, packageDir);
      const distPath = join(packagePath, DIST_DIR, depName);
      const depPath = findDepPath(depName);
      const depEntry = require.resolve(depName);
      const resolvedEsmEntry = resolveESMDependency(depName);

      let depEsmEntry = '';
      if (resolvedEsmEntry) {
        if (resolvedEsmEntry !== depEntry) {
          depEsmEntry = resolvedEsmEntry;
        } else {
          // is esm package?
          const pkg = await pkgUp({ cwd: dirname(resolvedEsmEntry) });
          if (pkg) {
            const pkgJson = await fs.readJSON(pkg);
            if (pkgJson.type === 'module') {
              depEsmEntry = resolvedEsmEntry;
            }
          }
        }
      }

      const info = {
        depName,
        depPath,
        depEntry,
        depEsmEntry,
        distPath,
        importPath,
        packageDir,
        packagePath,
        packageName,
      };

      if (typeof dep === 'string') {
        result.push({
          minify: true,
          externals: {},
          emitFiles: [],
          packageJsonField: [],
          ...info,
        });
      } else {
        result.push({
          minify: dep.minify ?? true,
          ignoreDts: dep.ignoreDts,
          emitDts: dep.emitDts ?? true,
          clear: dep.clear ?? true,
          externals: dep.externals ?? {},
          emitFiles: dep.emitFiles ?? [],
          afterBundle: dep.afterBundle,
          beforeBundle: dep.beforeBundle,
          packageJsonField: dep.packageJsonField ?? [],
          ...info,
        });
      }
    }
  }

  return result;
}

export function pick<T, U extends keyof T>(obj: T, keys: ReadonlyArray<U>) {
  return keys.reduce(
    (ret, key) => {
      if (obj[key] !== undefined) {
        ret[key] = obj[key];
      }
      return ret;
    },
    {} as Pick<T, U>,
  );
}

export function replaceFileContent(
  filePath: string,
  replaceFn: (content: string) => string,
) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const newContent = replaceFn(content);

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
  }
}
