import type { CliPlugin } from '@modern-js/core';
import type { UserConfig, ServerOptions } from '@modern-js/server-core';
import { defaultPolyfill } from './const';

export default (): CliPlugin<{
  userConfig: UserConfig;
  normalizedConfig: ServerOptions;
}> => ({
  name: '@modern-js/plugin-polyfill',

  setup: api =>
    ({
      htmlPartials({ entrypoint, partials }: any) {
        const resolvedConfig = api.useResolvedConfigContext();
        if (resolvedConfig.output.polyfill === 'ua') {
          partials.top.push(
            `<script src="${defaultPolyfill}" crossorigin></script>`,
          );
        }

        return { partials, entrypoint };
      },
    } as any),
});
