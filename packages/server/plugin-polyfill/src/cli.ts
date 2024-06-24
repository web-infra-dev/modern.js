import type { CliPlugin } from '@modern-js/core';
import type { AppTools } from '@modern-js/app-tools';
import { defaultPolyfill } from './const';

export const polyfillPlugin = (): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-polyfill',

  setup: api => ({
    htmlPartials({ entrypoint, partials }: any) {
      const resolvedConfig = api.useResolvedConfigContext();
      if (resolvedConfig.output.polyfill === 'ua') {
        partials.top.push(
          `<script src="${defaultPolyfill}" crossorigin></script>`,
        );
      }

      return { partials, entrypoint };
    },

    _internalServerPlugins({ plugins }) {
      plugins.push({ name: '@modern-js/plugin-polyfill/server' });
      return { plugins };
    },
  }),
});

export default polyfillPlugin;
