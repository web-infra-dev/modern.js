import { ServerUserConfig } from '@modern-js/app-tools';
import type { BaseSSRServerContext } from '@modern-js/types';
import type { RuntimeContext } from '../../core';
import type { BuildHtmlCb } from './renderToString/buildHtml';
import type { SSRTracker } from './tracker';

export enum RenderLevel {
  CLIENT_RENDER,
  SERVER_PREFETCH,
  SERVER_RENDER,
}

export type RenderResult = {
  renderLevel: RenderLevel;
  html?: string;
  chunksMap: {
    js: string;
    css: string;
  };
};

export type SSRServerContext = BaseSSRServerContext & {
  request: BaseSSRServerContext['request'] & {
    userAgent: string;
    cookie: string;
    cookieMap: Record<string, string>;
  };
  htmlModifiers: BuildHtmlCb[];
  tracker: SSRTracker;
};
export type ModernSSRReactComponent = React.ComponentType<any>;
export { RuntimeContext };

export type SSRPluginConfig = {
  crossorigin?: boolean | 'anonymous' | 'use-credentials';
  scriptLoading?: 'defer' | 'blocking' | 'module';
  enableInlineStyles?: boolean | RegExp;
  enableInlineScripts?: boolean | RegExp;
  disablePrerender?: boolean;
  chunkLoadingGlobal?: string;
  unsafeContext?: { headers?: string[] };
} & Exclude<ServerUserConfig['ssr'], boolean>;

export type ServerRenderOptions = {
  App: ModernSSRReactComponent;
  config: SSRPluginConfig;
  context: RuntimeContext;
};
