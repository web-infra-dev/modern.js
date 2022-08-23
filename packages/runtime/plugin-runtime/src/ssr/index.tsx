import { loadableReady } from '@loadable/component';
import hoistNonReactStatics from 'hoist-non-react-statics';
import type { Plugin } from '../core';
import { RenderLevel, SSRServerContext } from './serverRender/type';
import { WithCallback } from './react/withCallback';
import { formatClient, mockResponse } from './utils';

const IS_REACT18 = process.env.IS_REACT18 === 'true';

declare module '../core' {
  interface RuntimeContext {
    ssrContext: SSRServerContext;
  }

  interface TRuntimeContext {
    request: SSRServerContext['request'];
    response: SSRServerContext['response'];
  }

  interface SSRContainer {
    renderLevel: RenderLevel;
    context?: SSRServerContext;
  }
}

const ssr = (): Plugin => ({
  name: '@modern-js/plugin-ssr',
  setup: () => {
    const mockResp = mockResponse();
    return {
      client: async ({ App, context, ModernRender, ModernHydrate }) => {
        const renderLevel = window?._SSR_DATA?.renderLevel;

        if (renderLevel === RenderLevel.CLIENT_RENDER) {
          // prefetch block render while csr
          //   await (App as any)?.prefetch?.(context);
          ModernRender(<App context={context} />);
        } else if (renderLevel === RenderLevel.SERVER_RENDER) {
          loadableReady(() => {
            const hydrateContext = { ...context, _hydration: true };
            const callback = () => {
              // won't cause component re-render because context's reference identity doesn't change
              delete (hydrateContext as any)._hydration;
            };
            // callback: https://github.com/reactwg/react-18/discussions/5
            if (IS_REACT18) {
              let SSRApp: React.FC = () => (
                <WithCallback callback={callback}>
                  <App context={hydrateContext} />
                </WithCallback>
              );
              SSRApp = hoistNonReactStatics(SSRApp, App);
              ModernHydrate(<SSRApp />);
            } else {
              ModernHydrate(<App context={hydrateContext} />, callback);
            }
          });
        } else {
          // unknown renderlevel or renderlevel is server prefetch.
          ModernHydrate(<App context={context} />);
        }
      },
      init({ context }, next) {
        const request: SSRServerContext['request'] | undefined =
          window?._SSR_DATA?.context?.request;
        if (!request) {
          context.ssrContext = {
            ...context.ssrContext,
            response: mockResp,
            request: formatClient({} as any),
          };
          return next({ context });
        }

        context.ssrContext.response = mockResp;
        context.ssrContext.request = formatClient(request);
        return next({ context });
      },
      pickContext: ({ context, pickedContext }, next) => {
        const request: SSRServerContext['request'] | undefined =
          window?._SSR_DATA?.context?.request;
        const { initialData } = context;

        if (!request) {
          return next({
            context,
            pickedContext: {
              ...pickedContext,
              initialData,
            },
          });
        }

        return next({
          context,
          pickedContext: {
            ...pickedContext,
            initialData,
            request,
            response: mockResp,
          },
        });
      },
    };
  },
});

export default ssr;

export * from './react';
