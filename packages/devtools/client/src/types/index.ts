import type {
  AppContext,
  BuilderContext,
  CustomTabView,
  FileSystemRoutes,
} from '@modern-js/devtools-kit';
import { FrameworkConfig } from '@modern-js/devtools-kit';
import { ReactElement } from 'react';
import { Promisable } from 'type-fest';

export interface StoreContextValue {
  dataSource: string;
  framework: {
    config: Promise<FrameworkConfig>;
    context: Promise<AppContext>;
    fileSystemRoutes: Record<string, Promisable<FileSystemRoutes>>;
  };
  builder: {
    config: Promise<Record<string, unknown>>;
    context: Promise<BuilderContext>;
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
