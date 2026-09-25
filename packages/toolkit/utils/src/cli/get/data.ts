import os from 'os';
import path from 'path';
import type { InternalPlugins } from '@modern-js/types';
import { fs, json5 } from '../../compiled';
import { isDepExists } from '../is';
import { canUsePnpm, canUseYarn } from '../package';
import { tryResolve } from '../require';

// get data from file
const MAX_TIMES = 5;
export async function getPackageManager(cwd: string = process.cwd()) {
  let appDirectory = cwd;
  let times = 0;
  while (os.homedir() !== appDirectory && times < MAX_TIMES) {
    times++;
    if (fs.existsSync(path.resolve(appDirectory, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (fs.existsSync(path.resolve(appDirectory, 'yarn.lock'))) {
      return 'yarn';
    }
    if (fs.existsSync(path.resolve(appDirectory, 'package-lock.json'))) {
      return 'npm';
    }
    appDirectory = path.join(appDirectory, '..');
  }
  if (await canUsePnpm()) {
    return 'pnpm';
  }
  if (await canUseYarn()) {
    return 'yarn';
  }
  return 'npm';
}

export const getCoreJsVersion = (corejsPkgPath: string) => {
  try {
    const { version } = fs.readJSONSync(corejsPkgPath);
    const [major, minor] = version.split('.');
    return `${major}.${minor}`;
  } catch (err) {
    return '3';
  }
};

export function getInternalPlugins(
  appDirectory: string,
  internalPlugins: InternalPlugins = {},
) {
  return [
    ...Object.keys(internalPlugins)
      .filter(name => {
        const config = internalPlugins[name];
        if (typeof config !== 'string' && config.forced === true) {
          return true;
        }
        return isDepExists(appDirectory, name);
      })
      .map(name => {
        const config = internalPlugins[name];
        if (typeof config !== 'string') {
          return config.path;
        } else {
          return config;
        }
      }),
  ];
}

export const readTsConfig = (root: string) => {
  return readTsConfigByFile(path.resolve(root, './tsconfig.json'));
};

export const readTsConfigByFile = (filename: string) => {
  const content = fs.readFileSync(path.resolve(filename), 'utf-8');
  return json5.parse(content);
};

export interface TsConfigWithExtends {
  /** Absolute path of the entry config file. */
  path: string;
  /**
   * Every config file that took part in the merge, parents first, the entry
   * file last. Unresolvable `extends` targets are skipped.
   */
  files: string[];
  /** Raw (json5-parsed) content of the entry file, without `extends` applied. */
  raw: Record<string, any>;
  /**
   * `compilerOptions` merged key by key across the `extends` chain: child
   * over parents, later `extends` array entries over earlier ones. `paths`
   * is taken wholesale from the nearest declaring file, like TypeScript does.
   */
  compilerOptions: Record<string, any>;
  /** Absolute `baseUrl`, resolved against the file that declares it. */
  baseUrl?: string;
  /**
   * Directory that `paths` entries are resolved against: the resolved
   * `baseUrl` when one is declared, otherwise the directory of the file that
   * declares `paths`. Undefined when neither is declared.
   */
  pathsBaseDir?: string;
}

const TSCONFIG_EXTENDS_CANDIDATES = (spec: string) => [
  spec,
  `${spec}.json`,
  `${spec}/tsconfig.json`,
];

/**
 * Resolve one `extends` target of a tsconfig file to an absolute path.
 * Relative and absolute paths get `.json` appended when missing; package
 * specifiers are resolved from the directory of the extending file, trying
 * `spec`, `spec.json` and `spec/tsconfig.json` in that order.
 */
export const resolveTsConfigExtends = (
  spec: string,
  fromDir: string,
): string | undefined => {
  if (spec.startsWith('.') || path.isAbsolute(spec)) {
    const target = path.resolve(fromDir, spec);
    if (fs.existsSync(target) && fs.statSync(target).isFile()) {
      return target;
    }
    if (!target.endsWith('.json') && fs.existsSync(`${target}.json`)) {
      return `${target}.json`;
    }
    return undefined;
  }

  for (const candidate of TSCONFIG_EXTENDS_CANDIDATES(spec)) {
    try {
      const resolved = tryResolve(candidate, fromDir);
      if (resolved.endsWith('.json')) {
        return resolved;
      }
    } catch {}
  }
  return undefined;
};

/**
 * Read a tsconfig file and apply its `extends` chain (string or array).
 *
 * Only `compilerOptions` is merged; other top-level fields are returned
 * from the entry file as `raw`. No dependency on `typescript` is needed:
 * files are parsed with json5, so comments and trailing commas are fine.
 */
export const readTsConfigWithExtends = (
  filename: string,
): TsConfigWithExtends => {
  const entry = path.resolve(filename);
  const files: string[] = [];
  const visited = new Set<string>();

  interface Layer {
    compilerOptions: Record<string, any>;
    baseUrl?: string;
    pathsDir?: string;
  }

  const load = (file: string): Layer => {
    if (visited.has(file)) {
      // Cyclic `extends`: TypeScript reports an error, we just stop the walk.
      return { compilerOptions: {} };
    }
    visited.add(file);

    const raw = readTsConfigByFile(file) || {};
    const dir = path.dirname(file);
    const parents: string[] = Array.isArray(raw.extends)
      ? raw.extends
      : raw.extends
        ? [raw.extends]
        : [];

    const merged: Layer = { compilerOptions: {} };
    for (const spec of parents) {
      if (typeof spec !== 'string') {
        continue;
      }
      const parentFile = resolveTsConfigExtends(spec, dir);
      if (!parentFile) {
        continue;
      }
      const parent = load(parentFile);
      merged.compilerOptions = {
        ...merged.compilerOptions,
        ...parent.compilerOptions,
      };
      if (parent.baseUrl !== undefined) {
        merged.baseUrl = parent.baseUrl;
      }
      if (parent.pathsDir !== undefined) {
        merged.pathsDir = parent.pathsDir;
      }
    }

    const own: Record<string, any> = raw.compilerOptions || {};
    merged.compilerOptions = { ...merged.compilerOptions, ...own };
    if (typeof own.baseUrl === 'string') {
      merged.baseUrl = path.resolve(dir, own.baseUrl);
    }
    if (own.paths && typeof own.paths === 'object') {
      merged.pathsDir = dir;
    }

    files.push(file);
    return merged;
  };

  const raw = readTsConfigByFile(entry) || {};
  const layer = load(entry);

  return {
    path: entry,
    files,
    raw,
    compilerOptions: layer.compilerOptions,
    baseUrl: layer.baseUrl,
    pathsBaseDir: layer.baseUrl ?? layer.pathsDir,
  };
};
