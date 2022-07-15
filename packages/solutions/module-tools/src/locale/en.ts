export const EN_LOCALE = {
  command: {
    build: {
      describe: 'command for building module',
      watch: 'building module in watch mode',
      tsconfig: 'Specify a path to the tsconfig.json file',
      style_only: 'only build style',
      platform:
        'build the specified task or all tasks, If exist. (tasks: "storybook", "docs")',
      no_tsc: 'close tsc compiler to emit d.ts (Deprecated)',
      dts: 'Turn on dts generation and type checking',
      no_clear: 'disable auto clear dist dir',
      config: 'specify config file',
    },
    dev: { describe: 'start dev server' },
    new: {
      describe: 'generator runner for modern project',
      debug: 'using debug mode to log something',
      config: 'set default generator config(json string)',
      distTag: `use specified tag version for it's generator`,
      registry: 'set npm registry url to run npm command',
    },
  },
};
