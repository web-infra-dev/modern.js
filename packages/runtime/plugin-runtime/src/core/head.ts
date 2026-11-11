import type { HelmetServerState } from 'react-helmet-async/lib/types';

// Template replacement consumes serialization, never a library's toComponent().
export type HeadData = Record<
  | 'base'
  | 'bodyAttributes'
  | 'htmlAttributes'
  | 'link'
  | 'meta'
  | 'noscript'
  | 'script'
  | 'style'
  | 'title',
  { toString(): string }
>;

/** Owned by a single render, never serialized into the hydration payload. */
export interface HeadContext {
  helmet?: HelmetServerState;
}
