import { existsSync } from 'fs';
import { join } from 'path';
import { pick } from './pick';
import {
  BuilderContext,
  CreateBuilderOptions,
  NormalizedSharedOutputConfig,
} from './types';
import { getAbsoluteDistPath } from './fs';

/**
 * Create context by config.
 */
export function createContextByConfig(
  options: Required<CreateBuilderOptions>,
  outputConfig: NormalizedSharedOutputConfig,
): BuilderContext {
  const { cwd, target, configPath, framework } = options;
  const rootPath = cwd;
  const srcPath = join(rootPath, 'src');

  const distPath = getAbsoluteDistPath(cwd, outputConfig);
  const cachePath = join(rootPath, 'node_modules', '.cache');

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

  return context;
}

export function createPublicContext(
  context: BuilderContext,
): Readonly<BuilderContext> {
  const ctx = pick(context, [
    'entry',
    'target',
    'srcPath',
    'rootPath',
    'distPath',
    'devServer',
    'framework',
    'cachePath',
    'configPath',
    'tsconfigPath',
  ]);
  return Object.freeze(ctx);
}
