import { disposeAfterError } from '../application/cleanup';
import { parsedJSONFromElement } from '@modern-js/runtime-utils/parsed';
import { ROUTER_DATA_JSON_ID, SSR_DATA_JSON_ID } from '../constants';
import type React from 'react';
import { createRoot } from 'react-dom/client';
import { ROUTE_MANIFEST } from '@modern-js/utils/universal/constants';
import { createApplicationInstance } from '../application/instance';
import { getApplicationDefinition } from '../application/definition';
import { getDefaultApplicationDefinition } from '../application/default';

import { wrapRuntimeContextProvider } from '../react/wrapper';
import { cloneBootstrapData, createBrowserRequestContext } from './data';
import { hydrateRoot, hydrateWithReact } from './hydrate';

declare const WEBPACK_CHUNK_LOAD:
  undefined | ((chunkId: string | number) => Promise<unknown>);

export { hydrateWithReact };

function isClientArgs(id: unknown): id is HTMLElement | string {
  return (
    typeof id === 'undefined' ||
    typeof id === 'string' ||
    (typeof HTMLElement !== 'undefined' && id instanceof HTMLElement)
  );
}

export type RenderFunc = typeof render;

export async function render(
  App: React.ReactElement,
  id?: HTMLElement | string,
) {
  if (isClientArgs(id)) {
    // Await shell data only. Remote streams and deferred boundaries may continue.
    if (window._SSR_DATA_READY) {
      await window._SSR_DATA_READY;
      window._SSR_DATA =
        window._SSR_DATA || parsedJSONFromElement(SSR_DATA_JSON_ID);
      window._ROUTER_DATA =
        window._ROUTER_DATA || parsedJSONFromElement(ROUTER_DATA_JSON_ID);
    }

    window._SSR_DATA ||= parsedJSONFromElement(SSR_DATA_JSON_ID);
    window._ROUTER_DATA ||= parsedJSONFromElement(ROUTER_DATA_JSON_ID);
    // TODO: This field may suitable to be called `requestData`, because both SSR and CSR can get the context
    const ssrData = window._SSR_DATA;

    const registeredDefinition = getApplicationDefinition(
      App.type as React.ComponentType,
    );
    const definition = registeredDefinition || {
      ...getDefaultApplicationDefinition(),
      App: App.type as React.ComponentType,
    };
    const instance = createApplicationInstance(
      {
        ...definition,
        serverLoaders: Boolean(window._SSR_DATA),
        loadRouteChunk:
          typeof WEBPACK_CHUNK_LOAD === 'undefined'
            ? undefined
            : WEBPACK_CHUNK_LOAD,
      },
      {
        isBrowser: true,
        output: 'document',
        root: registeredDefinition
          ? undefined
          : (App.type as React.ComponentType),
        initialUrl: location.href,
        context: {
          routeManifest: (window as any)[ROUTE_MANIFEST],
          assetBase: (window as any).__webpack_public_path__ || '/',
          // garfish plugin params
          _internalRouterBaseName: (App.props as { basename?: string })
            .basename,
          ssrContext: createBrowserRequestContext(
            new URL(location.href),
            ssrData?.context,
            ssrData?.mode,
          ),
          ssr: Boolean(window._SSR_DATA),
          initialData: cloneBootstrapData(ssrData?.data?.initialData),
          __i18nData__:
            typeof ssrData?.data?.i18nData?.lng === 'string'
              ? { lng: ssrData?.data.i18nData.lng }
              : undefined,
        },
      },
    );
    const { context } = instance;
    context.application!.hydrationData = window._ROUTER_DATA;
    const prepared = await instance.prepare();
    if (prepared.interrupted) {
      disposeAfterError(prepared.value, instance.dispose);
    }
    const rootElement =
      id && typeof id !== 'string'
        ? id
        : document.getElementById(id || 'root')!;

    async function ModernRender(App: React.ReactElement) {
      return renderWithReact(App, rootElement);
    }

    // we should hydrateRoot only when SSR or SSG is enabled
    try {
      if (process.env.MODERN_ENABLE_HYDRATION && window._SSR_DATA) {
        async function ModernHydrate(App: React.ReactElement) {
          return hydrateWithReact(App, rootElement);
        }

        const root = await hydrateRoot(
          App,
          context,
          ModernRender,
          ModernHydrate,
        );
        return ownRoot(root, instance.dispose);
      }
      return ownRoot(
        await ModernRender(wrapRuntimeContextProvider(App, context)),
        instance.dispose,
      );
    } catch (error) {
      delete context._hydration;
      disposeAfterError(error, instance.dispose);
    }
  }
  throw Error(
    '`render` function needs id in browser environment, it needs to be string or element',
  );
}

export async function renderWithReact(
  App: React.ReactElement,
  rootElement: HTMLElement,
) {
  const root = createRoot(rootElement);
  root.render(App);
  return root;
}

function ownRoot<T extends { unmount(): void }>(
  root: T,
  dispose: () => void,
): T {
  let release: (() => void) | undefined = dispose;
  const unmount = root.unmount.bind(root);
  root.unmount = () => {
    try {
      unmount();
    } finally {
      const cleanup = release;
      release = undefined;
      cleanup?.();
    }
  };
  return root;
}
