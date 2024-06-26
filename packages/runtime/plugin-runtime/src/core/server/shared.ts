import { ServerUserConfig } from '@modern-js/app-tools';
import { Query } from '@modern-js/runtime-utils/universal';
import { HandleRequestOptions } from './requestHandler';

export type RenderOptions = HandleRequestOptions;

export type SSRConfig = NonNullable<ServerUserConfig['ssr']>;

export type RenderStreaming = (
  request: Request,
  serverRoot: React.ComponentType<any>,
  optinos: RenderOptions,
) => Promise<ReadableStream>;

export type RenderString = (
  request: Request,
  serverRoot: React.ComponentType<any>,
  optinos: RenderOptions,
) => Promise<string>;

export type BuildHtmlCb = (template: string) => string | Promise<string>;

export function buildHtml(template: string, callbacks: BuildHtmlCb[]) {
  return callbacks.reduce(
    (promise, buildHtmlCb) => promise.then(template => buildHtmlCb(template)),
    Promise.resolve(template),
  );
}

export enum RenderLevel {
  CLIENT_RENDER,
  SERVER_PREFETCH,
  SERVER_RENDER,
}

export type SSRData = {
  data: Record<string, any>;
  context: {
    request: {
      params: Record<string, any>;
      query: Query;
      pathname: string;
      host: string;
      url: string;
      headers?: Record<string, string>;
    };
    reporter?: {
      sessionId?: string;
    };
  };
  renderLevel: RenderLevel;
};
