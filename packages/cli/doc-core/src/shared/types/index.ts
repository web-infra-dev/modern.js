import type { ComponentType } from 'react';
import type { BuilderConfig } from '@modern-js/builder-webpack-provider';
import type { PluginConfig } from '@modern-js/core';
import type { PluggableList } from 'unified';
import {
  Config as DefaultThemeConfig,
  NormalizedConfig as NormalizedDefaultThemeConfig,
} from './default-theme';
import { DocPlugin } from './Plugin';

export { DefaultThemeConfig, NormalizedDefaultThemeConfig };
export * from './default-theme';

export { DocPlugin };

export interface ReplaceRule {
  search: string | RegExp;
  replace: string;
}

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

export interface DocConfig<ThemeConfig = DefaultThemeConfig> {
  /**
   * The root directory of the site.
   */
  root?: string;
  /**
   * Path to the logo file in nav bar.
   */
  logo?: string;
  /**
   * Base path of the site.
   */
  base?: string;
  /**
   * Path to html icon file.
   */
  icon?: string;
  /**
   * Language of the site.
   */
  lang?: string;
  /**
   * Title of the site.
   */
  title?: string;
  /**
   * Description of the site.
   */
  description?: string;
  /**
   * Head tags.
   */
  head?: string[];
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
  /**
   * Replace rule
   */
  replaceRules?: ReplaceRule[];
  /**
   * Output directory
   */
  outDir?: string;
  /**
   * Custom theme directory
   */
  themeDir?: string;
}

export interface SiteData<ThemeConfig = NormalizedDefaultThemeConfig> {
  root: string;
  base: string;
  lang: string;
  title: string;
  description: string;
  icon: string;
  themeConfig: ThemeConfig;
  logo: string;
  pages: {
    routePath: string;
    toc: Header[];
  }[];
}

export interface PageBasicInfo {
  routePath: string;
  title: string;
  toc: Header[];
  frontmatter: Record<string, string | number | undefined>;
  content: string;
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

export type PageType = 'home' | 'doc' | 'custom' | '404';

export interface FrontMatterMeta {
  title: string;
  description: string;
  overview: boolean;
  pageType: PageType;
  features?: Feature[];
  hero?: Hero;
  sidebar?: boolean;
  outline?: boolean;
  lineNumbers?: boolean;
}

export interface PageData {
  siteData: SiteData<DefaultThemeConfig>;
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
  checkDeadLinks?: boolean;
}

export interface UserConfig {
  doc?: DocConfig;
  // Modern.js Plugins
  plugins?: PluginConfig;
}

export type Config =
  | UserConfig
  | Promise<UserConfig>
  | ((env: any) => UserConfig | Promise<UserConfig>);
