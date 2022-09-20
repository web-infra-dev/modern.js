import type { MetaOptions } from '@modern-js/utils';
import type { HTMLPluginOptions } from '../thirdParty';

export type CrossOrigin = 'anonymous' | 'use-credentials';

export interface HtmlConfig {
  meta?: MetaOptions;
  metaByEntries?: Record<string, MetaOptions>;
  title?: string;
  titleByEntries?: Record<string, string>;
  inject?: HTMLPluginOptions['inject'];
  injectByEntries?: Record<string, HTMLPluginOptions['inject']>;
  favicon?: string;
  faviconByEntries?: Record<string, string | undefined>;
  appIcon?: string;
  mountId?: string;
  crossorigin?: boolean | CrossOrigin;
  disableHtmlFolder?: boolean;
  templateParameters?: Record<string, unknown>;
  templateParametersByEntries?: Record<
    string,
    Record<string, unknown> | undefined
  >;
}
