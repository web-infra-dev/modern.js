import path from 'path';
import type { NavItem } from '@rspress/shared';
import { defineConfig } from 'rspress/config';
import { pluginAutoSidebar } from '@modern-js/doc-plugin-auto-sidebar';

const { version } = require('./package.json');

function getI18nHelper(lang: 'zh' | 'en') {
  const cn = lang === 'zh';
  const prefix = cn ? '' : '/en';
  const getLink = (str: string) => `${prefix}${str}`;
  const getText = (cnText: string, enText: string) => (cn ? cnText : enText);
  return { getText, getLink };
}

function getNavbar(lang: 'zh' | 'en'): NavItem[] {
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
          link: 'https://github.com/web-infra-dev/modern.js/tree/main/packages/solutions/module-tools/CHANGELOG.md',
        },
        {
          text: getText('贡献指南', 'Contributing'),
          link: 'https://modernjs.dev/en/community/contributing-guide.html',
        },
      ],
    },
  ];
}

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  lang: 'zh',
  base: '/module-tools/',
  title: 'Modern.js Module',
  icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/logo-1x-0104.png',
  // The plugins for doc tools.
  plugins: [
    pluginAutoSidebar({
      root: path.join(__dirname, 'docs'),
      categories: ['zh', 'en']
        .map(lang =>
          ['guide', 'api', 'plugins'].map(category => `${lang}/${category}`),
        )
        .flat(),
      collapsed: false,
    }),
  ],
  markdown: {
    checkDeadLinks: true,
    experimentalMdxRs: true,
  },
  themeConfig: {
    footer: {
      message: 'Copyright © 2023 ByteDance.',
    },
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content:
          'https://github.com/web-infra-dev/modern.js/tree/main/packages/solutions/module-tools',
      },
    ],
    locales: [
      {
        lang: 'zh',
        label: '简体中文',
        nav: getNavbar('zh'),
        title: 'Modern.js Module',
        outlineTitle: '目录',
        prevPageText: '上一页',
        nextPageText: '下一页',
        description: '模块工程解决方案',
      },
      {
        lang: 'en',
        label: 'English',
        nav: getNavbar('en'),
        title: 'Modern.js Module',
        description: 'Module Engineering Solutions',
      },
    ],
    editLink: {
      docRepoBaseUrl:
        'https://github.com/web-infra-dev/modern.js/tree/main/packages/document/module-doc/docs',
      text: 'Edit this page on GitHub',
    },
  },
  replaceRules: [
    {
      // The major version is different inside the ByteDance,
      // so we use a flag to define it.
      search: /MAJOR_VERSION/g,
      replace: '2',
    },
  ],
  builderConfig: {
    dev: {
      startUrl: 'http://localhost:<port>/module-tools/',
    },
    source: {
      alias: {
        '@site-docs': path.join(__dirname, './docs/zh'),
        '@site-docs-en': path.join(__dirname, './docs/en'),
        '@site': require('path').resolve(__dirname),
      },
    },
  },
});
