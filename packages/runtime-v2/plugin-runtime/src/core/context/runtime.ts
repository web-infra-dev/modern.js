import { createContext } from 'react';
import { StaticHandlerContext } from '@modern-js/runtime-utils/remix-router';
import { PluginRunner, runtime } from '../plugin';

interface RouteManifest {
  routeAssets: RouteAssets;
}

interface RouteAssets {
  [routeId: string]: {
    chunkIds?: (string | number)[];
    assets?: string[];
  };
}

export interface BaseRuntimeContext {
  routeManifest?: RouteManifest;

  initialData?: Record<string, unknown>;

  routerContext?: StaticHandlerContext;

  runner?: ReturnType<typeof runtime.init>;
}

export interface RuntimeContext extends BaseRuntimeContext {
  [key: string]: any;
}

export const RuntimeReactContext = createContext<RuntimeContext>({});

export const getInitialContext = (runner?: PluginRunner): RuntimeContext => ({
  runner,
  isBrowser: true,
});
