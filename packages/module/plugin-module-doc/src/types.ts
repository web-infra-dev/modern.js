import type { DocConfig } from '@modern-js/doc-core';

export type APIParseTools = 'ts-document' | 'react-docgen-typescript';

export type ModuleDocgenLanguage = 'zh' | 'en';

export type PluginOptions = Pick<
  Options,
  'entries' | 'languages' | 'doc' | 'demosDir' | 'useTemplate'
>;

export type Options = {
  /**
   * Module entries
   * @zh 传入自动生成文档的模块名称及相对路径
   */
  entries?: Record<string, string>;
  /**
   * Target language
   * @zh 生成文档的目标语言
   * @default ['zh']
   */
  languages?: Array<ModuleDocgenLanguage>;
  /**
   * Doc framework config
   * @zh 文档框架配置
   */
  doc?: DocConfig;
  /**
   * Demo dir
   * @zh 模块 demo 所在的路径
   * @default './demos'
   */
  demosDir?: string;
  /**
   * useTemplate
   * @zh 是否使用模板渲染
   * @default false
   */
  useTemplate?: boolean;
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
   * tsParseTool
   * @zh ts 解析工具
   * @default 'ts-document'
   */
  tsParseTool?: APIParseTools;
  /**
   * output
   * @zh 输出目录
   * @default './node_modules/.docs'
   */
  docgenDir?: string;
  /**
   * isTsProject
   * not useful now
   * @zh 是否是 ts 项目
   * @default true
   */
  isTsProject?: boolean;
};
