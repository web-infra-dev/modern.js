import { ServerRoute } from '@modern-js/types';
import { ServerUserConfig } from './config';

export type Resource = {
  loadableStats: Record<string, any>;
  routeManifest: Record<string, any>;
  route: ServerRoute;
  htmlTemplate: string;
  entryName: string;
};

export type Params = Record<string, any>;

export type RequestHandlerConfig = {
  nonce?: string;
  crossorigin?: boolean | 'anonymous' | 'use-credentials';
  scriptLoading?: 'defer' | 'blocking' | 'module' | 'async';
  enableInlineStyles?: boolean | RegExp;
  enableInlineScripts?: boolean | RegExp;
  disablePrerender?: boolean;
  chunkLoadingGlobal?: string;
  ssr?: ServerUserConfig['ssr'];
  ssrByEntries?: ServerUserConfig['ssrByEntries'];
};

export type LoaderContext = Map<string, any>;

export type OnError = (err: unknown) => void;

export type OnTiming = (name: string, dur: number) => void;

export type RequestHandlerOptions = {
  resource: Resource;

  config: RequestHandlerConfig;

  params: Params;

  loaderContext: LoaderContext;

  /** @deprecated  */
  staticGenerate?: boolean;

  onError?: OnError;
  onTiming?: OnTiming;
};

export type RequestHandler = (
  request: Request,
  options: RequestHandlerOptions,
) => Promise<Response>;
