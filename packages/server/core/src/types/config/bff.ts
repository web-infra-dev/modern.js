export interface BffUserConfig {
  prefix?: string;
  proxy?: Record<string, string>;
}

export type BffNormalizedConfig = BffUserConfig;
