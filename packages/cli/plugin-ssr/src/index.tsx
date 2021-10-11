// eslint-disable-next-line filenames/match-exported
import ReactDOM from 'react-dom';
import { createPlugin } from '@modern-js/runtime-core';
import { loadableReady } from '@loadable/component';
import { RenderLevel, SSRServerContext } from './serverRender/type';

declare module '@modern-js/runtime-core' {
  interface RuntimeContext {
    ssrContext?: any;
  }

  interface TRuntimeContext {
    request: SSRServerContext['request'];
  }
}
declare global {
  interface Window {
    _SSR_DATA: {
      renderLevel: RenderLevel;
      context?: SSRServerContext;
      data: {
        loadersData: Record<string, any>;
      };
    };
  }
}

const getQuery = () =>
  window.location.search
    .substring(1)
    .split('&')
    .reduce<Record<string, string>>((res, item) => {
      const [key, value] = item.split('=');
      res[key] = value;

      return res;
    }, {});

const ssr: any = () =>
  createPlugin(
    () => ({
      client: async ({ App, context, rootElement }) => {
        const renderLevel = window?._SSR_DATA?.renderLevel;

        if (renderLevel === RenderLevel.CLIENT_RENDER) {
          await (App as any)?.prefetch?.(context);
          ReactDOM.render(<App context={context} />, rootElement);
        } else if (renderLevel === RenderLevel.SERVER_RENDER) {
          loadableReady(() => {
            ReactDOM.hydrate(<App context={context} />, rootElement);
          });
        } else {
          // unknown renderlevel or renderlevel is server prefetch.
          ReactDOM.render(<App context={context} />, rootElement);
        }
      },
      pickContext: ({ context, pickedContext }, next) =>
        next({
          context,
          pickedContext: {
            ...pickedContext,
            request: {
              params: {},
              pathname: location.pathname,
              query: getQuery(),
              headers: {},
              cookie: document.cookie,
              ...(window?._SSR_DATA?.context?.request || {}),
            },
          },
        }),
    }),
    { name: '@modern-js/plugin-ssr' },
  );

export default ssr;

export * from './react';
