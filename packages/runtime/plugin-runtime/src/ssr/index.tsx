import { loadableReady } from '@loadable/component';
import hoistNonReactStatics from 'hoist-non-react-statics';
import type { Plugin } from '../core';
import {
  RenderLevel,
  SSRServerContext,
  SSRPluginConfig,
} from './serverRender/types';
import { WithCallback } from './react/withCallback';
import { formatClient, mockResponse, isReact18 } from './utils';

declare module '../core' {
  interface SSRContainer {
    renderLevel: RenderLevel;
    context?: SSRServerContext;
  }
}

export const ssr = (_: SSRPluginConfig): Plugin => ({
  name: '@modern-js/plugin-ssr',
  setup: () => {
    const mockResp = mockResponse();
    return {
      client: async ({ App, context, ModernRender, ModernHydrate }) => {
        const hydrateContext: { _hydration?: boolean } = {
          ...context,
          _hydration: true,
        };
        const callback = () => {
          // won't cause component re-render because context's reference identity doesn't change
          delete hydrateContext._hydration;
        };
        // react18 render
        if (isReact18()) {
          loadableReady(() => {
            // callback: https://github.com/reactwg/react-18/discussions/5
            let SSRApp: React.FC = () => (
              <WithCallback callback={callback}>
                <App context={hydrateContext} />
              </WithCallback>
            );
            SSRApp = hoistNonReactStatics(SSRApp, App);
            ModernHydrate(<SSRApp />);
          });
          return;
        }
        // react17 render
        // if render level not exist, use client render
        const renderLevel =
          window?._SSR_DATA?.renderLevel || RenderLevel.CLIENT_RENDER;

        // client render and server prefetch use same logic
        if (
          renderLevel === RenderLevel.CLIENT_RENDER ||
          renderLevel === RenderLevel.SERVER_PREFETCH
        ) {
          ModernRender(<App context={context} />);
        } else if (renderLevel === RenderLevel.SERVER_RENDER) {
          loadableReady(() => {
            ModernHydrate(<App context={hydrateContext} />, callback);
          });
        } else {
          // unknown renderlevel or renderlevel is server prefetch.
          console.warn(`unknow render level: ${renderLevel}, execute render()`);
          ModernRender(<App context={context} />);
        }
      },
      init({ context }, next) {
        const request: SSRServerContext['request'] | undefined =
          window?._SSR_DATA?.context?.request;
        if (!request) {
          context.ssrContext = {
            ...context.ssrContext!,
            response: mockResp,
            request: formatClient({} as any),
          };
          return next({ context });
        }

        context.ssrContext!.response = mockResp;
        context.ssrContext!.request = formatClient(request);
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
