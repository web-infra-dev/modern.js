import { dirname, join, parse } from 'path';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import express from 'express';
import type { Builder as RawStorybookBuilder, Stats } from '@storybook/types';
import { fs } from '@modern-js/utils';
import type { FrameworkOptions } from './types';
import { getCompiler } from './core';

export type StorybookBuilder = RawStorybookBuilder<FrameworkOptions, Stats>;

export const getConfig: StorybookBuilder['getConfig'] = async options => {
  const { presets } = options;

  const frameworkOptions: {
    name: string;
    options: FrameworkOptions;
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
  const config = await getConfig(options);

  const compiler = await getCompiler(process.cwd(), config, options);

  const middleware = webpackDevMiddleware(compiler, {
    writeToDisk:
      // @ts-expect-error
      config.builderConfig?.tools?.devServer?.devMiddleware?.writeToDisk ||
      true,
  });

  const previewResolvedDir = dirname(
    require.resolve('@storybook/preview/package.json'),
  );
  const previewDirOrigin = join(previewResolvedDir, 'dist');

  router.use(
    `/sb-preview`,
    express.static(previewDirOrigin, { immutable: true, maxAge: '5m' }),
  );

  router.use(webpackHotMiddleware(compiler, { log: false }));

  router.use(middleware);

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

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const bail = async () => {};
