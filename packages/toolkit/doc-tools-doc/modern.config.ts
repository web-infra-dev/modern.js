import path from 'path';
import docTools, { defineConfig, NavItem, Sidebar } from '@modern-js/doc-tools';

function getI18nHelper(lang: 'zh' | 'en') {
  const isZh = lang === 'zh';
  const prefix = isZh ? '' : '/en';
  const getLink = (str: string) => `${prefix}${str}`;
  const getText = (zhText: string, enText: string) => (isZh ? zhText : enText);
  return { getText, getLink };
}

export default defineConfig({
  plugins: [docTools()],
  doc: {
    root: path.join(__dirname, 'docs'),
    title: 'Modern.js Doc',
    description: 'A modern web framework for building document site',
    lang: 'zh',
    builderConfig: {
      dev: {
        startUrl: false,
      },
    },
    themeConfig: {
      footer: {
        message: '© 2023 Bytedance Inc. All Rights Reserved.',
      },
      socialLinks: [
        {
          icon: 'github',
          mode: 'link',
          content: 'https://github.com/modern-js-dev/modern.js',
        },
      ],
      locales: [
        {
          nav: getNavbar('zh'),
          sidebar: getSidebar('zh'),
          lang: 'zh',
          label: '简体中文',
        },
        {
          nav: getNavbar('en'),
          sidebar: getSidebar('en'),
          lang: 'en',
          label: 'English',
        },
      ],
    },
  },
});

function getSidebar(lang: 'zh' | 'en'): Sidebar {
  const { getLink, getText } = getI18nHelper(lang);

  return {
    [getLink('/guide/')]: [
      {
        text: getText('开始', 'Getting Started'),
        items: [
          getLink('/guide/introduction'),
          getLink('/guide/getting-started'),
        ],
      },
      {
        text: getText('基础功能', 'Features'),
        items: [
          getLink('/guide/conventional-route'),
          getLink('/guide/use-mdx'),
          getLink('/guide/static-assets'),
          getLink('/guide/global-styles'),
        ],
      },
      {
        text: getText('默认主题功能', 'Default Theme'),
        items: [
          getLink('/guide/navbar'),
          getLink('/guide/home-page'),
          getLink('/guide/doc-page'),
          getLink('/guide/overview-page'),
          getLink('/guide/i18n'),
          getLink('/guide/search'),
        ],
      },
      {
        text: getText('高级能力', 'Advanced'),
        items: [
          getLink('/advanced/extend-build'),
          getLink('/advanced/custom-theme'),
          getLink('/advanced/plugin-system'),
        ],
      },
    ],
    [getLink('/api/')]: [
      {
        text: getText('API 概览', 'API Overview'),
        link: getLink('/api/'),
      },
      {
        text: getText('配置项', 'Config'),
        items: [
          getLink('/api/config-basic'),
          getLink('/api/config-theme'),
          getLink('/api/config-frontmatter'),
          getLink('/api/config-build'),
        ],
      },
      {
        text: getText('Client API', 'Client API'),
        items: [getLink('/api/api-runtime'), getLink('/api/api-components')],
      },
    ],
  };
}

function getNavbar(lang: 'zh' | 'en'): NavItem[] {
  const { getLink, getText } = getI18nHelper(lang);

  return [
    {
      text: getText('指南', 'Guide'),
      link: getLink('/guide/getting-started'),
      activeMatch: '/guide/',
    },
    {
      text: getText('API', 'API'),
      link: getLink('/api/'),
      activeMatch: '/api/',
    },
  ];
}
