import type { MetaOptions } from '@modern-js/utils';
import type { ChainedConfig } from '../utils';

export type CrossOrigin = 'anonymous' | 'use-credentials';

export type ScriptInject = boolean | 'body' | 'head';

export interface SharedHtmlConfig {
  meta?: MetaOptions;
  metaByEntries?: Record<string, MetaOptions>;
  title?: string;
  titleByEntries?: Record<string, string>;
  inject?: ScriptInject;
  injectByEntries?: Record<string, ScriptInject>;
  favicon?: string;
  faviconByEntries?: Record<string, string | undefined>;
  appIcon?: string;
  mountId?: string;
  crossorigin?: boolean | CrossOrigin;
  disableHtmlFolder?: boolean;
  template?: string;
  templateByEntries?: Partial<Record<string, string>>;
  templateParameters?: ChainedConfig<Record<string, unknown>>;
  templateParametersByEntries?: Record<
    string,
    ChainedConfig<Record<string, unknown>>
  >;
}
