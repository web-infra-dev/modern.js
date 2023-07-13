import type { PageIndexInfo } from '@modern-js/doc-core';

export type Entries = Record<string, string>;

export type ToolEntries = {
  documentation: Entries;
  'react-docgen-typescript': Entries;
};

export type ApiParseTool = 'documentation' | 'react-docgen-typescript';

export type PluginOptions = {
  /**
   * Module entries
   * @zh 传入自动生成文档的模块名称及相对路径
   */
  entries?: Entries | ToolEntries;
  /**
   * apiParseTool
   * @experimental
   * @zh 解析工具
   * @default 'react-docgen-typescript'
   */
  apiParseTool?: ApiParseTool;
  /**
   * appDirectory
   * @zh 项目根目录
   * @default process.cwd()
   */
  appDir?: string;
};

export type DocGenOptions = Required<PluginOptions> & {
  languages: ('zh' | 'en')[];
};

export type SupportLanguages = 'zh' | 'en';

export type ExtendedPageData = PageIndexInfo & {
  apiDocMap: Record<string, string>;
};
