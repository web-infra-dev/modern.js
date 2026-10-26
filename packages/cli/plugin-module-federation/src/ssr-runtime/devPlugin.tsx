import type { RuntimePlugin, RuntimePluginExtends } from '@modern-js/plugin';
import { SSRLiveReload } from './SSRLiveReload';
import { flushDataFetch } from '@module-federation/bridge-react/data-fetch';

export const mfSSRDevPlugin = (): RuntimePlugin<
  Required<RuntimePluginExtends>
> => ({
  name: '@modern-js/builtin-module-federation',

  setup: api => {
    api.onBeforeRender(async () => {
      if (typeof window !== 'undefined') {
        return;
      }
      globalThis.shouldUpdate = false;
      const nodeUtils = await import('@module-federation/node/utils');
      const shouldUpdate = await nodeUtils.revalidate();
      console.log('shouldUpdate: ', shouldUpdate);
      if (shouldUpdate) {
        console.log('should RELOAD', shouldUpdate);
        await nodeUtils.flushChunks();
        flushDataFetch();
        globalThis.shouldUpdate = true;
      }
    });
    api.wrapRoot(App => {
      const AppWrapper = (props: any) => (
        <>
          <SSRLiveReload />
          <App {...props} />
        </>
      );
      return AppWrapper;
    });
  },
});
