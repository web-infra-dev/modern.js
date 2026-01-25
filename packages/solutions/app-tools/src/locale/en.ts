export const EN_LOCALE = {
  command: {
    shared: {
      analyze: 'analyze bundle size',
      config:
        'specify the configuration file, which can be a relative or absolute path',
      skipBuild: 'skip the build phase',
      noNeedInstall: 'not run install command',
    },
    dev: {
      describe: 'starting the dev server',
      entry: 'compiler by entry',
      apiOnly: 'start api server only',
      webOnly: 'start web server only',
      selectEntry: 'Please select the entry that needs to be built',
      requireEntry: 'You must choose at least one entry',
    },
    build: {
      describe: 'build the app for production',
      watch: 'turn on watch mode, watch for changes and rebuild',
    },
    serve: { describe: 'preview the production build locally' },
    deploy: { describe: 'deploy the application' },
    new: {
      describe: 'enable optional features or add a new entry',
      debug: 'using debug mode to log something',
      config: 'set default generator config(json string)',
      distTag: `use specified tag version for it's generator`,
      registry: 'set npm registry url to run npm command',
      lang: 'set new command language(en or zh)',
    },
    inspect: {
      env: 'specify env mode',
      output: 'specify inspect content output path',
      verbose: 'show full function definitions in output',
    },
    info: {
      describe: 'show project information',
    },
  },
};
