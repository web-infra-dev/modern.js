import type {
  AppContext,
  BuilderContext,
  CustomTabView,
  FileSystemRoutes,
  TransformedFrameworkConfig,
} from '@modern-js/devtools-kit';
import { FrameworkConfig } from '@modern-js/devtools-kit';
import { ReactElement } from 'react';
import { JsonArray, JsonValue, Promisable } from 'type-fest';

export interface StoreContextValue {
  dataSource: string;
  framework: {
    context: Promise<AppContext>;
    fileSystemRoutes: Record<string, Promisable<FileSystemRoutes>>;
    config: {
      resolved: Promise<FrameworkConfig>;
      transformed: Promise<TransformedFrameworkConfig>;
    };
  };
  builder: {
    context: Promise<BuilderContext>;
    config: {
      resolved: Promise<JsonValue>;
      transformed: Promise<JsonValue>;
    };
  };
  bundler: {
    config: {
      resolved: Promise<JsonArray>;
      transformed: Promise<JsonArray>;
    };
  };
  tabs: InternalTab[];
}

export interface BuiltinTabView {
  type: 'builtin';
  url: string;
}

export type InternalTabView = CustomTabView | BuiltinTabView;

export interface InternalTab {
  name: string;
  title: string;
  view: InternalTabView;
  icon?: ReactElement;
}
