import { callDataFetch } from '@module-federation/bridge-react/data-fetch-utils';
import { setSSREnv } from '@module-federation/bridge-react/lazy-utils';

import type { RuntimePlugin } from '@modern-js/runtime';

export const injectDataFetchFunctionPlugin = ({
  fetchServerQuery,
}: {
  fetchServerQuery?: Record<string, unknown>;
}): RuntimePlugin => ({
  name: '@module-federation/inject-data-fetch-function-plugin',

  setup: api => {
    api.onBeforeRender(async () => {
      setSSREnv({ fetchServerQuery });

      await callDataFetch();
    });
  },
});
