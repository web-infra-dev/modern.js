import type { PageIndexInfo } from '@modern-js/doc-core';

export type PluginOptions = {
  entries?: Record<string, string>;
  apiParseTool?: 'documentation' | 'react-docgen-typescript';
  appDir?: string;
};

export type DocGenOptions = Required<PluginOptions> & {
  languages: ('zh' | 'en')[];
};

export type SupportLanguages = 'zh' | 'en';

export type ExtendedPageData = PageIndexInfo & {
  apiDocMap: Record<string, string>;
};
