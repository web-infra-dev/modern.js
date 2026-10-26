import {
  callDataFetch,
  setSSREnv,
} from '@module-federation/bridge-react/data-fetch';

import type { RuntimePlugin, RuntimePluginExtends } from '@modern-js/plugin';

export const injectDataFetchFunctionPlugin = ({
  fetchServerQuery,
}: {
  fetchServerQuery?: Record<string, unknown>;
}): RuntimePlugin<Required<RuntimePluginExtends>> => ({
  name: '@module-federation/inject-data-fetch-function-plugin',

  setup: api => {
    api.onBeforeRender(async () => {
      setSSREnv({ fetchServerQuery });

      await callDataFetch();
    });
  },
});
