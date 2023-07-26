import path from 'path';
import { cli } from '@modern-js/core';
import { version } from '../package.json';

export { defineConfig } from '@modern-js/module-tools';
export type { CliPlugin, ModuleTools } from '@modern-js/module-tools';

export const rootDir = path.join(__dirname, '../../../..');

export const runCli = async (options: {
  argv: string[];
  configFile: string;
  appDirectory?: string;
  enableTailwindCss?: boolean;
}) => {
  const plugins: Record<string, any> = {
    '@modern-js/module-tools': {
      path: path.join(rootDir, './packages/solutions/module-tools/src'),
      forced: true,
    } as any,
  };
  if (options.enableTailwindCss) {
    plugins['@modern-js/plugin-tailwindcss'] = {
      path: path.join(rootDir, './packages/cli/plugin-tailwind/src'),
      forced: true,
    };
  }

  try {
    await cli.test(
      [
        'node',
        path.join(rootDir, './packages/solutions/module-tools/bin/modern.js'),
        ...options.argv,
      ],
      {
        coreOptions: {
          cwd: options.appDirectory,
          version,
          configFile: options.configFile,
          internalPlugins: {
            cli: plugins,
          },
          forceAutoLoadPlugins: true,
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
  // @ts-expect-error
  global.setImmediate = setTimeout;

  // @ts-expect-error
  global.clearImmediate = clearTimeout;

  jest.setTimeout(50000);

  jest.mock(
    path.join(rootDir, './packages/solutions/module-tools/src/utils/onExit.ts'),
    () => {
      return {
        __esModule: true,
        addExitListener: jest.fn(() => 'mocked'),
      };
    },
  );
};
