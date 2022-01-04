import { BaseSSRServerContext } from '@modern-js/types/server';

type MetaKeyMap = {
  header?: string[];
  query?: string[];
};
type MetaKeyMatch = {
  header?: MatchMap;
  query?: MatchMap;
};
type MatchMap = Record<string, Record<string, string>>;

export type CacheConfig = {
  interval: number;
  staleLimit: number | boolean;
  level: number;
  includes?: MetaKeyMap | null;
  excludes?: MetaKeyMap | null;
  matches?: MetaKeyMatch | null;
};

export enum RenderLevel {
  CLIENT_RENDER,
  SERVER_PREFETCH,
  SERVER_RENDER,
}

export type SSRServerContext = BaseSSRServerContext & {
  cacheConfig?: CacheConfig;
  staticGenerate?: boolean;
};

export type ModernSSRReactComponent = React.ComponentType<any> & {
  init: (context: SSRServerContext) => Promise<void>;
  prefetch: (context: SSRServerContext) => Promise<Record<string, any>>;
};

export type RenderFunction = (context: SSRServerContext) => Promise<string>;
