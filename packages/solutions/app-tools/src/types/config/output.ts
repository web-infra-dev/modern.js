import type { SharedOutputConfig as BuilderSharedOutputConfig } from '@modern-js/builder-shared';
import type { SSGConfig } from '@modern-js/types';
import {
  WebpackBuilderConfig,
  RspackBuilderConfig,
} from '../../builder/shared';
import { UnwrapBuilderConfig } from '../utils';

export type BuilderOutputConfig = UnwrapBuilderConfig<
  WebpackBuilderConfig,
  'output'
>;
export type RsBuilderOutputConfig = UnwrapBuilderConfig<
  RspackBuilderConfig,
  'output'
>;

export interface SharedOutputConfig extends BuilderSharedOutputConfig {
  ssg?: SSGConfig;
  splitRouteChunks?: boolean;
  disableNodePolyfill?: boolean;
  enableInlineRouteManifests?: boolean;
  tempDir?: string;
}

export interface OutputUserConfig
  extends BuilderOutputConfig,
    SharedOutputConfig {}

export interface RsOutputUserConfig
  extends RsBuilderOutputConfig,
    SharedOutputConfig {}

export type {
  SSGRouteOptions,
  SSGSingleEntryOptions,
  SSGMultiEntryOptions,
  SSGConfig,
} from '@modern-js/types';
