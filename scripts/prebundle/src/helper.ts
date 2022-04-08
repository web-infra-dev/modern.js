import { dirname, join } from 'path';
import { TASKS, DIST_DIR, PACKAGES_DIR } from './constant';

export type ParsedTask = {
  depName: string;
  depPath: string;
  distPath: string;
  importPath: string;
  packageDir: string;
  packagePath: string;
  packageName: string;
};

function findDepPath(name: string, packagePath: string) {
  let entry = dirname(
    require.resolve(join(name), {
      paths: [join(packagePath, 'node_modules')],
    }),
  );

  while (!dirname(entry).endsWith('node_modules')) {
    entry = dirname(entry);
  }

  return entry;
}

export function parseTasks() {
  const result: ParsedTask[] = [];

  TASKS.forEach(({ packageName, packageDir, dependencies }) => {
    dependencies.forEach(name => {
      const importPath = join(packageName, DIST_DIR, name);
      const packagePath = join(PACKAGES_DIR, packageDir);
      const distPath = join(packagePath, DIST_DIR, name);
      const depPath = findDepPath(name, packagePath);

      result.push({
        depName: name,
        depPath,
        distPath,
        importPath,
        packageDir,
        packagePath,
        packageName,
      });
    });
  });

  return result;
}

export function pick<T, U extends keyof T>(obj: T, keys: ReadonlyArray<U>) {
  return keys.reduce((ret, key) => {
    if (obj[key] !== undefined) {
      ret[key] = obj[key];
    }
    return ret;
  }, {} as Pick<T, U>);
}
