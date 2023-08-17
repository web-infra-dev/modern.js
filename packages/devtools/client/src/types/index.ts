import type {
  AppContext,
  CustomTabView,
  FileSystemRoutes,
} from '@modern-js/devtools-kit';
import { FrameworkConfig } from '@modern-js/devtools-kit';
import { Promisable } from 'type-fest';

export interface StoreContextValue {
  dataSource: string;
  framework: {
    config: Promise<FrameworkConfig>;
    context: Promise<AppContext>;
    fileSystemRoutes: Record<string, Promisable<FileSystemRoutes>>;
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
  icon?: string;
}
