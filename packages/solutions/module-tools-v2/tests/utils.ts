import path from 'path';
import { cli } from '@modern-js/core';
import { version } from '../package.json';

export { defineConfig } from '../src/config/defineConfig';

export const runCli = async (options: {
  argv: string[];
  configFile: string;
  appDirectory?: string;
  enableTailwindCss?: boolean;
}) => {
  const plugins: Record<string, any> = {
    '@modern-js/module-tools-v2': {
      cli: path.join(__dirname, '../src'),
      forced: true,
    } as any,
  };
  if (options.enableTailwindCss) {
    plugins['@modern-js/plugin-tailwindcss'] = {
      cli: path.join(__dirname, '../../../cli/plugin-tailwind/src'),
      forced: true,
    };
  }
  await cli.test(
    ['node', path.join(__dirname, '../bin/modern.js'), ...options.argv],
    {
      coreOptions: {
        cwd: options.appDirectory,
        version,
        configFile: options.configFile,
        plugins,
      },
    },
  );
};

export const initBeforeTest = () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  global.setImmediate = setTimeout;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  global.clearImmediate = clearTimeout;
};
