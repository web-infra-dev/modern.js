import type { DocConfig } from '@modern-js/doc-core';
import type { PluginOptions as DocGenOptions } from '@modern-js/doc-plugin-api-docgen';

export type APIParseTools = 'ts-document' | 'react-docgen-typescript';

export type ModuleDocgenLanguage = 'zh' | 'en';

export type PluginOptions = Pick<
  Options,
  'entries' | 'languages' | 'doc' | 'previewMode' | 'apiParseTool'
>;

export type Options = {
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
   * previewMode
   * @zh 预览方式
   * @default 'web'
   */
  previewMode?: 'mobile' | 'web';
} & DocGenOptions;
