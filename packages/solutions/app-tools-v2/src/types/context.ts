import {
  Entrypoint,
  InternalPlugins,
  ServerRoute,
  HtmlTemplates,
  HtmlPartials,
} from '@modern-js/types';
import type {
  UniBuilderInstance,
  UniBuilderWebpackInstance,
} from '@modern-js/uni-builder';

export type ToolsType = 'app-tools' | 'module-tools' | 'monorepo-tools';

export interface IAppContext {
  /** name for generating conventional constants, such as .modern-js */
  metaName: string;
  /** Root directory of the current project */
  appDirectory: string;
  /** Source code directory */
  srcDirectory: string;
  /** Directory for output files */
  distDirectory: string;
  /** Directory for API modules */
  apiDirectory: string;
  /** Directory for lambda modules */
  lambdaDirectory: string;
  /** Directory for shared modules */
  sharedDirectory: string;
  /** Directory for framework temp files */
  internalDirectory: string;
  /** node_modules directory */
  nodeModulesDirectory: string;
  /** Path to the configuration file */
  configFile: string | false;
  /** Path to the server configuration file */
  serverConfigFile: string;
  /** Path to the runtime configuration file */
  runtimeConfigFile: string;
  /** Currently registered server plugins */
  serverInternalPlugins: InternalPlugins;
  /** IPv4 address of the current machine */
  ip?: string;
  /** Port number of the development server */
  port?: number;
  /** Name of the current project's package.json */
  packageName: string;
  /** Currently registered plugins */
  plugins: any[];
  /** Information for entry points */
  entrypoints: Entrypoint[];
  /** Selected entry points */
  checkedEntries: string[];
  /** Information for server routes */
  serverRoutes: ServerRoute[];
  /** Whether to use api only mode */
  apiOnly: boolean;
  /** The Builder instance */
  builder?: UniBuilderInstance | UniBuilderWebpackInstance;
  /** Tools type of the current project */
  toolsType?: ToolsType;
  /** Type of the bundler being used */
  bundlerType?: 'webpack' | 'rspack' | 'esbuild';
  /**
   * The alias path for internal usage
   * @private
   */
  internalDirAlias: string;
  /**
   * The alias path for internal usage
   * @private
   */
  internalSrcAlias: string;
  /**
   * Information for HTML templates
   * @private
   */
  htmlTemplates: HtmlTemplates;
  /**
   * Information for HTML templates by entry
   * @private
   */
  partialsByEntrypoint?: Record<string, HtmlPartials>;
}
