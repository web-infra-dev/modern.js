import { SpeedyBundler } from '@speedy-js/speedy-core';
import { CLIConfig, SpeedyPlugin } from '@speedy-js/speedy-types';
import { TaskBuildConfig } from '../../types';
import path from 'path';


export const runSpeedy = async (config: TaskBuildConfig) => {
  const { enableWatchMode, entry, appDirectory, target, speedyOptions } = config;
  const watch = enableWatchMode;
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
        index: entry,
      },
      target,
      output: {
        path: distDir,
        format,
        filename: '[dir]/[name]',
      },
      html: false,
      plugins,
      ...speedyOptions,
    };
    console.info('speedy', 'Build start');
    const startTime = new Date().getTime();
    const compiler = await SpeedyBundler.create(cliConfig);
    await compiler.build();
    const duration = new Date().getTime() - startTime;
    console.info('speedy', `Build success in ${duration}ms`);
  })])
};


