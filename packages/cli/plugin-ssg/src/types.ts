import type { ServerRoute as ModernRoute } from '@modern-js/types';
import type {
  SSGConfig,
  SSGRouteOptions,
  SSGMultiEntryOptions,
  SSGSingleEntryOptions,
} from '@modern-js/core';

export type {
  SSGConfig,
  SSGRouteOptions,
  SSGMultiEntryOptions,
  SSGSingleEntryOptions,
};

export type AgreedRoute = {
  path: string;
  component: string;
  _component: string;
  exact: boolean;
};

export type EntryPoint = {
  entryName: string;
  entry: string;
};

export type AgreedRouteMap = {
  [propNames: string]: AgreedRoute[];
};

export type SsgRoute = ModernRoute & {
  output: string;
  headers?: Record<string, string>;
};

export type ExtendOutputConfig = {
  ssg: SSGConfig;
};
