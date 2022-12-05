import { ServerUserConfig } from '@modern-js/app-tools';
import type { RuntimeContext } from '../../core';
import { RenderLevel } from './renderToString/type';

export type { SSRServerContext } from './renderToString/type';
export type ModernSSRReactComponent = React.ComponentType<any>;
export { RuntimeContext, RenderLevel };

export type SSRPluginConfig = {
  crossorigin?: boolean | 'anonymous' | 'use-credentials';
} & Exclude<ServerUserConfig['ssr'], boolean>;

export type ServerRenderOptions = {
  App: ModernSSRReactComponent;
  config: SSRPluginConfig;
  context: RuntimeContext;
};
