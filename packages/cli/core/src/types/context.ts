import {
  Entrypoint,
  InternalPlugins,
  ServerRoute,
  HtmlTemplates,
} from '@modern-js/types';
import { BuilderInstance } from '@modern-js/builder-shared';

export interface IAppContext {
  /** The name of framework, such as 'modern-js' */
  metaName: string;
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
  builder?: BuilderInstance;
  /**  The version of the framework  */
  version?: string;
}
