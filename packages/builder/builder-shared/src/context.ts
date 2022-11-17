import {
  CreateBuilderOptions,
  BuilderContext,
  DistPathConfig,
  NormalizedSharedOutputConfig,
} from './types';
import { existsSync } from 'fs';
import { isAbsolute, join } from 'path';

function getAbsoluteDistPath(
  cwd: string,
  outputConfig: NormalizedSharedOutputConfig,
) {
  const root = getDistPath(outputConfig, 'root');
  return isAbsolute(root) ? root : join(cwd, root);
}

export const getDistPath = (
  outputConfig: NormalizedSharedOutputConfig,
  type: keyof DistPathConfig,
): string => {
  const { distPath } = outputConfig;
  const ret = distPath[type];
  if (typeof ret !== 'string') {
    throw new Error(`unknown key ${type} in "output.distPath"`);
  }
  return ret;
};

/**
 * Create context.
 */
export function createCommonContext(
  options: Required<CreateBuilderOptions>,
  outputConfig: NormalizedSharedOutputConfig,
): BuilderContext {
  const { cwd, target, configPath, framework } = options;
  const rootPath = cwd;
  const srcPath = join(rootPath, 'src');

  const distPath = getAbsoluteDistPath(cwd, outputConfig);
  const cachePath = join(rootPath, 'node_modules', '.cache');
  const tsconfigPath = join(rootPath, 'tsconfig.json');

  const context: BuilderContext = {
    entry: options.entry,
    target,
    srcPath,
    rootPath,
    distPath,
    cachePath,
    framework,
  };

  if (configPath && existsSync(configPath)) {
    context.configPath = configPath;
  }

  if (existsSync(tsconfigPath)) {
    context.tsconfigPath = tsconfigPath;
  }

  return context;
}
