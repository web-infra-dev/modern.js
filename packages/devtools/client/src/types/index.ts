import type {
  AppContext,
  AssetDefinition,
  BuilderConfig,
  BuilderContext,
  BundlerConfig,
  CustomTabView,
  FileSystemRoutes,
  NameDefinition,
  NormalizedBuilderConfig,
  PackageDefinition,
  TransformedFrameworkConfig,
} from '@modern-js/devtools-kit';
import { FrameworkConfig } from '@modern-js/devtools-kit';
import { ReactElement } from 'react';
import { Promisable } from 'type-fest';

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
      resolved: Promise<BuilderConfig>;
      transformed: Promise<NormalizedBuilderConfig>;
    };
  };
  bundler: {
    config: {
      resolved: Promise<BundlerConfig[]>;
      transformed: Promise<BundlerConfig[]>;
    };
  };
  tabs: InternalTab[];
  version: string;
  dependencies: Promise<Record<string, string>>;
  compileTimeCost: Promise<number>;
  name: Promise<NameDefinition>;
  packages: Promise<PackageDefinition>;
  assets: Promise<AssetDefinition>;
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
