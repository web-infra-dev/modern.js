import { createPlugin, useResolvedConfigContext } from '@modern-js/core';
import { defaultPolyfill } from './const';

export default createPlugin(
  () =>
    ({
      htmlPartials({ entrypoint, partials }: any) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const resolvedConfig = useResolvedConfigContext();
        if (resolvedConfig.output.polyfill === 'ua') {
          partials.top.push(
            `<script src="${defaultPolyfill}" crossorigin></script>`,
          );
        }

        return { partials, entrypoint };
      },
    } as any),
  { name: '@modern-js/plugin-polyfill' },
);
