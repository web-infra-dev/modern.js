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

  interface SSRContainer {
    renderLevel: RenderLevel;
    context?: SSRServerContext;
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
            const hydrateContext = { ...context, _hydration: true };
            ReactDOM.hydrate(
              <App context={hydrateContext} />,
              rootElement,
              () => {
                // won't cause component re-render because context's reference identity doesn't change
                delete (hydrateContext as any)._hydration;
              },
            );
          });
        } else {
          // unknown renderlevel or renderlevel is server prefetch.
          ReactDOM.render(<App context={context} />, rootElement);
        }
      },
      pickContext: ({ context, pickedContext }, next) => {
        const request: SSRServerContext['request'] | undefined =
          window?._SSR_DATA?.context?.request;
        return next({
          context,
          pickedContext: {
            ...pickedContext,
            request: {
              params: {},
              host: location.host,
              pathname: location.pathname,
              query: getQuery(),
              headers: {},
              url: location.href,
              cookieMap: request?.cookieMap || {},
              cookie: request?.headers.cookie || document.cookie,
              referer: request?.referer || document.referrer,
              userAgent: request?.headers['user-agent'] || navigator.userAgent,
              ...request,
            },
          },
        });
      },
    }),
    { name: '@modern-js/plugin-ssr' },
  );

export default ssr;

export * from './react';
