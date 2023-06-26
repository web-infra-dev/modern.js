import path from 'path';
import { cli } from '@modern-js/core';
import { version } from '../package.json';

export { defineConfig } from '../src/config/defineConfig';
export type { CliPlugin, ModuleTools } from '../src';

export const runCli = async (options: {
  argv: string[];
  configFile: string;
  appDirectory?: string;
  enableTailwindCss?: boolean;
}) => {
  const plugins: Record<string, any> = {
    '@modern-js/module-tools': {
      path: path.join(__dirname, '../src'),
      forced: true,
    } as any,
  };
  if (options.enableTailwindCss) {
    plugins['@modern-js/plugin-tailwindcss'] = {
      path: path.join(__dirname, '../../../cli/plugin-tailwind/src'),
      forced: true,
    };
  }

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
};
