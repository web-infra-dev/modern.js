import { ServerRoute } from '@modern-js/types';

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
  | ((entryName: string, route?: ServerRoute) => SSGSingleEntryOptions);
