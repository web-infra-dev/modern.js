import type { PageIndexInfo } from '@modern-js/doc-core';
import type { ParserOptions } from 'react-docgen-typescript';

export type Entries = Record<string, string>;

export type ToolEntries = {
  documentation: Entries;
  'react-docgen-typescript': Entries;
};

export type ApiParseTool = 'documentation' | 'react-docgen-typescript';

export type DocumentationArgs = {
  // https://github.com/documentationjs/documentation/blob/master/docs/NODE_API.md#parameters-1
  external?: Array<string>;
  shallow?: boolean;
  order?: Array<unknown>;
  access?: Array<string>;
  hljs?: {
    highlightAuto?: boolean;
    languages?: string;
  };
  inferPrivate?: string;
  extension?: string | Array<string>;
  noReferenceLinks?: boolean;
};

export type ParseToolOptions = {
  'react-docgen-typescript'?: ParserOptions;
  documentation?: DocumentationArgs;
};

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
   * parserToolOptions
   * @experimental
   * @zh 解析器参数
   */
  parseToolOptions?: ParseToolOptions;
  /**
   * appDirectory
   * @zh 项目根目录
   * @default process.cwd()
   */
  appDir?: string;
};

export type DocGenOptions = Required<PluginOptions> & {
  languages: ('zh' | 'en')[];
  isProd: boolean;
};

export type SupportLanguages = 'zh' | 'en';

export type ExtendedPageData = PageIndexInfo & {
  apiDocMap: Record<string, string>;
};

export type WatchFileInfo = {
  apiParseTool: ApiParseTool;
  moduleName: string;
};
