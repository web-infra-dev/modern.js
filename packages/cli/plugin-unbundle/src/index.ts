import {
  createPlugin,
  useAppContext,
  useResolvedConfigContext,
  registerHook,
} from '@modern-js/core';
import { PLUGIN_SCHEMAS } from '@modern-js/utils';
import { dev } from './dev';
import * as unbundleHooks from './hooks';

export * from './hooks';

export default createPlugin(
  () => {
    registerHook({ ...unbundleHooks });
    let closeDevServer: (() => Promise<void>) | undefined;
    return {
      validateSchema() {
        return PLUGIN_SCHEMAS['@modern-js/plugin-unbundle'];
      },
      commands({ program }) {
        const appContext = useAppContext();

        const config = useResolvedConfigContext();

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
            closeDevServer = await dev(config, appContext);
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
          const appContext = useAppContext();
          const config = useResolvedConfigContext();

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
  { name: '@modern-js/plugin-unbundle' },
);
