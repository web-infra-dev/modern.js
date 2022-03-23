import type { CliPlugin } from '@modern-js/core';
import { defaultPolyfill } from './const';

export default (): CliPlugin => ({
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
  }),
});
