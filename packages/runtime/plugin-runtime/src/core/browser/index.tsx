/* eslint-disable no-inner-declarations */
import React from 'react';
import { getGlobalAppInit } from '../context';
import { RuntimeContext, getInitialContext } from '../context/runtime';
import { createLoaderManager } from '../loader/loaderManager';
import { getGlobalRunner } from '../plugin/runner';
import { hydrateRoot } from './hydrate';

const IS_REACT18 = process.env.IS_REACT18 === 'true';

function isClientArgs(id: unknown): id is HTMLElement | string {
  return (
    typeof id === 'undefined' ||
    typeof id === 'string' ||
    (typeof HTMLElement !== 'undefined' && id instanceof HTMLElement)
  );
}

export async function render(
  App: React.ReactElement,
  id?: HTMLElement | string,
) {
  const runner = getGlobalRunner();
  const context: RuntimeContext = getInitialContext(runner);
  const runInit = (_context: RuntimeContext) =>
    runner.init(
      { context: _context },
      {
        onLast: ({ context: context1 }) => {
          const init = getGlobalAppInit();
          return init?.(context1);
        },
      },
    ) as any;

  if (isClientArgs(id)) {
    const ssrData = window._SSR_DATA;
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
      ...(ssrData ? { ssrContext: ssrData?.context } : {}),
    });

    context.initialData = ssrData?.data?.initialData;
    const initialData = await runInit(context);
    if (initialData) {
      context.initialData = initialData;
    }
    const rootElement =
      id && typeof id !== 'string'
        ? id
        : document.getElementById(id || 'root')!;

    async function ModernRender(App: React.ReactElement) {
      const renderFunc = IS_REACT18 ? renderWithReact18 : renderWithReact17;
      return renderFunc(React.cloneElement(App, { context }), rootElement);
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
    return ModernRender(App);
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
