import type { ServerRoute as ModernRoute } from '@modern-js/types';

import {
  SSGConfig,
  SSGRouteOptions,
  SSGMultiEntryOptions,
  SSGSingleEntryOptions,
} from '@modern-js/app-tools';

export type {
  SSGConfig,
  SSGRouteOptions,
  SSGMultiEntryOptions,
  SSGSingleEntryOptions,
};

export type AgreedRoute = {
  path?: string;
  component?: string;
  _component?: string;
  children?: AgreedRoute[];
  exact?: boolean; // compatible with react-routerv5
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
