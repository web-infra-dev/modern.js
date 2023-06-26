import { join } from 'path';
import { findExists } from '@modern-js/utils';
import { existsSync } from '@modern-js/utils/fs-extra';
import { bundleRequire } from '@modern-js/node-bundle-require';
import type { BuilderEntry } from '@modern-js/builder-shared';
import type { BuilderConfig as WebpackBuilderConfig } from '@modern-js/builder-webpack-provider';
import type { BuilderConfig as RspackBuilderConfig } from '@modern-js/builder-rspack-provider';

export type BuilderConfig<Bundler extends 'rspack' | 'webpack' = 'webpack'> =
  (Bundler extends 'webpack' ? WebpackBuilderConfig : RspackBuilderConfig) & {
    source?: {
      entries?: BuilderEntry;
    };
  };

export const defineConfig = <Bundler extends 'rspack' | 'webpack' = 'webpack'>(
  config: BuilderConfig<Bundler>,
) => config;

export async function loadConfig(): Promise<BuilderConfig> {
  const configFile = join(process.cwd(), 'builder.config.ts');

  if (existsSync(configFile)) {
    const mod = await bundleRequire(configFile);
    return mod.default || mod;
  }

  return {};
}

export function getDefaultEntries() {
  const cwd = process.cwd();
  const files = ['ts', 'tsx', 'js', 'jsx'].map(ext =>
    join(cwd, `src/index.${ext}`),
  );

  const entryFile = findExists(files);

  if (entryFile) {
    return {
      index: entryFile,
    };
  }

  throw new Error(
    'Could not find the entry file, please make sure that `src/index.(js|ts|tsx|jsx)` exists, or customize entry through the `source.entries` configuration.',
  );
}
