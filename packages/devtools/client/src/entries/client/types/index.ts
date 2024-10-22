import type {
  AssetDefinition,
  NameDefinition,
  PackageDefinition,
} from '@modern-js/devtools-kit/runtime';
import type { ReactNode } from 'react';

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
