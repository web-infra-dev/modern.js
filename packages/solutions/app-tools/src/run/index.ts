import path from 'path';
import { initAppDir } from '@modern-js/plugin-v2/cli';
import { run as CLIPluginRun } from '@modern-js/plugin-v2/run';
import type { InternalPlugins } from '@modern-js/types';
import { chalk, minimist } from '@modern-js/utils';
import { handleSetupResult } from '../compat/hooks';
import { PACKAGE_JSON_CONFIG_NAME, STATE_PLUGIN_NAME } from '../constants';
import { getConfigFile } from '../utils/getConfigFile';
import { getUserConfig } from '../utils/getUserConfig';
import { loadInternalPlugins } from '../utils/loadPlugins';

export interface RunOptions {
  cwd?: string;
  configFile?: string;
  metaName?: string;
  packageJsonConfig?: string;
  statePluginName?: string;
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
  metaName = 'modern-js',
  version,
  internalPlugins,
  packageJsonConfig = PACKAGE_JSON_CONFIG_NAME,
  statePluginName = STATE_PLUGIN_NAME,
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
  const userConfig = await getUserConfig(
    appDirectory,
    finalConfigFile,
    packageJsonConfig,
    metaName,
  );
  const plugins = await loadInternalPlugins(
    appDirectory,
    internalPlugins?.cli,
    internalPlugins?.autoLoad,
    userConfig.autoLoadPlugins,
  );

  if (
    !userConfig.autoLoadPlugins &&
    userConfig.runtime &&
    typeof userConfig.runtime !== 'boolean' &&
    (userConfig.runtime?.state === true ||
      typeof userConfig.runtime?.state === 'object')
  ) {
    if (!userConfig.plugins.find(plugin => plugin.name === statePluginName)) {
      console.warn(
        `${chalk.red('\n[Warning]')} We will no longer support built-in \`runtime.state\`. If you want to use Reduck, you must run ${chalk.yellow.bold(`\`pnpm add ${statePluginName}@${version}\``)} to install the state plugin dependency and manually register the plugin. After install state plugin, please add the following code to ${chalk.yellow.bold(`\`${path.basename(finalConfigFile)}\``)}:

${chalk.yellow.bold(`import { statePlugin } from '${statePluginName}';

export default defineConfig({
  plugins: [
    ...,
    statePlugin(),
  ],
});
        `)}`,
      );
    }
  }

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
