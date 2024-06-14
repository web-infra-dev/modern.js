/* eslint-disable no-inner-declarations */
import React from 'react';
import { getGlobalApp } from '../context';
import { RuntimeContext, getInitialContext } from '../context/runtime';
import { createLoaderManager } from '../loader/loaderManager';
import { getGlobalRunner } from '../plugin/runner';

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
          const App = getGlobalApp();
          return (App as any)?.init?.(context1);
        },
      },
    ) as any;

  const isBrowser = typeof window !== 'undefined' && window.name !== 'nodejs';

  if (isBrowser) {
    if (isClientArgs(id)) {
      const ssrData = (window as any)._SSR_DATA;
      const loadersData = ssrData?.data?.loadersData || {};

      const initialLoadersState = Object.keys(loadersData).reduce(
        (res: any, key) => {
          const loaderData = loadersData[key];

          if (loaderData.loading !== false) {
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
        const hydrateFunc = IS_REACT18
          ? hydrateWithReact18
          : hydrateWithReact17;
        return hydrateFunc(App, rootElement, callback);
      }
      return runner.client(
        {
          App,
          context,
          ModernRender,
          ModernHydrate,
        },
        {
          onLast: ({ App }) => {
            return ModernRender(App);
          },
        },
      );
    } else {
      throw Error(
        '`render` function needs id in browser environment, it needs to be string or element',
      );
    }
  } else {
    throw Error('ssr need use server func');
  }
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
  ReactDOM.hydrateRoot(rootElement, App);
}

async function hydrateWithReact17(
  App: React.ReactElement,
  rootElement: HTMLElement,
  callback?: () => void,
) {
  const ReactDOM = await import('react-dom');
  ReactDOM.hydrate(App, rootElement, callback);
}
