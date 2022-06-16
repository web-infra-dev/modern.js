import path from 'path';
import { SpeedyBundler } from '@speedy-js/speedy-core';
import { CLIConfig } from '@speedy-js/speedy-types';
import type { PluginAPI } from '@modern-js/core';
import { applyOptionsChain } from '@modern-js/utils';
import { NormalizedBundleBuildConfig } from '../types';

export const runSpeedy = async (
  api: PluginAPI,
  config: NormalizedBundleBuildConfig,
) => {
  const { appDirectory } = api.useAppContext();
  const {
    output: { path: distPath = 'dist' },
    tools: { speedy: userSpeedyConfig },
  } = api.useResolvedConfigContext();
  const { target, watch, bundleOptions, outputPath, format, sourceMap } =
    config;
  const { entry, platform, splitting, minify, externals } = bundleOptions;
  const distDir = path.join(appDirectory, distPath, outputPath);
  const internalSpeedyConfig: CLIConfig = {
    command: 'build',
    mode: 'production',
    html: false,
    preset: 'webapp', // support css and json
    platform,
    watch,
    input: entry,
    target,
    output: {
      path: distDir,
      format,
      splitting,
      filename: '[name]',
    },
    sourceMap,
    minify,
    external: externals,
  };
  const speedyConfig = applyOptionsChain(
    internalSpeedyConfig,
    userSpeedyConfig,
  );
  console.info('speedy', 'Build start');
  const startTime = new Date().getTime();
  const compiler = await SpeedyBundler.create(speedyConfig);
  await compiler.build();
  const duration = new Date().getTime() - startTime;
  console.info('speedy', `Build success in ${duration}ms`);
};
