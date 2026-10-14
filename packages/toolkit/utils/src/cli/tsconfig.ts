import path from 'path';
import { fs } from '../compiled';
import { SERVER_TSCONFIG_FILENAME, TS_CONFIG_FILENAME } from './constants';
import { readTsConfigWithExtends } from './get';
import { logger } from './logger';

export type ServerTsconfigSource = 'explicit' | 'convention' | 'fallback';

export type ServerCompilerOverrides = {
  module: 'NodeNext';
  moduleResolution: 'NodeNext';
};

export interface ServerTsconfigInfo {
  /** Absolute path of the tsconfig used for server-side TypeScript. */
  path: string;
  /**
   * Where the path came from:
   * - `explicit`: `server.tsconfigPath` was configured
   * - `convention`: `<appDir>/tsconfig.server.json` exists
   * - `fallback`: `<appDir>/tsconfig.json`
   */
  source: ServerTsconfigSource;
  /**
   * Compiler options the framework has to force on top of the file. Only set
   * for the `fallback` source, when the effective `module` is an ESM value
   * while the project is CommonJS (`package.json#type` is not `module`).
   * Overriding `module` alone is rejected by TypeScript (TS5095 / TS5109 /
   * TS5110), so `moduleResolution` is always overridden together with it.
   */
  compilerOverrides?: ServerCompilerOverrides;
}

export interface ResolveServerTsconfigOptions {
  /** `package.json#type` of the project; read from disk when omitted. */
  moduleType?: 'module' | 'commonjs';
}

const ESM_MODULE_KINDS = new Set([
  'es2015',
  'es6',
  'es2020',
  'es2022',
  'esnext',
  'preserve',
]);

const NODE_NEXT_OVERRIDES: ServerCompilerOverrides = {
  module: 'NodeNext',
  moduleResolution: 'NodeNext',
};

/**
 * Whether a tsconfig `module` value emits ES modules. `commonjs`, `node16`,
 * `nodenext` and friends decide the format per file (or emit CommonJS) and
 * are left alone.
 */
export const isEsmModuleKind = (value: unknown): boolean =>
  typeof value === 'string' && ESM_MODULE_KINDS.has(value.toLowerCase());

const readModuleType = (appDirectory: string): 'module' | 'commonjs' => {
  try {
    const pkg = fs.readJSONSync(path.resolve(appDirectory, 'package.json'));
    return pkg?.type === 'module' ? 'module' : 'commonjs';
  } catch {
    return 'commonjs';
  }
};

const resolveServerTsconfigPath = (
  appDirectory: string,
  configuredPath?: string,
): { path: string; source: ServerTsconfigSource } => {
  if (configuredPath) {
    return {
      path: path.isAbsolute(configuredPath)
        ? configuredPath
        : path.resolve(appDirectory, configuredPath),
      source: 'explicit',
    };
  }

  const conventionPath = path.resolve(appDirectory, SERVER_TSCONFIG_FILENAME);
  if (fs.existsSync(conventionPath)) {
    return { path: conventionPath, source: 'convention' };
  }

  return {
    path: path.resolve(appDirectory, TS_CONFIG_FILENAME),
    source: 'fallback',
  };
};

/**
 * Resolve the tsconfig used for all server-side TypeScript stages (BFF /
 * custom server compile, ts-node at dev time).
 *
 * Precedence: explicit `server.tsconfigPath` → `<appDir>/tsconfig.server.json`
 * → `<appDir>/tsconfig.json`.
 *
 * Only the fallback may be rewritten: a bundler-mode `tsconfig.json`
 * (`module: ESNext`) in a CommonJS project would emit ES modules that Node
 * cannot `require()`, so the framework compiles server code with
 * `module: NodeNext` / `moduleResolution: NodeNext` instead. `type: module`
 * projects keep their ESM output untouched.
 */
export const resolveServerTsconfigInfo = (
  appDirectory: string,
  configuredPath?: string,
  options: ResolveServerTsconfigOptions = {},
): ServerTsconfigInfo => {
  const resolved = resolveServerTsconfigPath(appDirectory, configuredPath);
  if (resolved.source !== 'fallback' || !fs.existsSync(resolved.path)) {
    return resolved;
  }

  const moduleType = options.moduleType ?? readModuleType(appDirectory);
  if (moduleType === 'module') {
    return resolved;
  }

  let module: unknown;
  try {
    module = readTsConfigWithExtends(resolved.path).compilerOptions.module;
  } catch {
    return resolved;
  }

  if (!isEsmModuleKind(module)) {
    return resolved;
  }

  return { ...resolved, compilerOverrides: { ...NODE_NEXT_OVERRIDES } };
};

/**
 * Path-only variant of {@link resolveServerTsconfigInfo}.
 */
export const resolveServerTsconfig = (
  appDirectory: string,
  configuredPath?: string,
): string => resolveServerTsconfigPath(appDirectory, configuredPath).path;

const warnedTsconfigPaths = new Set<string>();

/**
 * Print, once per process and tsconfig file, the warning that server-side
 * code is compiled with forced `NodeNext` module options because the project
 * only has a bundler-mode `tsconfig.json`. No-op when no override applies.
 */
export const warnServerTsconfigOverrides = (
  tsconfigPath: string,
  compilerOverrides?: Record<string, unknown>,
): void => {
  if (!compilerOverrides || Object.keys(compilerOverrides).length === 0) {
    return;
  }
  const key = path.resolve(tsconfigPath);
  if (warnedTsconfigPaths.has(key)) {
    return;
  }
  warnedTsconfigPaths.add(key);

  const overrides = Object.entries(compilerOverrides)
    .map(([name, value]) => `${name}: ${String(value)}`)
    .join(', ');
  logger.warn(
    `${path.basename(key)} sets an ES module "module" option but package.json "type" is not "module". ` +
      `Server-side code (api/, server/, shared/) is compiled with { ${overrides} } instead. ` +
      `To silence this warning, add a ${SERVER_TSCONFIG_FILENAME} next to it:\n` +
      `  { "extends": "./${TS_CONFIG_FILENAME}", "compilerOptions": { "module": "NodeNext", "moduleResolution": "NodeNext", "noEmit": false, "declaration": false }, "include": ["api", "server", "shared"] }`,
  );
};
