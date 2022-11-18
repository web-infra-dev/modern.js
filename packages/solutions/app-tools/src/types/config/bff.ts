export interface BffUserConfig {
  prefix?: string;
  requestCreator?: string;
  proxy?: Record<string, string>;
  fetcher?: string;
}

export type BffNormalizedConfig = BffUserConfig;
