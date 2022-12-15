import type { CliPlugin } from '@modern-js/core';
import type { AppTools } from '@modern-js/app-tools';
import { SERVER_PLUGIN_POLYFILL } from '@modern-js/utils/constants';
import { defaultPolyfill } from './const';

export default (): CliPlugin<AppTools> => ({
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

    collectServerPlugins({ plugins }) {
      plugins.push(SERVER_PLUGIN_POLYFILL);
      return { plugins };
    },
  }),
});
