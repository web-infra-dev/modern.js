/* eslint-disable no-inner-declarations */
import React from 'react';
import cookieTool from 'cookie';
import { parsedJSONFromElement } from '@modern-js/runtime-utils/parsed';
import { getGlobalAppInit } from '../context';
import { RuntimeContext, getInitialContext } from '../context/runtime';
import { createLoaderManager } from '../loader/loaderManager';
import { getGlobalRunner } from '../plugin/runner';
import { SSRContainer } from '../types';
import { wrapRuntimeContextProvider } from '../react/wrapper';
import { ROUTER_DATA_JSON_ID, SSR_DATA_JSON_ID } from '../constants';
import { hydrateRoot } from './hydrate';

const IS_REACT18 = process.env.IS_REACT18 === 'true';

type ExtraSSRContainer = {
  context?: {
    request: {
      cookieMap?: Record<string, string>;
      cookie?: string;
      userAgent?: string;
      referer?: string;
    };
  };
};

// eslint-disable-next-line consistent-return
function getSSRData(): (SSRContainer & ExtraSSRContainer) | undefined {
  const ssrData = window._SSR_DATA;

  if (ssrData) {
    const finalSSRData = {
      ...ssrData,
      context: {
        ...ssrData.context!,
        request: {
          ...ssrData.context!.request,
          cookieMap: cookieTool.parse(document.cookie || '') || {},
          cookie: document.cookie || '',
          userAgent: navigator.userAgent,
          referer: document.referrer,
        },
      },
    };

    return finalSSRData;
  }
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
  App: React.ReactElement,
  id?: HTMLElement | string,
) {
  const runner = getGlobalRunner();
  const context: RuntimeContext = getInitialContext(runner);
  const runBeforeRender = async (context: RuntimeContext) => {
    await runner.beforeRender(context);
    const init = getGlobalAppInit();
    return init?.(context);
  };

  if (isClientArgs(id)) {
    // we should get data from HTMLElement when set ssr.inlineScript = false

    window._SSR_DATA =
      window._SSR_DATA || parsedJSONFromElement(SSR_DATA_JSON_ID);

    const routeData = parsedJSONFromElement(ROUTER_DATA_JSON_ID);
    window._ROUTER_DATA = window._ROUTER_DATA || routeData;

    const ssrData = getSSRData();
    const loadersData = ssrData?.data?.loadersData || {};

    const initialLoadersState = Object.keys(loadersData).reduce(
      (res: any, key) => {
        const loaderData = loadersData[key];

        if (loaderData?.loading !== false) {
          return res;
        }

        res[key] = loaderData;
        return res;
      },
      {},
    );

    Object.assign(context, {
      loaderManager: createLoaderManager(initialLoadersState, {
        skipStatic: true,
      }),
      // garfish plugin params
      _internalRouterBaseName: App.props.basename,
      ...(ssrData ? { ssrContext: ssrData?.context } : {}),
    });

    context.initialData = ssrData?.data?.initialData;
    const initialData = await runBeforeRender(context);
    if (initialData) {
      context.initialData = initialData;
    }
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
    if (ssrData) {
      return hydrateRoot(App, context, ModernRender, ModernHydrate);
    }
    return ModernRender(wrapRuntimeContextProvider(App, context));
  }
  throw Error(
    '`render` function needs id in browser environment, it needs to be string or element',
  );
}

async function renderWithReact18(
  App: React.ReactElement,
  rootElement: HTMLElement,
) {
  const ReactDOM = await import('react-dom/client');
  const root = ReactDOM.createRoot(rootElement);
  root.render(App);
  return root;
}

async function renderWithReact17(
  App: React.ReactElement,
  rootElement: HTMLElement,
) {
  const ReactDOM = await import('react-dom');
  ReactDOM.render(App, rootElement);
  return rootElement;
}

async function hydrateWithReact18(
  App: React.ReactElement,
  rootElement: HTMLElement,
) {
  const ReactDOM = await import('react-dom/client');
  const root = ReactDOM.hydrateRoot(rootElement, App);
  return root;
}

async function hydrateWithReact17(
  App: React.ReactElement,
  rootElement: HTMLElement,
  callback?: () => void,
) {
  const ReactDOM = await import('react-dom');
  const root = ReactDOM.hydrate(App, rootElement, callback);
  return root as any;
}
