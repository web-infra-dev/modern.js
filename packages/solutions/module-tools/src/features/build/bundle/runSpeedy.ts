import { SpeedyBundler } from '@speedy-js/speedy-core';
import { CLIConfig, SpeedyPlugin } from '@speedy-js/speedy-types';
import { BundleBuildConfig } from './type';
import path from 'path';
import { PluginAPI } from '@modern-js/core';


export const runSpeedy = async (config: BundleBuildConfig, api: PluginAPI) => {
  const { appDirectory } = api.useAppContext();
  const { target, watch, tsconfig, bundleOption } = config;
  const plugins: SpeedyPlugin[] = [];
  Promise.all([...config.format.map(async format => {
    const distDir = path.join(appDirectory, `./dist/${format}`);
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
      ...bundleOption,
    };
    console.info('speedy', 'Build start');
    const startTime = new Date().getTime();
    const compiler = await SpeedyBundler.create(cliConfig);
    await compiler.build();
    const duration = new Date().getTime() - startTime;
    console.info('speedy', `Build success in ${duration}ms`);
  })])
};


