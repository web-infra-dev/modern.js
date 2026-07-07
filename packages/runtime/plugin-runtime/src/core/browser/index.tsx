import { SSR_HYDRATION_ID_PREFIX } from '@modern-js/utils/universal/constants';
import cookieTool from 'cookie';
import type React from 'react';
// aliased because this file already has Modern's own `hydrateRoot` from './hydrate'
import { createRoot, hydrateRoot as hydrateReactRoot } from 'react-dom/client';
import { getGlobalInternalRuntimeContext } from '../context';
import { type TRuntimeContext, getInitialContext } from '../context/runtime';
import { wrapRuntimeContextProvider } from '../react/wrapper';
import type { SSRContainer } from '../types';
import { hydrateRoot } from './hydrate';

const getQuery = () =>
  window.location.search
    .substring(1)
    .split('&')
    .reduce<Record<string, string>>((res, item) => {
      const [key, value] = item.split('=');

      if (key) {
        res[key] = value;
      }
      return res;
    }, {});

function getSSRData(): SSRContainer {
  const ssrData = window._SSR_DATA;

  const ssrRequest = ssrData?.context?.request;

  const finalSSRData: SSRContainer = {
    ...(ssrData || {
      renderLevel: 0,
      mode: 'string',
    }),
    context: {
      ...(ssrData?.context || {}),
      request: {
        ...(ssrData?.context?.request || {}),
        params: ssrRequest?.params || {},
        host: ssrRequest?.host || location.host,
        pathname: ssrRequest?.pathname || location.pathname,
        headers: ssrRequest?.headers || {},
        cookieMap: cookieTool.parse(document.cookie || '') || {},
        cookie: document.cookie || '',
        userAgent: ssrRequest?.headers?.['user-agent'] || navigator.userAgent,
        referer: document.referrer,
        query: {
          ...getQuery(),
          ...(ssrRequest?.query || {}),
        },
        url: location.href,
      },
    },
  };

  return finalSSRData;
}

function isClientArgs(id: unknown): id is HTMLElement | string {
  return (
    typeof id === 'undefined' ||
    typeof id === 'string' ||
    (typeof HTMLElement !== 'undefined' && id instanceof HTMLElement)
  );
}

export type RenderFunc = typeof render;

export async function render(
  App: React.ReactElement<{ basename: string }>,
  id?: HTMLElement | string,
) {
  const context: TRuntimeContext = getInitialContext();
  const runBeforeRender = async (context: TRuntimeContext) => {
    const internalRuntimeContext = getGlobalInternalRuntimeContext();
    const api = internalRuntimeContext!.pluginAPI;
    api!.updateRuntimeContext(context);
    const hooks = internalRuntimeContext!.hooks;
    await hooks.onBeforeRender.call(context);
  };

  if (isClientArgs(id)) {
    // TODO: This field may suitable to be called `requestData`, because both SSR and CSR can get the context
    const ssrData = getSSRData();

    Object.assign(context, {
      // garfish plugin params
      _internalRouterBaseName: App.props.basename,
      ssrContext: ssrData.context,
      initialData: ssrData.data?.initialData,
    });

    await runBeforeRender(context);
    const rootElement =
      id && typeof id !== 'string'
        ? id
        : document.getElementById(id || 'root')!;

    async function ModernRender(App: React.ReactElement) {
      return renderWithReact(App, rootElement);
    }

    async function ModernHydrate(App: React.ReactElement) {
      return hydrateWithReact(App, rootElement);
    }

    // we should hydateRoot only when ssr
    if (window._SSR_DATA) {
      return hydrateRoot(App, context, ModernRender, ModernHydrate);
    }
    return ModernRender(wrapRuntimeContextProvider(App, context));
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

export async function hydrateWithReact(
  App: React.ReactElement,
  rootElement: HTMLElement,
) {
  const root = hydrateReactRoot(rootElement, App, {
    identifierPrefix: SSR_HYDRATION_ID_PREFIX,
  });
  return root;
}
