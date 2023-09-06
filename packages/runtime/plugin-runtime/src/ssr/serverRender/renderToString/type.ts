import type { BaseSSRServerContext } from '@modern-js/types';
import type { BuildHtmlCb } from './buildHtml';

export enum RenderLevel {
  CLIENT_RENDER,
  SERVER_PREFETCH,
  SERVER_RENDER,
}

export type SSRServerContext = BaseSSRServerContext & {
  request: BaseSSRServerContext['request'] & {
    userAgent: string;
    cookie: string;
    cookieMap: Record<string, string>;
  };
  htmlModifiers: BuildHtmlCb[];
};

export type RenderResult = {
  renderLevel: RenderLevel;
  html?: string;
  chunksMap: {
    js: string;
    css: string;
  };
};
