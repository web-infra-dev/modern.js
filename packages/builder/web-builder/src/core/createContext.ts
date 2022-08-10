import { isAbsolute, join } from 'path';
import { initHooks } from './createHook';
import { ConfigValidator } from '../config/validate';
import { pick, STATUS, isFileExists, ROOT_DIST_DIR } from '../shared';
import type {
  Context,
  BuilderOptions,
  BuilderContext,
  BuilderConfig,
} from '../types';

function getDistPath(cwd: string, builderConfig: BuilderConfig) {
  const { distPath } = builderConfig.output || {};
  const root = typeof distPath === 'string' ? distPath : distPath?.root;

  if (root) {
    return isAbsolute(root) ? root : join(cwd, root);
  }

  return join(cwd, ROOT_DIST_DIR);
}

export async function createContext({
  cwd,
  configPath,
  builderConfig,
  framework,
}: Required<BuilderOptions>) {
  const hooks = initHooks();
  const status = STATUS.INITIAL;
  const rootPath = cwd;
  const srcPath = join(rootPath, 'src');
  const distPath = getDistPath(cwd, builderConfig);
  const cachePath = join(rootPath, 'node_modules', '.cache');
  const configValidatingTask = ConfigValidator.create().then(validator => {
    validator.validate(builderConfig, false);
  });

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

  const tsconfigPath = join(rootPath, 'tsconfig.json');
  if (await isFileExists(tsconfigPath)) {
    context.tsconfigPath = tsconfigPath;
  }

  return context;
}

export function createPublicContext(
  context: Context,
): Readonly<BuilderContext> {
  return Object.freeze(
    pick(context, [
      'srcPath',
      'rootPath',
      'distPath',
      'cachePath',
      'configPath',
      'tsconfigPath',
      'originalConfig',
      'framework',
    ]),
  );
}
