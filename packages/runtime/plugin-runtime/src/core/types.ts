import { BaseSSRServerContext } from '@modern-js/types';
import type { LoaderResult } from './loader/loaderManager';
import type { RenderLevel } from './server/shared';

declare global {
  interface Window {
    _SSR_DATA?: SSRContainer;
    _ROUTER_DATA?: RouterSSRData;
  }
}

export interface SSRData {
  loadersData: Record<string, LoaderResult | undefined>;
  initialData?: Record<string, unknown>;
  storeState?: any;
}
export interface RouteData {
  [routeId: string]: any;
}
export interface RouterSSRData {
  loaderData: RouteData;
  errors: RouteData | null;
}

export interface SSRContainer {
  data?: SSRData; // string ssr data
  renderLevel: RenderLevel;
  context?: SSRServerContext;
}

type BuildHtmlCb = (tempalte: string) => string;

export type SSRServerContext = Pick<
  BaseSSRServerContext,
  | 'redirection'
  | 'response'
  | 'nonce'
  | 'mode'
  | 'loaderContext'
  | 'reporter'
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
