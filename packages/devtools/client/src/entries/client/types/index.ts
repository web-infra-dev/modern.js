import type {
  AssetDefinition,
  CustomTabView,
  NameDefinition,
  PackageDefinition,
} from '@modern-js/devtools-kit';
import { ReactElement, ReactNode } from 'react';

export interface BreadcrumbItem {
  title: ReactNode;
  to: string;
}

export interface StoreContextValue {
  version: string;
  dependencies: Promise<Record<string, string>>;
  compileTimeCost: Promise<number>;
  name: Promise<NameDefinition>;
  packages: Promise<PackageDefinition>;
  assets: Promise<AssetDefinition>;
  breadcrumb: BreadcrumbItem[];
  announcement: Promise<{
    src: string;
    fallback: string;
  }>;
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
