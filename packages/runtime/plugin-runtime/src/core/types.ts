import type { OnError, OnTiming } from '@modern-js/app-tools';
import type { BaseSSRServerContext } from '@modern-js/types';
import type { RenderLevel } from './constants';

declare global {
  interface Window {
    _SSR_DATA?: SSRContainer;
    _ROUTER_DATA?: RouterSSRData;
  }
}

export interface SSRData {
  initialData?: Record<string, unknown>;
  i18nData?: Record<string, unknown>;
  [props: string]: any;
}

export interface RouteData {
  [routeId: string]: any;
}
export interface RouterSSRData {
  loaderData: RouteData;
  errors: RouteData | null;
  /** String SSR: deferred loader data the browser still has to load, by route id. */
  deferredPending?: Record<string, string[]>;
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
  | 'baseUrl'
  | 'response'
  | 'nonce'
  | 'mode'
  | 'loaderContext'
  | 'reporter'
  | 'routeManifest'
> & {
  request: BaseSSRServerContext['request'] & {
    raw: Request;
  };
  htmlModifiers: BuildHtmlCb[];
  loaderFailureMode?: 'clientRender' | 'errorBoundary';
  deferredDataTimeout?: number;
  onError: OnError;
  onTiming: OnTiming;
  useJsonScript?: boolean;
};

export type RequestContext = {
  request: BaseSSRServerContext['request'];
  response: BaseSSRServerContext['response'];
};
