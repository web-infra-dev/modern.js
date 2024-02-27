import { run } from '@modern-js/core/runBin';

run({
  global: true,
  cwd: __dirname,
  internalPlugins: {
    cli: {
      'global-cli': 'global-cli',
    },
    autoLoad: {
      'global-cli': 'global-cli',
    },
  },
});
