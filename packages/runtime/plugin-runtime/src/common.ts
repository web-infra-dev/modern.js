import type { Plugin, RuntimePluginFuture } from './core/plugin';
import type { RouterConfig } from './router/internal';

export const isBrowser = () =>
  typeof window !== 'undefined' && window.name !== 'nodejs';

export interface AppConfig {
  router?: Pick<RouterConfig, 'future' | 'basename'>;
  [key: string]: any;
}

export interface RuntimeConfig {
  plugins?: (Plugin | RuntimePluginFuture)[];
  [key: string]: any;
}

export const JSX_SHELL_STREAM_END_MARK = '<!--<?- SHELL_STREAM_END ?>-->';
export const ESCAPED_SHELL_STREAM_END_MARK =
  '&lt;!--&lt;?- SHELL_STREAM_END ?&gt;--&gt;';
