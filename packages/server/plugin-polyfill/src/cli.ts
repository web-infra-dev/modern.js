import type { AppTools, CliPluginFuture } from '@modern-js/app-tools';
import { defaultPolyfill } from './const';

export const polyfillPlugin = (): CliPluginFuture<AppTools> => ({
  name: '@modern-js/plugin-polyfill',

  setup: api => {
    api.htmlPartials(async ({ entrypoint, partials }) => {
      const resolvedConfig = api.useResolvedConfigContext();
      if (resolvedConfig.output.polyfill === 'ua') {
        partials.top.push(
          `<script src="${defaultPolyfill}" crossorigin></script>`,
        );
      }
      return { partials, entrypoint };
    });

    api._internalServerPlugins(async ({ plugins }) => {
      plugins.push({ name: '@modern-js/plugin-polyfill/server' });
      return { plugins };
    });
  },
});

export default polyfillPlugin;
