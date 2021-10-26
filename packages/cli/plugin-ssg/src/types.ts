import { ModernRoute } from '@modern-js/server';

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

export type RouteOptions =
  | string
  | {
      url: string;
      output?: string;
      params?: Record<string, any>[];
      headers?: Record<string, any>;
    };

export type SingleEntryOptions =
  | boolean
  | {
      preventDefault?: string[];
      headers?: Record<string, any>;
      routes: RouteOptions[];
    };

export type MultiEntryOptions = Record<string, SingleEntryOptions>;

export type SSG =
  | boolean
  | SingleEntryOptions
  | MultiEntryOptions
  | ((entryName: string) => SingleEntryOptions);

export type ExtendOutputConfig = {
  ssg: SSG;
};
