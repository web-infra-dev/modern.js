import { initAppDir } from '@modern-js/plugin-v2/cli';
import { run as CLIPluginRun } from '@modern-js/plugin-v2/run';
import type { InternalPlugins } from '@modern-js/types';
import { minimist } from '@modern-js/utils';
import { handleSetupResult } from '../compat/hooks';
import { PACKAGE_JSON_CONFIG_NAME } from '../constants';
import { getConfigFile } from '../utils/getConfigFile';
import { isAutoLoadPlugins } from '../utils/isAutoLoadPlugins';
import { loadInternalPlugins } from '../utils/loadPlugins';

export interface RunOptions {
  cwd?: string;
  configFile?: string;
  metaName?: string;
  packageJsonConfig?: string;
  internalPlugins?: {
    cli?: InternalPlugins;
    autoLoad?: InternalPlugins;
  };
  initialLog?: string;
  version: string;
}
export async function run({
  cwd,
  initialLog,
  metaName = 'MODERN',
  version,
  internalPlugins,
  packageJsonConfig = PACKAGE_JSON_CONFIG_NAME,
  configFile,
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

  // set NODE_ENV value because configFile may use
  if (!process.env.NODE_ENV) {
    if (['build', 'serve', 'deploy', 'analyze'].includes(command)) {
      process.env.NODE_ENV = 'production';
    } else if (command === 'test') {
      process.env.NODE_ENV = 'test';
    } else {
      process.env.NODE_ENV = 'development';
    }
  }

  const appDirectory = await initAppDir(cwd);
  const finalConfigFile: string = customConfigFile || getConfigFile(configFile);
  const autoLoadPlugins = await isAutoLoadPlugins(
    appDirectory,
    finalConfigFile,
    packageJsonConfig,
    metaName,
  );
  const plugins = await loadInternalPlugins(
    appDirectory,
    internalPlugins?.cli,
    internalPlugins?.autoLoad,
    autoLoadPlugins,
  );

  await CLIPluginRun({
    cwd,
    initialLog: initialLog || `Modern.js Framework v${version}`,
    configFile: finalConfigFile,
    metaName,
    packageJsonConfig: packageJsonConfig,
    internalPlugins: plugins,
    handleSetupResult,
  });
}
