import type { BuilderConfig } from '@modern-js/builder-webpack-provider';

export type BuilderOutputConfig = Required<BuilderConfig>['output'];

export interface OutputUserConfig extends BuilderOutputConfig {
  ssg?: SSGConfig;
  disableNodePolyfill?: boolean;
}

export type OutputNormalizedConfig = OutputUserConfig;

export type SSGRouteOptions =
  | string
  | {
      url: string;
      output?: string;
      params?: Record<string, any>[];
      headers?: Record<string, any>;
    };

export type SSGSingleEntryOptions =
  | boolean
  | {
      preventDefault?: string[];
      headers?: Record<string, any>;
      routes?: SSGRouteOptions[];
    };

export type SSGMultiEntryOptions = Record<string, SSGSingleEntryOptions>;

export type SSGConfig =
  | boolean
  | SSGSingleEntryOptions
  | SSGMultiEntryOptions
  | ((
      entryName: string,
      payload: { baseUrl?: string },
    ) => SSGSingleEntryOptions);
