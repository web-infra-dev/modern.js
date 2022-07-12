import type { CliPlugin } from '@modern-js/core';
import { PLUGIN_SCHEMAS } from '@modern-js/utils';
import { dev } from './dev';
import { hooks } from './hooks';

export * from './hooks';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-unbundle',

  registerHook: hooks,

  setup: api => {
    let closeDevServer: (() => Promise<void>) | undefined;

    return {
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-unbundle'];
      },
      commands({ program }) {
        const appContext = api.useAppContext();
        const config = api.useResolvedConfigContext();

        const devCommand = program.commandsMap.get('dev');

        devCommand?.option('--unbundled', 'dev with unbundled mode');

        if (
          process.argv.slice(2)[0] === 'dev' &&
          process.argv.includes('--unbundled')
        ) {
          devCommand?.action(async () => {
            if (closeDevServer) {
              await closeDevServer();
              closeDevServer = undefined;
            }
            closeDevServer = await dev(api, config, appContext);
          });
        }
      },
      async beforeRestart() {
        if (closeDevServer) {
          await closeDevServer();
        }
        closeDevServer = undefined;
      },
      async htmlPartials({ entrypoint, partials }) {
        if (process.argv[2] === 'dev' && process.argv.includes('--unbundled')) {
          const appContext = api.useAppContext();
          const config = api.useResolvedConfigContext();

          const { createHtmlPartials } = await import('./create-entry');

          partials.head.push(
            createHtmlPartials(entrypoint, appContext, config),
          );
        }

        return {
          entrypoint,
          partials,
        };
      },
    };
  },
});
