import { existsSync } from 'fs';
import { join } from 'path';
import {
  BuilderContext,
  CreateBuilderOptions,
  NormalizedSharedOutputConfig,
} from './types';
import { getAbsoluteDistPath } from './fs';
import { logger } from '@modern-js/utils/logger';

/**
 * Create context by config.
 */
export function createContextByConfig(
  options: Required<CreateBuilderOptions>,
  outputConfig: NormalizedSharedOutputConfig,
  bundlerType: string,
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
    bundlerType,
  };

  if (configPath && existsSync(configPath)) {
    context.configPath = configPath;
  }

  return context;
}

export function createPublicContext(
  context: BuilderContext,
): Readonly<BuilderContext> {
  const exposedKeys = [
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
    'bundlerType',
  ];

  // Using Proxy to get the current value of context.
  return new Proxy(context, {
    get(target, prop: keyof BuilderContext) {
      if (exposedKeys.includes(prop)) {
        return target[prop];
      }
      return undefined;
    },
    set(target, prop: keyof BuilderContext) {
      logger.error(
        `Context is readonly, you can not assign to the "context.${prop}" prop.`,
      );
      return true;
    },
  });
}
