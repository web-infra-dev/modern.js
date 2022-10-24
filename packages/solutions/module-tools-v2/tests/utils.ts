import path from 'path';
import { cli } from '@modern-js/core';
import { version } from '../package.json';

export const runCli = async (options: {
  argv: string[];
  configFile: string;
}) => {
  // because of `program.parse(process.argv)` in '/packages/cli/core/src' file
  // mock process.argv, 'bin/modern.js' instead of 'bin/jest.js'
  process.argv = [
    process.argv[0],
    path.join(__dirname, '../bin/modern.js'),
    ...options.argv,
  ];

  await cli.run(options.argv, {
    version,
    configFile: options.configFile,
    plugins: {
      '@modern-js/module-tools-v2': {
        path: path.join(__dirname, '../src'),
        forced: true,
      } as any,
    },
  });
};

export const initBeforeTest = () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  global.setImmediate = setTimeout;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  global.clearImmediate = clearTimeout;
};
