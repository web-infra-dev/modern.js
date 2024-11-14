import { initAppDir } from '@modern-js/plugin-v2/cli';
import { run as CLIPluginRun } from '@modern-js/plugin-v2/run';
import type { InternalPlugins } from '@modern-js/types';
import { minimist } from '@modern-js/utils';
import { handleSetupResult } from './compat/hooks';
import { PACKAGE_JSON_CONFIG_NAME } from './constants';
import { getConfigFile } from './getConfigFile';
import { loadInternalPlugins } from './loadPlugins';
import { getIsAutoLoadPlugins } from './utils';

export interface RunOptions {
  cwd?: string;
  packageJsonConfig?: string;
  internalPlugins?: {
    cli?: InternalPlugins;
    autoLoad?: InternalPlugins;
  };
  forceAutoLoadPlugins?: boolean;
  version: string;
}
export async function run({
  cwd,
  version,
  internalPlugins,
  forceAutoLoadPlugins,
  packageJsonConfig,
}: RunOptions) {
  const command = process.argv[2];

  const cliParams = minimist<{
    c?: string;
    config?: string;
  }>(process.argv.slice(2));
  /**
   * Commands that support specify config files
   * `new` command need to use `--config-file` params,because `--config` is already used
   */
  const SUPPORT_CONFIG_PARAM_COMMANDS = [
    'dev',
    'build',
    'deploy',
    'start',
    'serve',
    'inspect',
    'upgrade',
  ];

  let customConfigFile;

  if (SUPPORT_CONFIG_PARAM_COMMANDS.includes(command)) {
    customConfigFile = cliParams.config || cliParams.c;
  }

  if (command === 'new') {
    customConfigFile = cliParams['config-file'];
  }

  const appDirectory = await initAppDir(cwd);
  const autoLoadPlugins = await getIsAutoLoadPlugins(
    appDirectory,
    customConfigFile || getConfigFile(),
  );
  const plugins = await loadInternalPlugins(
    appDirectory,
    internalPlugins?.cli,
    internalPlugins?.autoLoad,
    autoLoadPlugins,
    forceAutoLoadPlugins,
  );

  await CLIPluginRun({
    cwd,
    initialLog: `Modern.js Framework v${version}`,
    configFile: customConfigFile || getConfigFile(),
    packageJsonConfig: packageJsonConfig || PACKAGE_JSON_CONFIG_NAME,
    internalPlugins: plugins,
    handleSetupResult,
  });
}
