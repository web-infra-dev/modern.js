import { loadableReady } from '@loadable/component';
import { parsedJSONFromElement } from '@modern-js/runtime-utils/parsed';
import { normalizePathname } from '@modern-js/runtime-utils/url';
import type { Plugin, RuntimeContext } from '../core';
import {
  RenderLevel,
  SSRServerContext,
  SSRPluginConfig,
} from './serverRender/types';
import { WithCallback } from './react/withCallback';
import { formatClient, mockResponse, isReact18 } from './utils';
import {
  ROUTER_DATA_JSON_ID,
  SSR_DATA_JSON_ID,
} from './serverRender/constants';

declare module '../core' {
  interface SSRContainer {
    renderLevel: RenderLevel;
    context?: SSRServerContext;
  }
}

export const ssr = (config: SSRPluginConfig): Plugin => ({
  name: '@modern-js/plugin-ssr',
  setup: () => {
    const mockResp = mockResponse();

    if (config.inlineScript === false) {
      const ssrData = parsedJSONFromElement(SSR_DATA_JSON_ID);
      window._SSR_DATA = ssrData || window._SSR_DATA;

      const routeData = parsedJSONFromElement(ROUTER_DATA_JSON_ID);
      window._ROUTER_DATA = routeData || window._ROUTER_DATA;
    }

    return {
      client: async ({ App, context, ModernRender, ModernHydrate }) => {
        const hydrateContext: RuntimeContext & { __hydration?: boolean } = {
          ...context,
          get routes() {
            return context.routes;
          },
          _hydration: true,
        };
        const { ssrContext } = hydrateContext;
        const currentPathname = normalizePathname(window.location.pathname);
        const initialPathname = normalizePathname(ssrContext!.request.pathname);
        if (initialPathname !== currentPathname && context.router) {
          const errorMsg = `The initial URL ${initialPathname} and the URL ${currentPathname} to be hydrated do not match, reload.`;
          console.error(errorMsg);
          window.location.reload();
        }

        const callback = () => {
          // won't cause component re-render because context's reference identity doesn't change
          delete hydrateContext._hydration;
        };

        // if render level not exist, use client render
        const renderLevel =
          window?._SSR_DATA?.renderLevel || RenderLevel.CLIENT_RENDER;

        // react streamSSR hydrate
        if (isReact18() && config.mode === 'stream') {
          return streamSSRHydrate();
        }
        // react stringSSR hydrate
        return stringSSRHydrate();

        function stringSSRHydrate() {
          // client render and server prefetch use same logic
          if (
            renderLevel === RenderLevel.CLIENT_RENDER ||
            renderLevel === RenderLevel.SERVER_PREFETCH
          ) {
            ModernRender(App);
          } else if (renderLevel === RenderLevel.SERVER_RENDER) {
            const loadableReadyOptions: any = {
              chunkLoadingGlobal: config.chunkLoadingGlobal,
            };
            if (isReact18()) {
              loadableReady(() => {
                // callback: https://github.com/reactwg/react-18/discussions/5
                const SSRApp: React.FC = () => (
                  <WithCallback callback={callback}>{App}</WithCallback>
                );
                // SSRApp = hoistNonReactStatics(SSRApp, App);
                ModernHydrate(<SSRApp />);
              }, loadableReadyOptions);
            } else {
              loadableReady(() => {
                ModernHydrate(App, callback);
              }, loadableReadyOptions);
            }
          } else {
            // unknown renderlevel or renderlevel is server prefetch.
            console.warn(
              `unknow render level: ${renderLevel}, execute render()`,
            );
            ModernRender(App);
          }
        }

        function streamSSRHydrate() {
          if (renderLevel === RenderLevel.SERVER_RENDER) {
            // callback: https://github.com/reactwg/react-18/discussions/5
            const SSRApp: React.FC = () => (
              <WithCallback callback={callback}>{App}</WithCallback>
            );
            // SSRApp = hoistNonReactStatics(SSRApp, App);
            ModernHydrate(<SSRApp />);
          } else {
            ModernRender(App);
          }
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
