import type {
  AppContext,
  BuilderContext,
  CustomTabView,
  FileSystemRoutes,
  FinalFrameworkConfig,
} from '@modern-js/devtools-kit';
import { FrameworkConfig } from '@modern-js/devtools-kit';
import { ReactElement } from 'react';
import { JsonValue, Promisable } from 'type-fest';

export interface StoreContextValue {
  dataSource: string;
  framework: {
    context: Promise<AppContext>;
    fileSystemRoutes: Record<string, Promisable<FileSystemRoutes>>;
    config: Promise<FrameworkConfig>;
    finalConfig: Promise<FinalFrameworkConfig>;
  };
  builder: {
    context: Promise<BuilderContext>;
    config: Promise<JsonValue>;
    finalConfig: Promise<JsonValue>;
  };
  bundler: {
    configs: Promise<JsonValue[]>;
    finalConfigs: Promise<JsonValue[]>;
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
