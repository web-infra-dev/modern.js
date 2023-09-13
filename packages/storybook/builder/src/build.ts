import { dirname, join, parse } from 'path';
import webpackDevMiddleware from '@modern-js/utils/webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import serveStatic from 'serve-static';
import type { Builder as RawStorybookBuilder, Stats } from '@storybook/types';
import { fs } from '@modern-js/utils';
import type { BuilderOptions } from './types';
import { getCompiler } from './core';
import { finalize } from './plugin-storybook';

export type StorybookBuilder = RawStorybookBuilder<BuilderOptions, Stats>;

export const getConfig: StorybookBuilder['getConfig'] = async options => {
  const { presets } = options;

  const frameworkOptions: {
    name: string;
    options: BuilderOptions;
  } = await presets.apply('frameworkOptions');

  return frameworkOptions?.options || {};
};

// export `build` is used by storybook core
export const build: StorybookBuilder['build'] = async ({ options }) => {
  const config = await getConfig(options);

  const compiler = await getCompiler(process.cwd(), config, options);

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
  const previewResolvedDir = dirname(
    require.resolve('@storybook/preview/package.json'),
  );
  const previewDirOrigin = join(previewResolvedDir, 'dist');

  router.use(
    `/sb-preview`,
    serveStatic(previewDirOrigin, { immutable: true, maxAge: '5m' }),
  );

  const config = await getConfig(options);

  const compiler = await getCompiler(process.cwd(), config, options);

  const middleware = webpackDevMiddleware(compiler, {
    writeToDisk:
      // @ts-expect-error
      config.builderConfig?.tools?.devServer?.devMiddleware?.writeToDisk ||
      true,

    // builder can log errors, so not using dev-middleware logs
    stats: false,
  });

  router.use(middleware);
  router.use(webpackHotMiddleware(compiler, { log: false }));

  const stats: Stats = await new Promise(resolve => {
    middleware.waitUntilValid(stats => {
      resolve(stats as Stats);
    });
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
  await finalize();
};
