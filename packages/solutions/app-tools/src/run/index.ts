import { initAppDir } from '@modern-js/plugin/cli';
import { run as CLIPluginRun } from '@modern-js/plugin/run';
import type { InternalPlugins } from '@modern-js/types';
import { chalk, minimist } from '@modern-js/utils';
import { handleSetupResult } from '../compat/hooks';
import { getConfigFile } from '../utils/getConfigFile';
import { loadInternalPlugins } from '../utils/loadPlugins';

export interface RunOptions {
  cwd?: string;
  configFile?: string;
  metaName?: string;
  statePluginName?: string;
  internalPlugins?: InternalPlugins;
  initialLog?: string;
  version: string;
}
export async function createRunOptions({
  cwd,
  initialLog,
  metaName = 'modern-js',
  version,
  internalPlugins,
  configFile,
}: RunOptions) {
  const nodeVersion = process.versions.node;
  const versionArr = nodeVersion.split('.').map(Number);

  if (versionArr[0] <= 16) {
    console.warn(`
  ${chalk.bgRed.white.bold(' ⚠️ CRITICAL NODE.JS VERSION ALERT ⚠️ ')}

  ${chalk.red.bold('Node.js 16 End-of-Life Notice:')}
  ${chalk.red('- Security updates and support have ended for Node.js 16')}

  ${chalk.yellow('▸ Detected Runtime:')}  ${chalk.yellow.bold(`Node.js v${nodeVersion}`)}
  ${chalk.green('▸ Required Minimum:')} ${chalk.green.bold('Node.js LTS (v18.x or higher)')}
  ${chalk.green('▸ Recommended:')} ${chalk.green.bold('Node.js LTS (v22.x or higher)')}

  ${chalk.cyan('Immediate Action Required:')}
    ${chalk.gray('├──')} ${chalk.yellow('Recommended Upgrade')}
       ${chalk.bold('nvm install 22 --lts && nvm use 22')}
    ${chalk.gray('├──')} ${chalk.yellow('Manual Installation')}
       ${chalk.underline('https://nodejs.org/download/release/lts-hydrogen/')}
     ${chalk.gray('└──')} ${chalk.yellow('Environment Verification')}
       ${chalk.bold('node -v && npm -v')}

  ${chalk.hex('#AAAAAA').italic('[Security Advisory] Node.js 16 is no longer supported. Upgrade immediately for security and compatibility.')}
      `);
  }
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
    'info',
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
  const finalConfigFile: string = customConfigFile || getConfigFile(configFile);

  const plugins = await loadInternalPlugins(appDirectory, internalPlugins);

  return {
    cwd,
    initialLog: initialLog || `Modern.js Framework v${version}`,
    configFile: finalConfigFile,
    metaName,
    internalPlugins: plugins,
    handleSetupResult,
  };
}

export async function run(options: RunOptions) {
  const runOptions = await createRunOptions(options);
  await CLIPluginRun(runOptions);
}
