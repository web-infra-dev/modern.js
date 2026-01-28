import { dirname, join, parse } from 'path';
import { fs } from '@modern-js/utils';
import type { Builder as RawStorybookBuilder, Stats } from '@storybook/types';
import serveStatic from 'serve-static';
import { createBuilder } from './core';
import { finalize } from './plugin-storybook';
import type { BuilderOptions } from './types';

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

  const builder = await createBuilder(process.cwd(), config, options);

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

  let stats: Stats;

  builder.onAfterBuild(params => {
    stats = params.stats as Stats;
  });

  await Promise.all([builder.build(), previewFiles]);

  return stats!;
};

let server: {
  close: () => Promise<void>;
};

// export `start` is used by storybook core
export const start: StorybookBuilder['start'] = async ({
  options,
  router,
  startTime,
  server: storybookServer,
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

  const builder = await createBuilder(process.cwd(), config, options);

  const waitFirstCompileDone = new Promise<Stats>(resolve => {
    builder.onDevCompileDone(({ stats, isFirstCompile }) => {
      if (!isFirstCompile) {
        return;
      }
      resolve(stats as Stats);
    });
  });

  const rsbuildServer = await builder.createDevServer();
  server = rsbuildServer;

  router.use(rsbuildServer.middlewares);

  // Type assertion: storybookServer is compatible with HTTPServer (Server | Http2SecureServer)
  rsbuildServer.connectWebSocket({ server: storybookServer as any });

  await rsbuildServer.afterListen();

  const stats = await waitFirstCompileDone;

  return {
    bail,
    stats,
    totalTime: process.hrtime(startTime),
  };
};

export const bail = async () => {
  await finalize();
  await server?.close();
};
