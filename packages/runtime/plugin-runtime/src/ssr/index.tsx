import { loadableReady } from '@loadable/component';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { useLayoutEffect, useRef } from 'react';
import type { Plugin } from '../core';
import { RenderLevel, SSRServerContext } from './serverRender/type';
import { formatClient, mockResponse } from './utils';

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
      client: async ({ App, context, rootElement, ReactDOM }) => {
        const renderLevel = window?._SSR_DATA?.renderLevel;

        if (renderLevel === RenderLevel.CLIENT_RENDER) {
          await (App as any)?.prefetch?.(context);
          if (context?.isReact18) {
            const root = ReactDOM.createRoot(rootElement);
            root.render(<App context={context} />);
          } else {
            ReactDOM.render(<App context={context} />, rootElement);
          }
        } else if (renderLevel === RenderLevel.SERVER_RENDER) {
          loadableReady(() => {
            const hydrateContext = { ...context, _hydration: true };
            if (context?.isReact18) {
              const WithCallback: React.FC<{
                callback: () => void;
                children: React.ReactElement;
              }> = ({ callback, children }) => {
                // See https://github.com/reactwg/react-18/discussions/5#discussioncomment-2276079
                const once = useRef(false);
                useLayoutEffect(() => {
                  if (once.current) {
                    return;
                  }
                  once.current = true;
                  callback();
                }, [callback]);

                return children;
              };
              const callback = () => {
                // won't cause component re-render because context's reference identity doesn't change
                delete (hydrateContext as any)._hydration;
              };
              let SSRApp: React.FC = () => (
                <WithCallback callback={callback}>
                  <App context={hydrateContext} callback={callback} />
                </WithCallback>
              );
              SSRApp = hoistNonReactStatics(SSRApp, App);
              ReactDOM.hydrateRoot(rootElement, <SSRApp />);
            } else {
              ReactDOM.hydrate(
                <App context={hydrateContext} />,
                rootElement,
                () => {
                  // won't cause component re-render because context's reference identity doesn't change
                  delete (hydrateContext as any)._hydration;
                },
              );
            }
          });
        } else if (context?.isReact18) {
          ReactDOM.hydrateRoot(rootElement, <App context={context} />);
        } else {
          // unknown renderlevel or renderlevel is server prefetch.
          ReactDOM.render(<App context={context} />, rootElement);
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
