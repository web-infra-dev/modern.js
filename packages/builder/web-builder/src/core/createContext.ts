import _ from 'lodash';
import { isAbsolute, join } from 'path';
import { initHooks } from './createHook';
import { ConfigValidator } from '../config/validate';
import { STATUS, isFileExists, ROOT_DIST_DIR } from '../shared';
import type {
  Context,
  BuilderOptions,
  BuilderContext,
  BuilderConfig,
} from '../types';

export function getDistPath(cwd: string, builderConfig: BuilderConfig) {
  const { distPath } = builderConfig.output || {};
  const root = typeof distPath === 'string' ? distPath : distPath?.root;

  if (root) {
    return isAbsolute(root) ? root : join(cwd, root);
  }

  return join(cwd, ROOT_DIST_DIR);
}

/**
 * Create primary context.
 * It will be assembled into a normal context or a stub for testing as needed.
 * Usually it would be a pure function
 */
export function createPrimaryContext(
  options: Required<BuilderOptions>,
): Context {
  const { cwd, configPath, builderConfig, framework } = options;
  const hooks = initHooks();
  const status = STATUS.INITIAL;
  const rootPath = cwd;
  const srcPath = join(rootPath, 'src');
  const distPath = getDistPath(cwd, builderConfig);
  const cachePath = join(rootPath, 'node_modules', '.cache');
  const configValidatingTask = Promise.resolve();

  // TODO some properties should be readonly
  const context: Context = {
    hooks,
    // TODO using setter to set status and log some performance info
    status,
    srcPath,
    rootPath,
    distPath,
    cachePath,
    configValidatingTask,
    // TODO should deep clone
    config: { ...builderConfig },
    originalConfig: builderConfig,
    framework,
  };

  if (configPath) {
    context.configPath = configPath;
  }

  return context;
}

/**
 * Generate the actual context used in the build,
 * which can have a lot of overhead and take some side effects.
 */
export async function createContext(
  options: Required<BuilderOptions>,
): Promise<Context> {
  const ctx = createPrimaryContext(options);

  ctx.configValidatingTask = ConfigValidator.create().then(validator => {
    // interrupt build if config is invalid.
    validator.validate(options.builderConfig, false);
  });

  const tsconfigPath = join(ctx.rootPath, 'tsconfig.json');
  if (await isFileExists(tsconfigPath)) {
    ctx.tsconfigPath = tsconfigPath;
  }

  return ctx;
}

export function createPublicContext(
  context: Context,
): Readonly<BuilderContext> {
  const ctx = _.pick(context, [
    'srcPath',
    'rootPath',
    'distPath',
    'cachePath',
    'configPath',
    'tsconfigPath',
    'originalConfig',
    'framework',
  ]);
  return Object.freeze(ctx);
}
