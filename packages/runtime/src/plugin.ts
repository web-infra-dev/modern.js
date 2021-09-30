import type React from 'react';
import {
  createManager,
  createPipeline,
  createAsyncPipeline,
  createContext,
  PluginFromManager,
} from '@modern-js/plugin';
import type { RuntimeContext, TRuntimeContext } from './runtime-context';
import { createLoaderManager } from './loader/loaderManager';

const hoc = createPipeline<
  {
    App: React.ComponentType<any>;
  },
  React.ComponentType<any>
>();

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AppProps {}

const provide = createPipeline<
  { element: JSX.Element; props: AppProps; context: RuntimeContext },
  JSX.Element
>();

export const AppComponentContext =
  createContext<React.ComponentType<any> | null>(null);

export const useAppComponent = () => {
  const AppComponent = AppComponentContext.use().value;

  if (!AppComponent) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Expect React.ComponentType, accept: ${AppComponent}`);
  }

  return AppComponent;
};

export const useRootElement = () => {
  const rootElement = AppComponentContext.use().value;

  if (!rootElement) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Expect HTMLElement, accept: ${rootElement}`);
  }

  return rootElement;
};

const client = createAsyncPipeline<
  {
    App: React.ComponentType<any>;
    context?: RuntimeContext;
    rootElement: HTMLElement;
  },
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  void
>();

const server = createAsyncPipeline<
  {
    App: React.ComponentType<any>;
    context?: RuntimeContext;
  },
  string
>();

const init = createPipeline<
  {
    context: RuntimeContext;
  },
  unknown
>();

const pickContext = createPipeline<
  { context: RuntimeContext; pickedContext: TRuntimeContext },
  TRuntimeContext
>();

export const createRuntime = () =>
  createManager({
    hoc,
    provide,
    client,
    server,
    init,
    pickContext,
  });

/**
 * register init hook. It would be revoked both ssr and csr.
 */
const registerInit = (
  App: React.ComponentType,
  _init: (context: RuntimeContext) => any | Promise<any>,
) => {
  const originalInit = (App as any).init;
  (App as any).init = async (context: RuntimeContext) => {
    if (!context.loaderManager) {
      context.loaderManager = createLoaderManager({});
    }

    await Promise.all([originalInit?.(context), _init?.(context)]);
  };
};

/**
 * register prefetch hook. It would be revoked both ssr and csr.
 * But if ssr success, It wont exec in csr again.
 * If ssr prefetch failed, It will fallback to exec in csr.
 */
const registerPrefetch = (
  App: React.ComponentType,
  prefetch: (context: RuntimeContext) => Promise<any>,
) => {
  const originalPrefetch = (App as any).prefetch;
  (App as any).prefetch = async (context: RuntimeContext) => {
    const originResult = await originalPrefetch?.(context);
    const result = await prefetch?.(context);

    return {
      ...originResult,
      ...result,
    };
  };
};

export const runtime = createRuntime();

export type Plugin = PluginFromManager<typeof runtime>;

export const { createPlugin } = runtime;

export { registerInit, registerPrefetch };
