import type { RuntimePlugin } from './core/plugin';
import type { RouterConfig } from './router/runtime/types';

export const isBrowser = () =>
  typeof window !== 'undefined' && window.name !== 'nodejs';

export interface RuntimeConfig {
  plugins?: RuntimePlugin[];
  router?: Partial<RouterConfig>;
  [key: string]: any;
}

export const JSX_SHELL_STREAM_END_MARK = '<!--<?- SHELL_STREAM_END ?>-->';
export const ESCAPED_SHELL_STREAM_END_MARK =
  '&lt;!--&lt;?- SHELL_STREAM_END ?&gt;--&gt;';
