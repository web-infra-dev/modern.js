import type { BaseSSRServerContext } from '@modern-js/types';

export enum RenderLevel {
  CLIENT_RENDER,
  SERVER_PREFETCH,
  SERVER_RENDER,
}

export type SSRServerContext = BaseSSRServerContext & {
  request: BaseSSRServerContext['request'] & {
    userAgent: string;
    cookie: string;
  };
};

export interface RenderEntry {
  entryName: string;
  host: string;
  result: RenderResult;
  loadableManifest: string | undefined;
  config: SSRPluginConfig;
}

export type RenderHandler = (
  jsx: React.ReactElement,
  renderer: RenderEntry,
  next: (jsx: React.ReactElement) => string,
) => string;

export type RenderResult = {
  renderLevel: RenderLevel;
  html?: string;
  chunksMap: {
    js: string;
    css: string;
  };
};

export type SSRPluginConfig = {
  crossorigin?: boolean | 'anonymous' | 'use-credentials';
};
