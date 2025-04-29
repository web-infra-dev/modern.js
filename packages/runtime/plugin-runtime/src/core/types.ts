import type { OnError, OnTiming } from '@modern-js/app-tools';
import type { BaseSSRServerContext } from '@modern-js/types';
import type { RenderLevel } from './constants';
import type { LoaderResult } from './loader/loaderManager';

declare global {
  interface Window {
    _SSR_DATA?: SSRContainer;
    _ROUTER_DATA?: RouterSSRData;
  }
}

export interface SSRData {
  loadersData?: Record<string, LoaderResult | undefined>;
  initialData?: Record<string, unknown>;
  storeState?: any;
  [props: string]: any;
}
export interface RouteData {
  [routeId: string]: any;
}
export interface RouterSSRData {
  loaderData: RouteData;
  errors: RouteData | null;
}

export type SSRMode = 'string' | 'stream';

export interface SSRContainer {
  renderLevel: RenderLevel;
  mode: SSRMode;
  data?: SSRData; // string ssr data
  context?: {
    request: BaseSSRServerContext['request'];
    reporter?: {
      sessionId?: string;
    };
  };
}

type BuildHtmlCb = (tempalte: string) => string;

/* 在服务端获取的 SSRContext */
export type SSRServerContext = Pick<
  BaseSSRServerContext,
  | 'redirection'
  | 'response'
  | 'nonce'
  | 'mode'
  | 'loaderContext'
  | 'reporter'
  | 'logger'
  | 'metrics'
  | 'routeManifest'
> & {
  request: BaseSSRServerContext['request'] & {
    baseUrl: string;
    raw: Request;
  };
  htmlModifiers: BuildHtmlCb[];
  loaderFailureMode?: 'clientRender' | 'errorBoundary';
  onError: OnError;
  onTiming: OnTiming;
  useJsonScript?: boolean;
};

/* 通过 useRuntimeContext 获取的 SSRContext */
interface TSSRBaseContext {
  request: BaseSSRServerContext['request'];
  [propName: string]: any;
}

export interface ServerContext extends TSSRBaseContext {
  isBrowser: false;
  response: BaseSSRServerContext['response'];
  logger: BaseSSRServerContext['logger'];
}

export interface ClientContext extends TSSRBaseContext {
  isBrowser: true;
}

// TODO: rename it, maybe requestContext or renderContext
export declare type TSSRContext = ServerContext | ClientContext;
