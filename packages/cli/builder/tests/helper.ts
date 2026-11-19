import { join } from 'node:path';
import type { Rspack } from '@rsbuild/core';
import {
  createBuilder,
  type BuilderConfig,
  type BuilderInstance,
} from '../src';

export async function getRules(config: BuilderConfig, testFile: string) {
  const builder = await createBuilder({
    bundlerType: 'rspack',
    config,
    cwd: join(__dirname, '..'),
  });
  const [bundlerConfig] = await builder.initConfigs();
  return (
    bundlerConfig.module?.rules?.filter(
      rule =>
        rule &&
        typeof rule === 'object' &&
        rule.test instanceof RegExp &&
        rule.test.test(testFile),
    ) ?? []
  );
}

type LoaderUse = { loader?: string; options?: any; parallel?: boolean };

/**
 * Collect every loader `use` item whose loader path matches `pattern`.
 * Loader paths are built with `path.join`, so normalize the separators
 * before matching to keep the assertions valid on Windows.
 */
export function findLoaderUses(value: unknown, pattern: RegExp): LoaderUse[] {
  const result: LoaderUse[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const obj = node as Record<string, unknown>;
    if (
      typeof obj.loader === 'string' &&
      pattern.test(obj.loader.replace(/\\/g, '/'))
    ) {
      result.push(obj as LoaderUse);
    }
    walk(obj.use);
    walk(obj.oneOf);
    walk(obj.rules);
  };
  walk(value);
  return result;
}

export const unwrapConfig = async (rsbuild: BuilderInstance) => {
  const configs = await rsbuild.initConfigs();
  return configs[0];
};

/** Match plugin by constructor name. */
export const matchPlugins = (
  config: Rspack.Configuration,
  pluginName: string,
) => {
  const result = config.plugins?.filter(
    item => item?.constructor.name === pluginName,
  );

  return result || null;
};
