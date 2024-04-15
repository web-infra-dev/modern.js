import { ClientDefinition } from './client';
import {
  AppContext,
  BuilderConfig,
  BuilderContext,
  BundlerConfig,
  DevtoolsConfig,
  DoctorManifestOverview,
  FileSystemRoutes,
  FrameworkConfig,
  NormalizedBuilderConfig,
  TransformedFrameworkConfig,
} from './server';

export class ServerExportedState {
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

  definition?: ClientDefinition;

  doctor?: DoctorManifestOverview;

  devtoolsConfig?: DevtoolsConfig;

  compileDuration?: number;

  dependencies: Record<string, string>;

  fileSystemRoutes: Record<string, FileSystemRoutes>;

  constructor() {
    this.framework = { config: {} };
    this.builder = { config: {} };
    this.bundler = { configs: {} };
    this.dependencies = {};
    this.fileSystemRoutes = {};
  }
}
