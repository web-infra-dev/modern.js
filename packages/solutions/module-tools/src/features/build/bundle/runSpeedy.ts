import path from 'path';
import { SpeedyBundler } from '@speedy-js/speedy-core';
import { CLIConfig, SpeedyPlugin } from '@speedy-js/speedy-types';
import type { PluginAPI } from '@modern-js/core';
import { NormalizedBundleBuildConfig } from '../types';
import { applyOptionsChain } from '@modern-js/utils';

export const runSpeedy = async (
  api: PluginAPI,
  config: NormalizedBundleBuildConfig,
) => {
  const { appDirectory } = api.useAppContext();
  const {
    output: { path: distPath = 'dist', enableSourceMap: sourceMap },
    tools: { speedy: userSpeedyConfig }
  } = api.useResolvedConfigContext();
  const { target, watch, bundleOption, outputPath, format } = config;
  const { entry, platform, splitting, minify, external } = bundleOption;


  const distDir = path.join(
    appDirectory,
    distPath,
    outputPath
  );
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
    external,
  };
  const speedyConfig = applyOptionsChain(internalSpeedyConfig, userSpeedyConfig);
  console.info(speedyConfig);
  console.info('speedy', 'Build start');
  const startTime = new Date().getTime();
  const compiler = await SpeedyBundler.create(speedyConfig);
  await compiler.build();
  const duration = new Date().getTime() - startTime;
  console.info('speedy', `Build success in ${duration}ms`);
};
