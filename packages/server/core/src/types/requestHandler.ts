import type { Logger, Metrics, Reporter, ServerRoute } from '@modern-js/types';
import type {
  Monitors,
  ClientManifest as RscClientManifest,
  SSRManifest as RscSSRManifest,
  ServerManifest as RscServerManifest,
} from '@modern-js/types/server';
import type { ServerUserConfig, SourceUserConfig } from './config';

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
  inlineStyles?: boolean | RegExp;
  inlineScripts?: boolean | RegExp;
  ssr?: ServerUserConfig['ssr'];
  ssrByEntries?: ServerUserConfig['ssrByEntries'];
  useJsonScript?: ServerUserConfig['useJsonScript'];
  enableAsyncEntry?: SourceUserConfig['enableAsyncEntry'];
};

export type LoaderContext = Map<string, any>;

export type OnError = (err: unknown, key?: string) => void;

export type OnTiming = (name: string, dur: number) => void;

export type RequestHandlerOptions = {
  resource: Resource;

  config: RequestHandlerConfig;

  params: Params;

  loaderContext: LoaderContext;

  html?: string;

  rscServerManifest?: RscServerManifest;
  rscClientManifest?: RscClientManifest;
  rscSSRManifest?: RscSSRManifest;
  RSCRoot?: any;
  rscRoot?: any;

  serverPayload?: any;

  /** @deprecated  */
  locals?: Record<string, any>;

  /** @deprecated  */
  staticGenerate?: boolean;

  /** @deprecated ssr runtime code need reporter instance */
  reporter?: Reporter;

  monitors: Monitors;

  onError: OnError;
  onTiming: OnTiming;

  bindings?: any;
};

export type RequestHandler = (
  request: Request,
  options: RequestHandlerOptions,
) => Promise<Response>;
