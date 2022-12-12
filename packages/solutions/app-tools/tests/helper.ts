import path from 'path';
import { cli } from '@modern-js/core';
import { version } from '../package.json';

export type { CliPlugin } from '../src';

export const runCli = async (options: {
  argv: string[];
  configFile: string;
  appDirectory?: string;
  addonPlugins: Record<string, any>;
}) => {
  const plugins: Record<string, any> = {
    '@modern-js/app-tools': {
      path: path.join(__dirname, '../src'),
      forced: true,
    } as any,
    ...(options.addonPlugins || {}),
  };

  try {
    await cli.test(
      ['node', path.join(__dirname, '../bin/modern.js'), ...options.argv],
      {
        coreOptions: {
          cwd: options.appDirectory,
          version,
          configFile: options.configFile,
          internalPlugins: {
            cli: plugins,
          },
        },
        disableWatcher: true,
      },
    );
    return { code: 0, success: true, error: null };
  } catch (e) {
    return { code: 1, success: false, error: e as Error };
  }
};

export const initBeforeTest = () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  global.setImmediate = setTimeout;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  global.clearImmediate = clearTimeout;
  jest.setTimeout(50000);
};
