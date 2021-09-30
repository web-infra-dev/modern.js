import { IncomingHttpHeaders } from 'http';
import { RenderResult } from '../../../type';

export type { CacheConfig } from '../type';

export type CacheContent = {
  level: number;
  includes: {
    header?: string[];
    query?: string[];
  } | null;
  matches?: {
    header?: Record<string, Record<string, string>>;
    query?: Record<string, Record<string, string>>;
  } | null;
  interval: number;
  limit: number | boolean;
  caches: PageCachesInterface;
};
export interface PageCachesInterface {
  caches: any;

  init: () => void;

  get: (key: string) => Promise<PageCache | null>;

  peek: (key: string) => PageCache | null;

  set: (key: string, cache: PageCache) => Promise<void>;

  del: (key: string) => void;

  keys: () => string[];
}

export type PageCache = {
  html: string;
  expireTime: number;
  limitTime: number | null;
  cacheHash: string;
  size: number;
};

export type CacheManagerOptions = {
  max: number;
};

export interface CacheResult extends RenderResult {
  isStale: boolean;
  isGarbage: boolean;
  hash: string;
}

export type CacheContext = {
  entry: string;
  pathname: string;
  query: Record<string, string>;
  headers: IncomingHttpHeaders;
};
