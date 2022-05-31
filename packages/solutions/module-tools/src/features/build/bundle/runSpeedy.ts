import path from 'path';
import { SpeedyBundler } from '@speedy-js/speedy-core';
import { CLIConfig, SpeedyPlugin } from '@speedy-js/speedy-types';
import type { PluginAPI } from '@modern-js/core';
import { NormalizedBundleBuildConfig } from '../types';

export const runSpeedy = async (
  api: PluginAPI,
  config: NormalizedBundleBuildConfig,
) => {
  const { appDirectory } = api.useAppContext();
  const {
    output: { path: distPath = 'dist' },
  } = api.useResolvedConfigContext();
  const { target, watch, bundleOption, outputPath } = config;
  const plugins: SpeedyPlugin[] = [];
  Promise.all([
    ...config.format.map(async format => {
      const distDir = path.join(
        appDirectory,
        distPath,
        outputPath,
        `./${format}`,
      );
      const cliConfig: CLIConfig = {
        command: 'build',
        mode: 'production',
        preset: 'webapp',
        platform: 'node',
        watch,
        input: {
          index: bundleOption.entry ?? 'src/index.ts',
        },
        target,
        output: {
          path: distDir,
          format,
          filename: '[dir]/[name]',
        },
        html: false,
        plugins,
        ...bundleOption.speedyOption,
      };
      console.info('speedy', 'Build start');
      const startTime = new Date().getTime();
      const compiler = await SpeedyBundler.create(cliConfig);
      await compiler.build();
      const duration = new Date().getTime() - startTime;
      console.info('speedy', `Build success in ${duration}ms`);
    }),
  ]);
};
