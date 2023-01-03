import path from 'path';
import { defineConfig } from '@modern-js/doc-tools';
import { remarkCodeHike } from '@code-hike/mdx';

const theme = require('shiki/themes/nord.json');
const { version } = require('./package.json');

function getI18nHelper(lang: 'zh' | 'en') {
  const cn = lang === 'zh';
  const prefix = cn ? '' : '/en';
  const getLink = (str: string) => `${prefix}${str}`;
  const getText = (cnText: string, enText: string) => (cn ? cnText : enText);
  return { getText, getLink };
}

function getSidebar(lang: 'zh' | 'en') {
  const { getLink, getText } = getI18nHelper(lang);

  return {
    [getLink('/guide/')]: [
      {
        text: getText('介绍', 'Introduction'),
        items: [
          {
            text: getText('欢迎使用', 'WelCome'),
            link: getLink('/guide/intro/welcome'),
          },
          {
            text: getText(
              '为什么需要模块工程解决方案',
              'Why module project solution',
            ),
            link: getLink('/guide/intro/why-module-engineering-solution'),
          },
          {
            text: getText('快速开始', 'Getting Started'),
            link: getLink('/guide/intro/getting-started'),
          },
        ],
      },
      {
        text: getText('基础使用', 'Basic Guide'),
        items: [
          {
            text: getText('开始之前', 'Before getting started'),
            link: getLink('/guide/basic/before-getting-started'),
          },
          {
            text: getText('命令预览', 'Command preview'),
            link: getLink('/guide/basic/command-preview'),
          },
          {
            text: getText('修改输出产物', 'Modify output product'),
            link: getLink('/guide/basic/modify-output-product'),
          },
          {
            text: getText('使用微生成器', 'Use Micro generator'),
            link: getLink('/guide/basic/use-micro-generator'),
          },
          {
            text: getText('使用 Storybook', 'Using Storybook'),
            link: getLink('/guide/basic/using-storybook'),
          },
          {
            text: getText('测试项目', 'Test project'),
            link: getLink('/guide/basic/test-your-project'),
          },
          {
            text: getText('发布项目', 'Publish project'),
            link: getLink('/guide/basic/publish-your-project'),
          },
        ],
      },
      {
        text: getText('进阶指南', 'Advanced Guide'),
        items: [
          {
            text: getText('深入理解构建', 'In depth about build'),
            link: getLink('/guide/advance/in-depth-about-build'),
          },
          {
            text: getText('深入理解 dev 命令', 'In depth about dev command'),
            link: getLink('/guide/advance/in-depth-about-dev-command'),
          },
          {
            text: getText('使用 Copy 工具', 'Use Copy Tools'),
            link: getLink('/guide/advance/copy'),
          },
          {
            text: getText(
              '如何处理第三方依赖',
              'How to handle third-party dependencies',
            ),
            link: getLink('/guide/advance/external-dependency'),
          },
          {
            text: getText('构建 umd 产物', 'Build umd'),
            link: getLink('/guide/advance/build-umd'),
          },
          {
            text: getText('处理静态文件', 'Handling static files'),
            link: getLink('/guide/advance/asset'),
          },
          {
            text: getText('主题配置', 'theme configuration'),
            link: getLink('/guide/advance/theme-config'),
          },
        ],
      },
      {
        text: getText('最佳实践', 'Best practices'),
        items: [
          {
            text: getText('开发组件', 'Development Components'),
            link: getLink('/guide/best-practices/components'),
          },
        ],
      },
    ],
    [getLink('/api/')]: [
      {
        text: getText('配置项', 'Config'),
        items: [
          {
            text: getText('BuildConfig', 'BuildConfig'),
            link: getLink('/api/build-config'),
          },
          {
            text: getText('BuildPreset', 'BuildPreset'),
            link: getLink('/api/build-preset'),
          },
          {
            text: getText('Testing', 'Testing'),
            link: getLink('/api/testing'),
          },
          {
            text: getText('Plugins', 'Plugins'),
            link: getLink('/api/plugins'),
          },
          {
            text: getText('DesignSystem', 'DesignSystem'),
            link: getLink('/api/design-system'),
          },
        ],
      },
      {
        text: getText('Plugin API', 'Plugin API'),
        items: [
          {
            text: getText('Plugin Hooks', 'Plugin Hooks'),
            link: getLink('/api/plugin-hooks'),
          },
        ],
      },
    ],
    [getLink('/plugins/')]: [
      {
        text: getText('指南', 'Guide'),
        items: [
          {
            text: getText('快速开始', 'Getting Started'),
            link: getLink('/plugins/guide/getting-started'),
          },
          {
            text: getText('插件对象', 'Plugin Object'),
            link: getLink('/plugins/guide/plugin-object'),
          },
          {
            text: getText('Setup 函数', 'Setup Function'),
            link: getLink('/plugins/guide/setup-function'),
          },
        ],
      },
      {
        text: getText('插件列表', 'Plugins List'),
        items: [
          {
            text: getText('总览', 'Overview'),
            link: getLink('/plugins/official-list/overview'),
          },
        ],
      },
    ],
  };
}

function getNavbar(lang: 'zh' | 'en') {
  const { getLink, getText } = getI18nHelper(lang);

  return [
    {
      text: getText('指南', 'Guide'),
      link: getLink('/guide/intro/welcome'),
      activeMatch: '^/guide/',
    },
    {
      text: getText('API', 'API'),
      link: getLink('/api/'),
      activeMatch: '^/api/',
    },
    {
      text: getText('插件', 'Plugins'),
      link: getLink('/plugins/guide/getting-started'),
      activeMatch: '^/plugins/',
    },
    {
      text: `v${version}`,
      items: [
        {
          text: getText('更新日志', 'Changelog'),
          link: 'https://github.com/modern-js-dev/modern.js/tree/main/packages/solutions/module-tools/CHANGELOG.md',
        },
        {
          text: getText('贡献指南', 'Contributing'),
          link: 'https://github.com/modern-js-dev/modern.js/tree/main/packages/solutions/module-tools/CHANGELOG.md',
        },
      ],
    },
  ];
}

export default defineConfig({
  plugins: ['@modern-js/doc-tools'],
  doc: {
    root: path.join(__dirname, 'docs'),
    lang: 'zh',
    title: 'Module tools',
    markdown: {
      remarkPlugins: [
        [
          remarkCodeHike,
          {
            theme,
            autoImport: true,
            showCopyButton: true,
          },
        ],
      ],
    },
    themeConfig: {
      footer: {
        message: 'Copyright © 2022 ByteDance.',
      },
      locales: [
        {
          lang: 'zh',
          label: '简体中文',
          nav: getNavbar('zh'),
          sidebar: getSidebar('zh'),
          title: 'Module tools',
          outlineTitle: '目录',
          prevPageText: '上一页',
          nextPageText: '下一页',
          description: '模块工程解决方案',
        },
        {
          lang: 'en',
          label: 'English',
          nav: getNavbar('en'),
          sidebar: getSidebar('en'),
          title: 'Module tools',
          description: 'Module Engineering Solutions',
        },
      ],
    },
  },
});
