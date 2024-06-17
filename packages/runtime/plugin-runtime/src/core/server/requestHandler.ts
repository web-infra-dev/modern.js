import { ServerUserConfig } from '@modern-js/app-tools';
import { createRoot } from '../react';
import { RuntimeContext } from '../context';

export type Resource = {
  loadableStats: Record<string, any>;
  routeManifest: Record<string, any>;
  htmlTemplate: string;
  entryName: string;
};

export type HandleRequestConfig = {
  nonce?: string;
  crossorigin?: boolean | 'anonymous' | 'use-credentials';
  scriptLoading?: 'defer' | 'blocking' | 'module' | 'async';
  enableInlineStyles?: boolean | RegExp;
  enableInlineScripts?: boolean | RegExp;
  disablePrerender?: boolean;
  chunkLoadingGlobal?: string;
  unsafeHeaders?: string[];
} & Exclude<ServerUserConfig['ssr'], boolean>;

export interface HandleRequestOptions {
  resource: Resource;
  config: HandleRequestConfig;
  runtimeContext: RuntimeContext;
  loaderContext: LoaderContext;
  onError: (err: unknown) => void;
  onTiming: (name: string, dur: number) => void;
}

export type HandleRequest = (
  request: Request,
  serverRoot: React.ComponentType, // App, routes,
  options: HandleRequestOptions,
) => Promise<Response>;

type LoaderContext = Record<string, any>;

export type RequestHandlerOptions = HandleRequestOptions;

export type RequestHandler = (
  request: Request,
  options: RequestHandlerOptions,
) => Promise<Response>;

export type CreateRequestHandler = (
  handleRequest: HandleRequest,
) => Promise<RequestHandler>;

export const createRequestHandler: CreateRequestHandler =
  async handleRequest => {
    const requestHandler: RequestHandler = (request, options) => {
      const serverRoot = createRoot();

      const response = handleRequest(request, serverRoot, options);

      return response;
    };

    return requestHandler;
  };
