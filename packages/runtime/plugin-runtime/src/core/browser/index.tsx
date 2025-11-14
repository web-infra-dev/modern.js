import cookieTool from 'cookie';
import type React from 'react';
import { getGlobalInternalRuntimeContext } from '../context';
import { type TRuntimeContext, getInitialContext } from '../context/runtime';
import { wrapRuntimeContextProvider } from '../react/wrapper';
import type { SSRContainer } from '../types';
import { hydrateRoot } from './hydrate';

const IS_REACT18 = process.env.IS_REACT18 === 'true';

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
    });

    await runBeforeRender(context);
    const rootElement =
      id && typeof id !== 'string'
        ? id
        : document.getElementById(id || 'root')!;

    async function ModernRender(App: React.ReactElement) {
      const renderFunc = IS_REACT18 ? renderWithReact18 : renderWithReact17;
      return renderFunc(App, rootElement);
    }

    async function ModernHydrate(
      App: React.ReactElement,
      callback?: () => void,
    ) {
      const hydrateFunc = IS_REACT18 ? hydrateWithReact18 : hydrateWithReact17;
      return hydrateFunc(App, rootElement, callback);
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

export async function renderWithReact18(
  App: React.ReactElement,
  rootElement: HTMLElement,
) {
  const ReactDOM = await import('react-dom/client');
  const root = ReactDOM.createRoot(rootElement);
  root.render(App);
  return root;
}

export async function renderWithReact17(
  App: React.ReactElement,
  rootElement: HTMLElement,
) {
  const ReactDOM: any = await import('react-dom');
  ReactDOM.render(App, rootElement);
  return rootElement;
}

export async function hydrateWithReact18(
  App: React.ReactElement,
  rootElement: HTMLElement,
) {
  const ReactDOM = await import('react-dom/client');
  const root = ReactDOM.hydrateRoot(rootElement, App);
  return root;
}

export async function hydrateWithReact17(
  App: React.ReactElement,
  rootElement: HTMLElement,
  callback?: () => void,
) {
  const ReactDOM: any = await import('react-dom');
  const root = ReactDOM.hydrate(App, rootElement, callback);
  return root as any;
}
