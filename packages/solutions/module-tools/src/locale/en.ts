import { chalk } from '@modern-js/utils';

const noDevTools = `There are no DevTools available, you can learn about them and choose to use them by following the link options.
  - ${chalk.underline(
    chalk.blue('[Storybook]'),
    'https://modernjs.dev/module-tools/guide/basic/using-storybook.html',
  )}
`;

export const EN_LOCALE = {
  command: {
    build: {
      describe: 'build the module for production',
      watch: 'building module in watch mode',
      tsconfig: 'Specify a path to the tsconfig.json file',
      styleOnly: 'only build style',
      platform:
        'build the specified task or all tasks, If exist. (tasks: "storybook", "docs")',
      noTsc: 'close tsc compiler to emit d.ts (Deprecated)',
      dts: 'Turn on dts generation and type checking',
      noClear: 'disable auto clear dist dir',
      config: 'specify config file',
    },
    dev: {
      describe: 'run and debug the module',
      tsconfig: 'Specify a path to the tsconfig.json file',
    },
    new: {
      describe: 'enable optional features',
      debug: 'using debug mode to log something',
      config: 'set default generator config(json string)',
      distTag: `use specified tag version for it's generator`,
      registry: 'set npm registry url to run npm command',
      lang: 'set new command language(en or zh)',
    },
  },
  log: {
    dev: {
      noDevtools: noDevTools,
    },
  },
  dts: {
    abortOnError:
      'With the `dts.abortOnError` configuration currently turned off, type errors do not cause build failures, but they do not guarantee proper type file output',
  },
};
