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
    request: {
      params: Record<string, any>;
      query: Record<string, string>;
      pathname: string;
      host: string;
      url: string;
      headers?: Record<string, string | undefined>;
    };
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
    userAgent: string;
    cookie: string;
    cookieMap: Record<string, string>;
    raw: Request;
  };
  htmlModifiers: BuildHtmlCb[];
  loaderFailureMode?: 'clientRender' | 'errorBoundary';
  onError?: (e: unknown) => void;
  onTiming?: (name: string, dur: number) => void;
};

/* 通过 useRuntimeContext 获取的 SSRContext */
interface TSSRBaseContext {
  request: BaseSSRServerContext['request'] & {
    userAgent: string;
    cookie: string;
  };
  [propName: string]: any;
}

interface ServerContext extends TSSRBaseContext {
  isBrowser: false;
  response: BaseSSRServerContext['response'];
  logger: BaseSSRServerContext['logger'];
}

interface ClientContext extends TSSRBaseContext {
  isBrowser: true;
}

export declare type TSSRContext = ServerContext | ClientContext;
