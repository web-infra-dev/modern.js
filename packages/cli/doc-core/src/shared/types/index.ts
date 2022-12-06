import type { ComponentType } from 'react';
import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { PluginConfig } from '@modern-js/core';
import type { PluggableList } from 'unified';
import { DefaultTheme } from './default-theme';
import { DocPlugin } from './Plugin';

export { DefaultTheme } from './default-theme';

export { DocPlugin };

export interface Header {
  id: string;
  text: string;
  depth: number;
}
export interface SiteSiteData {
  title: string;
  description: string;
  frontmatter: Record<string, unknown>;
  lastUpdated?: number;
  headers: Header[];
}

export type HeadConfig =
  | [string, Record<string, string>]
  | [string, Record<string, string>, string];

export interface DocConfig<ThemeConfig = DefaultTheme.Config> {
  /**
   * Base path of the site.
   */
  base?: string;
  /**
   * Path to html icon file.
   */
  icon?: string;
  /**
   * Title of the site.
   */
  title?: string;
  /**
   * Description of the site.
   */
  description?: string;
  /**
   * Custom head config.
   */
  head?: HeadConfig[];
  /**
   * Theme config.
   */
  themeConfig?: ThemeConfig;
  /**
   * Builder Configuration
   */
  builderConfig?: BuilderConfig;
  /**
   * The custom config of vite-plugin-route
   */
  route?: RouteOptions;
  /**
   * The custom config of markdown compile
   */
  markdown?: MarkdownOptions;
  /**
   * Doc plugins
   */
  plugins?: DocPlugin[];
}

export interface SiteData<ThemeConfig = unknown> {
  root: string;
  base: string;
  lang: string;
  title: string;
  description: string;
  icon: string;
  head: HeadConfig[];
  themeConfig: ThemeConfig;
  appearance: boolean;
}

export interface Hero {
  name: string;
  text: string;
  tagline: string;
  image?: {
    src: string;
    alt: string;
  };
  actions: {
    text: string;
    link: string;
    theme: 'brand' | 'alt';
  }[];
}

export interface Feature {
  icon: string;
  title: string;
  details: string;
}

export interface PageModule<T extends ComponentType<unknown>> {
  default: T;
  frontmatter?: FrontMatterMeta;
  content?: string;
  [key: string]: unknown;
}

export type PageType = 'home' | 'doc' | 'api' | 'custom' | '404';

export interface FrontMatterMeta {
  title: string;
  description: string;
  api: boolean;
  pageType: PageType;
  features?: Feature[];
  hero?: Hero;
  sidebar?: boolean;
  outline?: boolean;
  lineNumbers?: boolean;
}

export interface PageData {
  siteData: SiteData<DefaultTheme.Config>;
  pagePath: string;
  relativePagePath: string;
  lastUpdatedTime?: string;
  title?: string;
  frontmatter?: FrontMatterMeta;
  description?: string;
  pageType: PageType;
  toc?: Header[];
  routePath: string;
  content?: string;
  subModules?: PageModule<ComponentType<unknown>>[];
}

export interface RouteOptions {
  /**
   * The directory to search for pages
   */
  root?: string;
  /**
   * The basename of the site
   */
  prefix?: string;
  /**
   * The extension name of the filepath that will be converted to a route
   * @default ['js','jsx','ts','tsx','md','mdx']
   */
  extensions?: string[];
  /**
   * Include extra files from being converted to routes
   */
  include?: string[];
  /**
   * Exclude files from being converted to routes
   */
  exclude?: string[];
}

export interface MarkdownOptions {
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
}

export interface UserConfig {
  doc: DocConfig;
  // Modern.js Plugins
  plugins?: PluginConfig;
}

export type Config =
  | UserConfig
  | Promise<UserConfig>
  | ((env: any) => UserConfig | Promise<UserConfig>);

export function defineConfig(config: Config): Config {
  return config;
}
