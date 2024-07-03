import type { StateConfig } from './state';
import type { Plugin } from './core/plugin';

export const isBrowser = () =>
  typeof window !== 'undefined' && window.name !== 'nodejs';

export interface AppConfig {
  state?: StateConfig | boolean;
  [key: string]: any;
}

export interface RuntimeConfig {
  state: StateConfig;
  stateByEntries: { [name: string]: StateConfig };
  [key: string]: any;
  plugins: Plugin[];
}

export const JSX_SHELL_STREAM_END_MARK = '<!--<?- SHELL_STREAM_END ?>-->';
export const ESCAPED_SHELL_STREAM_END_MARK =
  '&lt;!--&lt;?- SHELL_STREAM_END ?&gt;--&gt;';
