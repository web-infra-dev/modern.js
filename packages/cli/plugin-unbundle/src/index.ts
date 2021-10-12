import {
  createPlugin,
  useAppContext,
  useResolvedConfigContext,
} from '@modern-js/core';
import { PLUGIN_SCHEMAS } from '@modern-js/utils';
import { dev } from './dev';

export default createPlugin(
  () => ({
    validateSchema() {
      return PLUGIN_SCHEMAS['@modern-js/plugin-unbundle'];
    },
    commands({ program }) {
      const appContext = useAppContext();

      const config = useResolvedConfigContext();

      const devCommand = program.commandsMap.get('dev');

      devCommand.option('--unbundled', 'dev with unbundled mode');

      if (
        process.argv.slice(2)[0] === 'dev' &&
        process.argv.includes('--unbundled')
      ) {
        devCommand.action(async () => {
          await dev(config, appContext);
        });
      }
    },
    async htmlPartials({ entrypoint, partials }) {
      if (process.argv[2] === 'dev' && process.argv.includes('--unbundled')) {
        const appContext = useAppContext();
        const config = useResolvedConfigContext();

        const { createHtmlPartials } = await import('./create-entry');

        partials.head.push(createHtmlPartials(entrypoint, appContext, config));
      }

      return {
        entrypoint,
        partials,
      };
    },
  }),
  { name: '@modern-js/plugin-unbundle' },
);
