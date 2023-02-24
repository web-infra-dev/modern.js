import type { StateConfig } from './state';

export const isBrowser = () =>
  typeof window !== 'undefined' && window.name !== 'nodejs';

export interface AppConfig {
  state?: StateConfig | boolean;
  [key: string]: any;
}

export const JSX_SHELL_STREAM_END_MARK = '<!--<?- SHELL_STREAM_END ?>-->';
export const ESCAPED_SHELL_STREAM_END_MARK =
  '&lt;!--&lt;?- SHELL_STREAM_END ?&gt;--&gt;';
