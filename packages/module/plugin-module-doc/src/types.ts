import type { DocConfig } from '@modern-js/doc-core';

export type APIParseTools = 'ts-document' | 'react-docgen-typescript';

export type ModuleDocgenLanguage = 'zh' | 'en';

export type PluginOptions = Pick<
  Options,
  'entries' | 'languages' | 'doc' | 'previewMode' | 'apiParseTool'
>;

export type Options = {
  /**
   * Module entries
   * @zh 传入自动生成文档的模块名称及相对路径
   */
  entries?: Record<string, string>;
  /**
   * Target language
   * @zh 文档站的目标语言
   * @default ['zh']
   */
  languages?: Array<ModuleDocgenLanguage>;
  /**
   * Doc framework config
   * @zh 文档框架配置
   */
  doc?: DocConfig;
  /**
   * isProduction
   * @zh 是否是生产环境
   * @default process.env.NODE_ENV === 'production'
   */
  isProduction?: boolean;
  /**
   * appDirectory
   * @zh 项目根目录
   * @default process.cwd()
   */
  appDir?: string;
  /**
   * previewMode
   * @zh 预览方式
   * @default 'web'
   */
  previewMode?: 'mobile' | 'web';
  /**
   * apiParseTool
   * @experimental
   * @zh 解析工具
   * @default 'react-docgen-typescript'
   */
  apiParseTool?: 'react-docgen-typescript' | 'documentation';
};
