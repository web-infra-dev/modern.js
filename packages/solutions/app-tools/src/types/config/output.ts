import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { BuilderConfig as RsBuilderConfig } from '@modern-js/builder-rspack-provider';
import type { SharedOutputConfig as BuilderSharedOutputConfig } from '@modern-js/builder-shared';
import { UnwrapBuilderConfig } from '../utils';

export type BuilderOutputConfig = UnwrapBuilderConfig<BuilderConfig, 'output'>;
export type RsBuilderOutputConfig = UnwrapBuilderConfig<
  RsBuilderConfig,
  'output'
>;

export interface SharedOutputConfig extends BuilderSharedOutputConfig {
  ssg?: SSGConfig;
  disableNodePolyfill?: boolean;
}

export interface OutputUserConfig
  extends BuilderOutputConfig,
    SharedOutputConfig {}

export interface RsOutputUserConfig
  extends RsBuilderOutputConfig,
    SharedOutputConfig {}

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
