import { chalk } from '@modern-js/utils';

const noDevTools = `
There are no DevTools available, you can learn about them and choose to use them by following the link options.
- ${chalk.underline(
  chalk.blue('[Storybook]'),
  'https://modernjs.dev/module-tools/guide/basic/using-storybook.html',
)}
`;

export const EN_LOCALE = {
  command: {
    build: {
      describe: 'command for building module',
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
      describe: 'start dev server',
      tsconfig: 'Specify a path to the tsconfig.json file',
    },
    new: {
      describe: 'generator runner for modern project',
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
};
