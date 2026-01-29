import type { RuntimePlugin } from './core/plugin';

export const isBrowser = () =>
  typeof window !== 'undefined' &&
  window.name !== 'nodejs' &&
  typeof document !== 'undefined';

export interface RuntimeConfig {
  plugins?: RuntimePlugin[];
  [key: string]: any;
}

export const JSX_SHELL_STREAM_END_MARK = '<!--<?- SHELL_STREAM_END ?>-->';
export const ESCAPED_SHELL_STREAM_END_MARK =
  '&lt;!--&lt;?- SHELL_STREAM_END ?&gt;--&gt;';
