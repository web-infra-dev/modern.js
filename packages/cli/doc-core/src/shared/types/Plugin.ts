import { BuilderConfig } from '@modern-js/builder-rspack-provider';
import type { PluggableList } from 'unified';
import { DocConfig, PageIndexInfo } from '.';

/**
 * There are two ways to define what addtion routes represent.
 * 1. Define filepath, then the content will be read from the file.
 * 2. Define content, then then content will be written to temp file and read from it.
 */
export interface AdditionRoute {
  routePath: string;
  content?: string;
  filepath?: string;
}

export interface DocPlugin {
  /**
   * Name of the plugin.
   */
  name: string;
  /**
   * Global style
   */
  globalStyles?: string;
  /**
   * Markdown options.
   */
  markdown?: {
    remarkPlugins?: PluggableList;
    rehypePlugins?: PluggableList;
  };
  /**
   * Builder config.
   */
  builderConfig?: BuilderConfig;
  /**
   * To ensure hmr works properly, we need to watch some files.
   */
  watchFiles?: string[];
  /**
   * Inject global components.
   */
  globalUIComponents?: string[];
  /**
   * Modify doc config.
   */
  config?: (config: DocConfig) => DocConfig | Promise<DocConfig>;
  /**
   * Callback before build
   */
  beforeBuild?: (config: DocConfig, isProd: boolean) => Promise<void>;
  /**
   * Callback after build
   */
  afterBuild?: (config: DocConfig, isProd: boolean) => Promise<void>;
  /**
   * Extend every page's data
   */
  extendPageData?: (pageData: PageIndexInfo) => void;
  /**
   * Add custom route
   */
  addRoutes?: (config: DocConfig) => AdditionRoute[];
}
