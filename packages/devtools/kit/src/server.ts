import type { AppTools, IAppContext, UserConfig } from '@modern-js/app-tools';
import type { NormalizedConfig } from '@modern-js/core';
import type {
  NestedRouteForCli,
  PageRoute,
  RouteLegacy,
} from '@modern-js/types';
import type {
  NormalizedConfig as NormalizedBuilderConfig,
  RsbuildConfig,
  RsbuildContext,
  Rspack,
  RspackConfig,
  WebpackConfig,
  webpack,
} from '@modern-js/uni-builder';
import type { Manifest } from '@rsdoctor/types';
import type { ClientDefinition } from './client';
import type { ExportedServerState } from './state';
import type {
  StoragePresetConfig,
  StoragePresetContext,
  StoragePresetWithIdent,
} from './storage-preset';

export type BuilderContext = RsbuildContext;

export type FrameworkConfig = UserConfig<AppTools>;

export type TransformedFrameworkConfig = NormalizedConfig<AppTools>;

export type BuilderConfig = RsbuildConfig;

export type { NormalizedBuilderConfig, WebpackConfig, RspackConfig };

export type Aliases = NonNullable<
  NonNullable<WebpackConfig['resolve']>['alias']
>;

export type BundlerConfig = WebpackConfig | RspackConfig;

export interface DevtoolsContext {
  enable: boolean;
  def: ClientDefinition;
  storagePresets: StoragePresetContext[];
}

export type Compiler =
  | webpack.Compiler
  | Rspack.Compiler
  | webpack.MultiCompiler
  | Rspack.MultiCompiler;

export type AppContext = Omit<IAppContext, 'builder'>;

export type FileSystemRoutes =
  | RouteLegacy[]
  | (NestedRouteForCli | PageRoute)[];

export interface DoctorManifestOverview {
  numModules: number;
  numChunks: number;
  numPackages: number;
  summary: Manifest.RsdoctorManifest['data']['summary'];
  errors: Manifest.RsdoctorManifest['data']['errors'];
}

export interface DevtoolsConfig {
  storagePresets?: StoragePresetConfig[];
}

export interface ResolvedDevtoolsConfig {
  storagePresets: StoragePresetContext[];
}

export interface ServerFunctions {
  echo: (content: string) => string;
  pullExportedState: () => Promise<ExportedServerState>;
  createTemporaryStoragePreset: () => Promise<StoragePresetWithIdent>;
  pasteStoragePreset: (target: {
    filename: string;
    id: string;
  }) => Promise<void>;
  open: (filename: string) => Promise<void>;
}
