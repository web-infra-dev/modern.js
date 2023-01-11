import { logger } from '@modern-js/utils/logger';
import assert from 'assert';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  BundlerType,
  CreateBuilderOptions,
  SharedBuilderContext,
} from './types';

export interface CreateSharedContextOptions
  extends Required<CreateBuilderOptions> {
  bundlerType: BundlerType;
  distPath: string;
}

export function createSharedBuilderContext(
  options: CreateSharedContextOptions,
): SharedBuilderContext {
  const { cwd, configPath } = options;
  const rootPath = cwd;
  const srcPath = join(rootPath, 'src');
  const cachePath = join(rootPath, 'node_modules', '.cache');

  const context: SharedBuilderContext = {
    bundlerType: options.bundlerType,
    entry: options.entry,
    target: options.target,
    distPath: options.distPath,
    framework: options.framework,
    srcPath,
    rootPath,
    cachePath,
  };

  if (configPath && existsSync(configPath)) {
    context.configPath = configPath;
  }

  return context;
}

export const PUBLIC_CONTEXT_KEYS = [
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
  'hooks',
] as const;

export type PublicContextKey = typeof PUBLIC_CONTEXT_KEYS[number];

export const createPublicContext = <T extends SharedBuilderContext>(
  context: Record<string, unknown>,
  additionalKeys?: (keyof T)[],
): T => {
  const exposedKeys: any[] = [...PUBLIC_CONTEXT_KEYS];
  additionalKeys && exposedKeys.push(...additionalKeys);
  for (const key of exposedKeys) {
    assert(
      key in context,
      `Failed to create public context, require "${key}" in the context but not founded.`,
    );
  }

  // Using Proxy to get the current value of context.
  return new Proxy(context, {
    get(target, prop: keyof SharedBuilderContext) {
      if (exposedKeys.includes(prop)) {
        return target[prop];
      }
      return undefined;
    },
    set(_target, prop: keyof SharedBuilderContext) {
      logger.error(
        `Context is readonly, you can not assign to the "context.${prop}" prop.`,
      );
      return true;
    },
  }) as any;
};
