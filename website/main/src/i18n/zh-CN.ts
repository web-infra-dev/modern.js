import { EN_US } from './en-US';

export const ZH_CN: Record<keyof typeof EN_US, string> = {
  slogan: '基于 React 的渐进式现代 Web 开发框架',
  introduction: '介绍',
  quickStart: '快速上手',
  features: '特性',
  feature1: 'Rust 构建',
  featureDesc1: '轻松切换到 Rspack 构建工具，编译飞快。',
  feature2: '一体化开发',
  featureDesc2: '在同一项目中完成 BFF 开发，享受简洁的函数调用。',
  feature3: '嵌套路由',
  featureDesc3: '文件系统即路由，附赠全套性能优化。',
  feature4: '多渲染模式',
  featureDesc4: 'SSR、SSG、SPR 等多种渲染模式，统统开箱即用。',
  feature5: 'CSS 方案',
  featureDesc5: 'CSS Modules、CSS-in-JS、TailwindCSS，任你挑选。',
  feature6: '易于配置',
  featureDesc6: '以零配置启动，然后一切皆可配置。',
};
