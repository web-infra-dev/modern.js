import type {
  AppContext,
  BuilderConfig,
  BuilderContext,
  BundlerConfig,
  DevtoolsContext,
  DoctorManifestOverview,
  FileSystemRoutes,
  FrameworkConfig,
  NormalizedBuilderConfig,
  TransformedFrameworkConfig,
} from './server';

export interface ServerState {
  framework: {
    context?: AppContext;
    config: {
      resolved?: FrameworkConfig;
      transformed?: TransformedFrameworkConfig;
    };
  };
  builder: {
    context?: BuilderContext;
    config: {
      resolved?: BuilderConfig;
      transformed?: NormalizedBuilderConfig;
    };
  };
  bundler: {
    configs: {
      resolved?: BundlerConfig[];
      transformed?: BundlerConfig[];
    };
  };
  doctor?: DoctorManifestOverview;
  context: DevtoolsContext;
  performance?: { compileDuration: number };
  dependencies: Record<string, string>;
  fileSystemRoutes: Record<string, FileSystemRoutes>;
}

export interface ExportedServerState extends ServerState {
  framework: {
    context: AppContext;
    config: {
      resolved: FrameworkConfig;
      transformed: TransformedFrameworkConfig;
    };
  };
  builder: {
    context: BuilderContext;
    config: {
      resolved: BuilderConfig;
      transformed: NormalizedBuilderConfig;
    };
  };
  bundler: {
    configs: {
      resolved: BundlerConfig[];
      transformed: BundlerConfig[];
    };
  };
  doctor?: DoctorManifestOverview;
  context: DevtoolsContext;
  performance: { compileDuration: number };
  dependencies: Record<string, string>;
  fileSystemRoutes: Record<string, FileSystemRoutes>;
}

export interface RouteAsset {
  chunkIds: string[];
  assets: string[];
  referenceCssAssets: [];
}

export interface ServerManifest extends ExportedServerState {
  websocket?: string;
  client: string;
  routeAssets: Record<string, RouteAsset>;
}
