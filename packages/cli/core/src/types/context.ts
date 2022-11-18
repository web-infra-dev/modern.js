import {
  Entrypoint,
  InternalPlugins,
  ServerRoute,
  HtmlTemplates,
} from '@modern-js/types';

export interface IAppContext {
  metaName: string; // name for generating conventional constants, such as .modern-js
  appDirectory: string;
  configFile: string | false;
  serverConfigFile: string;
  serverInternalPlugins: InternalPlugins;
  ip?: string;
  port?: number;
  distDirectory: string;
  packageName: string;
  srcDirectory: string;
  sharedDirectory: string;
  nodeModulesDirectory: string;
  internalDirectory: string;
  plugins: any[];
  entrypoints: Entrypoint[];
  checkedEntries: string[];
  serverRoutes: ServerRoute[];
  htmlTemplates: HtmlTemplates;
  apiOnly: boolean;
  internalDirAlias: string;
  internalSrcAlias: string;
  // FIXME real builder type
  builder?: Record<string, any>;
}
