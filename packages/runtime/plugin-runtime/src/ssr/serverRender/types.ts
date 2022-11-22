import type { ServerConfig } from '@modern-js/core';
import type { RuntimeContext } from '../../core';
import { RenderLevel } from './renderToString/type';

export type { SSRServerContext } from './renderToString/type';
export type ModernSSRReactComponent = React.ComponentType<any> & {
  init?: (context: RuntimeContext) => Promise<void>;
};
export { RuntimeContext, RenderLevel };

export type SSRPluginConfig = {
  crossorigin?: boolean | 'anonymous' | 'use-credentials';
} & Exclude<ServerConfig['ssr'], boolean>;

export type ServerRenderOptions = {
  App: ModernSSRReactComponent;
  config: SSRPluginConfig;
  context: RuntimeContext;
};
