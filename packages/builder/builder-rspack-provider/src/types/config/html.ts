import type { ChainedConfig } from '@modern-js/builder-shared';
import type { MetaOptions } from '@modern-js/utils';
// import type { HTMLPluginOptions } from '../thirdParty';

export type CrossOrigin = 'anonymous' | 'use-credentials';

export type Inject = 'head' | 'body';

export interface HtmlConfig {
  meta?: MetaOptions;
  metaByEntries?: Record<string, MetaOptions>;
  title?: string;
  titleByEntries?: Record<string, string>;
  inject?: Inject;
  injectByEntries?: Record<string, Inject>;
  favicon?: string;
  faviconByEntries?: Record<string, string | undefined>;
  appIcon?: string;
  mountId?: string;
  crossorigin?: boolean | CrossOrigin;
  disableHtmlFolder?: boolean;
  template?: string;
  templateByEntries?: Partial<Record<string, string>>;
  templateParameters?:
    | Record<string, unknown>
    | ChainedConfig<Record<string, unknown>>;
  templateParametersByEntries?: Record<
    string,
    Record<string, unknown> | ChainedConfig<Record<string, unknown>>
    // | HTMLPluginOptions['templateParameters']
  >;
}

export type NormalizedHtmlConfig = HtmlConfig;
