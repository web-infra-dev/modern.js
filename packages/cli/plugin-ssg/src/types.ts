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

export type FreshPageConfig = {
  url?: string;
  output?: string;
  params?: Record<string, string | number>;
  headers?: Record<string, string>;
};
export type UserInterfaceRoute = ModernRoute & {
  path: string;
  agreed?: boolean;
};

export type CreatePageParam = FreshPageConfig | FreshPageConfig[];
export type CreatePageListener = (route: SsgRoute, agreed?: boolean) => void;

export type SsgRoute = ModernRoute & {
  output?: string;
  headers?: Record<string, string>;
};
export type HookContext = {
  createPage: (config?: CreatePageParam) => any;
  route: UserInterfaceRoute;
};

export type SSGConfig = boolean | ((context: any) => void);
export type ExtendOutputConfig = {
  ssg: SSGConfig;
};
