import type { MetaOptions } from '../../generateMetaTags';
import type { ArrayOrNot, ChainedConfig } from '../utils';

export type CrossOrigin = 'anonymous' | 'use-credentials';

export type ScriptInject = boolean | 'body' | 'head';

export type ScriptLoading = 'defer' | 'module' | 'blocking';

export interface HtmlInjectTag {
  tag: string;
  attrs?: Record<string, string | boolean | null | undefined>;
  children?: string;
  hash?: boolean | string | ((url: string, hash: string) => string);
  publicPath?: boolean | string | ((url: string, publicPath: string) => string);
  append?: boolean;
  head?: boolean;
}

export type HtmlInjectTagUtils = {
  outputName: string;
  publicPath: string;
  hash: string;
};

export type HtmlInjectTagHandler = (
  tags: HtmlInjectTag[],
  utils: HtmlInjectTagUtils,
) => HtmlInjectTag[] | void;

export type HtmlInjectTagDescriptor = HtmlInjectTag | HtmlInjectTagHandler;

export interface SharedHtmlConfig {
  /**
   * Configure the `<meta>` tag of the HTML.
   */
  meta?: MetaOptions;
  /**
   * Set different meta tags for different pages.
   * The usage is same as `meta`, and you can use the "entry name" as the key to set each page individually.
   * `metaByEntries` will overrides the value set in `meta`.
   */
  metaByEntries?: Record<string, MetaOptions>;
  /**
   * Set the title tag of the HTML page.
   */
  title?: string;
  /**
   * Set different title for different pages.
   * The usage is same as `title`, and you can use the "entry name" as the key to set each page individually.
   * `titleByEntries` will overrides the value set in `title`.
   */
  titleByEntries?: Record<string, string>;
  /**
   * Set the inject position of the `<script>` tag.
   */
  inject?: ScriptInject;
  /**
   * Set different script tag inject positions for different pages.
   * The usage is same as `inject`, and you can use the "entry name" as the key to set each page individually.
   * `injectByEntries` will overrides the value set in `inject`.
   */
  injectByEntries?: Record<string, ScriptInject>;
  /**
   * Inject custom html tags into the output html files.
   */
  tags?: ArrayOrNot<HtmlInjectTagDescriptor>;
  /**
   * Inject custom html tags into the output html files.
   * The usage is same as `inject`, and you can use the "entry name" as the key to set each page individually.
   * `tagsByEntries` will overrides the value set in `tags`.
   */
  tagsByEntries?: Record<string, ArrayOrNot<HtmlInjectTagDescriptor>>;
  /**
   * Set the favicon icon for all pages.
   */
  favicon?: string;
  /**
   * Set different favicon for different pages.
   * The usage is same as `favicon`, and you can use the "entry name" as the key to set each page individually.
   * `faviconByEntries` will overrides the value set in `favicon`.
   */
  faviconByEntries?: Record<string, string | undefined>;
  /**
   * Set the file path of the app icon, which can be a relative path or an absolute path.
   */
  appIcon?: string;
  /**
   * Set the id of root element.
   */
  mountId?: string;
  /**
   * Set the [crossorigin](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin) attribute
   * of the `<script>` tag.
   */
  crossorigin?: boolean | CrossOrigin;
  /**
   * Remove the folder of the HTML files.
   * When this option is enabled, the generated HTML file path will change from `[name]/index.html` to `[name].html`.
   */
  disableHtmlFolder?: boolean;
  /**
   * Define the path to the HTML template,
   * corresponding to the `template` config of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).
   */
  template?: string;
  /**
   * Set different template file for different pages.
   * The usage is same as `template`, and you can use the "entry name" as the key to set each page individually.
   * `templateByEntries` will overrides the value set in `template`.
   */
  templateByEntries?: Partial<Record<string, string>>;
  /**
   * Define the parameters in the HTML template,
   * corresponding to the `templateParameters` config of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).
   */
  templateParameters?: ChainedConfig<Record<string, unknown>>;
  /**
   * Set different template parameters for different pages.
   * The usage is same as `templateParameters`, and you can use the "entry name" as the key to set each page individually.
   * `templateParametersByEntries` will overrides the value set in `templateParameters`.
   */
  templateParametersByEntries?: Record<
    string,
    ChainedConfig<Record<string, unknown>>
  >;
  /**
   * Set the loading mode of the `<script>` tag.
   */
  scriptLoading?: ScriptLoading;
}

export type NormalizedSharedHtmlConfig = SharedHtmlConfig & {
  mountId: string;
  inject: ScriptInject;
  crossorigin: boolean | CrossOrigin;
  disableHtmlFolder: boolean;
  scriptLoading: ScriptLoading;
};
