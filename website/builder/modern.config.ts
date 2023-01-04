import path from 'path';
import { defineConfig, Sidebar } from '@modern-js/doc-tools';

function getI18nHelper(lang: 'zh' | 'en') {
  const cn = lang === 'zh';
  const prefix = cn ? '' : '/en';
  const getLink = (str: string) => `${prefix}${str}`;
  const getText = (cnText: string, enText: string) => (cn ? cnText : enText);
  return { getText, getLink };
}

function getNavbar(lang: 'zh' | 'en') {
  const { getLink, getText } = getI18nHelper(lang);
  return [
    {
      text: getText('指南', 'Guide'),
      link: getLink('/guide/introduction'),
    },
    {
      text: 'API',
      link: getLink('/api/'),
    },
    {
      text: getText('插件', 'Plugins'),
      link: getLink('/plugins/introduction'),
    },
  ];
}

function getSidebar(lang: 'zh' | 'en'): Sidebar {
  const { getLink, getText } = getI18nHelper(lang);
  return {
    [getLink('/guide/')]: [
      {
        collapsed: false,
        collapsible: false,
        text: getText('开始', 'Getting Started'),
        items: [
          {
            text: getText('介绍', 'Introduction'),
            link: getLink('/guide/introduction'),
          },
          // getLink('/guide/quick-start'),
          // getLink('/guide/glossary'),
          // getLink('/guide/features'),
        ],
      },
      {
        collapsible: false,
        text: getText('基础', 'Basic'),
        items: [
          // getLink('/guide/basic/builder-config'),
          // getLink('/guide/basic/build-target'),
          // getLink('/guide/basic/output-files'),
          // getLink('/guide/basic/css-usage'),
          // getLink('/guide/basic/static-assets'),
          // getLink('/guide/basic/svg-assets'),
          // getLink('/guide/basic/json-files'),
          // getLink('/guide/basic/html-template'),
          // getLink('/guide/basic/css-modules'),
          // getLink('/guide/basic/typescript'),
        ],
      },
      {
        collapsible: false,
        text: getText('进阶', 'Advanced'),
        items: [
          // getLink('/guide/advanced/alias'),
          // getLink('/guide/advanced/define'),
          // getLink('/guide/advanced/hmr'),
          // getLink('/guide/advanced/rem'),
          // getLink('/guide/advanced/browserslist'),
          // getLink('/guide/advanced/browser-compatibility'),
          // getLink('/guide/advanced/custom-webpack-config'),
        ],
      },
      {
        collapsible: false,
        text: getText('优化', 'Optimization'),
        items: [
          // getLink('/guide/optimization/optimize-bundle'),
          // getLink('/guide/optimization/build-performance'),
          // getLink('/guide/optimization/split-chunk'),
          // getLink('/guide/optimization/inline-assets'),
        ],
      },
      {
        collapsible: false,
        text: getText('调试', 'Debug'),
        items: [
          // getLink('/guide/debug/debug-mode'),
          // getLink('/guide/debug/inspector'),
        ],
      },
      {
        collapsible: false,
        text: getText('常见问题', 'FAQ'),
        items: [
          // getLink('/guide/faq/general'),
          // getLink('/guide/faq/features'),
          // getLink('/guide/faq/exceptions'),
        ],
      },
    ],
    [getLink('/api/')]: [
      {
        text: getText('API 总览', 'API Reference'),
        link: getLink('/api/'),
      },
      {
        text: getText('配置', 'Config'),
        collapsible: false,
        items: [
          // getLink('/api/config-source'),
          // getLink('/api/config-html'),
          // getLink('/api/config-dev'),
          // getLink('/api/config-output'),
          // getLink('/api/config-security'),
          // getLink('/api/config-tools'),
          // getLink('/api/config-performance'),
          // getLink('/api/config-experiments'),
        ],
      },
      {
        text: getText('Node API', 'Node API'),
        collapsible: false,
        items: [
          // getLink('/api/builder-core'),
          // getLink('/api/builder-instance'),
          // getLink('/api/builder-types'),
        ],
      },
      {
        text: getText('Plugin API', 'Plugin API'),
        collapsible: false,
        items: [
          // getLink('/api/plugin-core'),
          // getLink('/api/plugin-hooks')
        ],
      },
    ],
    [getLink('/plugins')]: [
      {
        collapsible: false,
        text: getText('指南', 'Guide'),
        items: [
          // getLink('/plugins/introduction'),
          // TODO to be written
          // getLink('/plugins/integration'),
          // getLink('/plugins/testing'),
        ],
      },
      {
        collapsible: false,
        text: getText('列表', 'List'),
        items: [
          // getLink('/plugins/list'),
          // getLink('/plugins/plugin-swc'),
          // getLink('/plugins/plugin-stylus'),
          // getLink('/plugins/plugin-esbuild'),
          // getLink('/plugins/plugin-node-polyfill'),
          // getLink('/plugins/plugin-image-compress'),
        ],
      },
    ],
  };
}

export default defineConfig({
  plugins: ['@modern-js/doc-tools'],
  doc: {
    root: path.join(__dirname, 'src'),
    lang: 'zh',
    base: '/builder/',
    title: 'Modern.js Builder',
    themeConfig: {
      footer: {
        message: 'Copyright © 2022 ByteDance.',
      },
      socialLinks: [
        {
          icon: 'github',
          mode: 'link',
          content:
            'https://github.com/modern-js-dev/modern.js/tree/main/packages/builder',
        },
      ],
      locales: [
        {
          lang: 'zh',
          label: '简体中文',
          nav: getNavbar('zh'),
          sidebar: getSidebar('zh'),
          title: 'Modern.js Builder',
          outlineTitle: '目录',
          prevPageText: '上一页',
          nextPageText: '下一页',
          description: '一个面向现代 Web 开发场景的构建引擎',
        },
        {
          lang: 'en',
          label: 'English',
          nav: getNavbar('en'),
          title: 'Modern.js Builder',
          description: 'A Build Engine for Modern Web Development',
        },
      ],
    },
  },
});
