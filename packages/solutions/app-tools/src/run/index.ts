import { initAppDir } from '@modern-js/plugin/cli';
import { run as CLIPluginRun } from '@modern-js/plugin/run';
import type { InternalPlugins } from '@modern-js/types';
import { chalk, minimist } from '@modern-js/utils';
import { handleSetupResult } from '../compat/hooks';
import {
  type DevServerLockError,
  isDevServerLockError,
  setDevLockIntent,
} from '../utils/devLock';
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
  /**
   * Intentionally run this dev server alongside an already-running one
   * (equivalent to the `--allow-multiple` CLI flag; the option wins over
   * argv when both are present).
   */
  allowMultiple?: boolean;
}
export async function createRunOptions({
  cwd,
  initialLog,
  metaName = 'modern-js',
  version,
  internalPlugins,
  configFile,
  allowMultiple,
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
    'allow-multiple'?: boolean;
  }>(process.argv.slice(2), { boolean: ['allow-multiple'] });
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

  // Single place where the multi-dev intent is resolved: the typed run
  // option wins over the raw `--allow-multiple` flag. Stored run-scoped
  // (keyed by appDirectory) for the dev-lock plugin to read in `onPrepare`.
  setDevLockIntent(appDirectory, {
    allowMultiple: allowMultiple ?? Boolean(cliParams['allow-multiple']),
  });

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
  try {
    await CLIPluginRun(runOptions);
  } catch (err) {
    // Lock conflicts are expected, user-facing outcomes: print an actionable
    // message instead of a stack trace. Programmatic callers that invoke the
    // CLI directly (not through this wrapper) receive the typed error as-is.
    if (isDevServerLockError(err)) {
      printDevServerLockError(err);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
}

function printDevServerLockError(err: DevServerLockError) {
  console.error(`${chalk.red('error')}   [${err.code}] ${err.message}`);
  for (const instance of err.instances) {
    const url =
      instance.urls?.[0] ??
      (instance.port ? `http://localhost:${instance.port}` : undefined);
    console.error(
      `${chalk.red('error')}     ${instance.operation} (PID: ${instance.pid}${
        url ? `, URL: ${chalk.cyan(url)}` : ''
      })`,
    );
  }
  const [first] = err.instances;
  if (first) {
    const killCommand =
      process.platform === 'win32'
        ? `taskkill /PID ${first.pid} /F`
        : `kill ${first.pid}`;
    console.error(
      `${chalk.red('error')}   Reuse it, or stop it first: ${chalk.cyan(killCommand)}`,
    );
  }
  if (err.code === 'EDEV_SERVER_RUNNING') {
    console.error(
      `${chalk.red('error')}   To intentionally run another dev server: ${chalk.cyan(
        'modern dev --allow-multiple',
      )}`,
    );
  }
}
