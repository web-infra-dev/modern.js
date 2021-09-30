// import { IncomingHttpHeaders } from 'http';
import { RuntimeContext } from '@modern-js/runtime-core';

export enum RenderLevel {
  CLIENT_RENDER,
  SERVER_PREFETCH,
  SERVER_RENDER,
}

export type { SSRServerContext } from '@modern-js/server';

export type ModernSSRReactComponent = React.ComponentType<any> & {
  init: (context: RuntimeContext) => Promise<void>;
  prefetch: (context: RuntimeContext) => Promise<Record<string, any>>;
};

export interface RenderEntry {
  entryName: string;
  result: RenderResult;
  loadableManifest: string | undefined;
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
