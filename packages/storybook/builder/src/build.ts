import { dirname, join, parse } from 'path';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import type { Builder as RawStorybookBuilder, Stats } from '@storybook/types';
import { fs } from '@modern-js/utils';
import { createCompiler } from './provider';
import type { BuilderOptions } from './types';

export type StorybookBuilder = RawStorybookBuilder<BuilderOptions, Stats>;

export const getConfig: StorybookBuilder['getConfig'] = async options => {
  const { presets } = options;

  const frameworkOptions = await presets.apply('frameworkOptions');

  return presets.apply(
    'modern',
    {},
    {
      ...options,
      frameworkOptions,
    },
  ) as any;
};

// export `build` is used by storybook core
export const build: StorybookBuilder['build'] = async ({ options }) => {
  const config = await getConfig(options);

  const compiler = await createCompiler(
    config.bundler || 'webpack',
    config.builderConfig,
  );

  const previewResolvedDir = dirname(
    require.resolve('@storybook/preview/package.json'),
  );
  const previewDirOrigin = join(previewResolvedDir, 'dist');
  const previewDirTarget = join(options.outputDir || '', `sb-preview`);

  const previewFiles = fs.copy(previewDirOrigin, previewDirTarget, {
    filter: src => {
      const { ext } = parse(src);
      if (ext) {
        return ext === '.js';
      }
      return true;
    },
  });

  const compilation: Promise<Stats> = new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats as Stats);
      }
    });
  });

  const [stats] = await Promise.all([compilation, previewFiles]);

  return stats;
};

// export `start` is used by storybook core
export const start: StorybookBuilder['start'] = async ({
  options,
  router,
  startTime,
}) => {
  const { bundler, builderConfig } = await getConfig(options);

  const compiler = await createCompiler(bundler || 'webpack', builderConfig);

  const middleware = webpackDevMiddleware(compiler, {
    writeToDisk:
      // @ts-expect-error
      builderConfig.tools?.devServer?.devMiddleware?.writeToDisk || true,
  });
  router.use(middleware);
  router.use(webpackHotMiddleware(compiler, { log: false }));

  const stats: Stats = await new Promise(resolve => {
    // @ts-expect-error
    middleware.waitUntilValid(resolve);
  });

  if (!stats) {
    throw new Error('build failed');
  }

  const statsJson = stats.toJson();

  if (statsJson.errors.length > 1) {
    throw stats;
  }

  return {
    bail,
    stats,
    totalTime: process.hrtime(startTime),
  };
};

export const bail = async () => {
  // TODO
  console.log('todo');
};
