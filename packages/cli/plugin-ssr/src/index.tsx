import ReactDOM from 'react-dom';
import type { Plugin } from '@modern-js/runtime-core';
import { loadableReady } from '@loadable/component';
import { RenderLevel, SSRServerContext } from './serverRender/type';
import { formatClient } from './utils';

declare module '@modern-js/runtime-core' {
  interface RuntimeContext {
    ssrContext: SSRServerContext;
  }

  interface TRuntimeContext {
    request: SSRServerContext['request'];
  }

  interface SSRContainer {
    renderLevel: RenderLevel;
    context?: SSRServerContext;
  }
}

const ssr = (): Plugin => ({
  name: '@modern-js/plugin-ssr',
  setup: () => {
    return {
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
      init({ context }, next) {
        const request: SSRServerContext['request'] | undefined =
          window?._SSR_DATA?.context?.request;
        if (!request) {
          return next({ context });
        }

        context.ssrContext.request = formatClient(request);
        return next({ context });
      },
      pickContext: ({ context, pickedContext }, next) => {
        const request: SSRServerContext['request'] | undefined =
          window?._SSR_DATA?.context?.request;

        if (!request) {
          return next({ context, pickedContext });
        }

        return next({
          context,
          pickedContext: {
            ...pickedContext,
            request,
          },
        });
      },
    };
  },
});

export default ssr;

export * from './react';
