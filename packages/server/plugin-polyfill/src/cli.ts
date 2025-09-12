import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import { defaultPolyfill } from './const';

export const polyfillPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-polyfill',

  setup: api => {
    api.modifyHtmlPartials(async ({ entrypoint, partials }) => {
      const resolvedConfig = api.getNormalizedConfig();
      if (resolvedConfig.output.polyfill === 'ua') {
        partials.top.append(
          `<script src="${defaultPolyfill}" crossorigin></script>`,
        );
      }
    });

    api._internalServerPlugins(async ({ plugins }) => {
      plugins.push({ name: '@modern-js/plugin-polyfill/server' });
      return { plugins };
    });
  },
});

export default polyfillPlugin;
