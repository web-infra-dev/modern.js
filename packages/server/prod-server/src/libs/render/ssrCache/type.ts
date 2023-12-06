import type { IncomingMessage } from 'http';

export type CacheControlRange = 'header' | 'query';
export type CacheControl = {
  maxAge: number;
  staleWhileRevalidate: number;
  controlRanges?: CacheControlRange[];

  /**
    Users can specify CacheID in server hook or custom server middleware.
    Then CacheID would be as a part of cache symbol to cache SSR render result.
  */
  customKey?: string;
};
export type CacheOptionProvider = (req: IncomingMessage) => CacheControl;
export type CacheOption =
  | false
  | CacheOptionProvider
  | CacheControl
  | Record<string, CacheControl | CacheOptionProvider>;
