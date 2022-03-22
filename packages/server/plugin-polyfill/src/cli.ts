import type { CliPlugin } from '@modern-js/core';
import { defaultPolyfill } from './const';

export default (): CliPlugin => ({
    name: "@modern-js/plugin-polyfill",

    setup: api => {
      return {
        htmlPartials({ entrypoint, partials }: any) {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const resolvedConfig = api.useResolvedConfigContext();
          if (resolvedConfig.output.polyfill === 'ua') {
            partials.top.push(
              `<script src="${defaultPolyfill}" crossorigin></script>`,
            );
          }

          return { partials, entrypoint };
        }
      }
    }
})
