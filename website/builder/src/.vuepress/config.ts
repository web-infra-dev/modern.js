import {
  NavItem,
  defineConfig4CustomTheme,
  SidebarConfig4Multiple,
} from 'vuepress/config';
import { ThemeConfig } from 'vuepress-theme-vt';
import markdownItInclude from 'markdown-it-include';
import './md-include-hmr';

function getI18nHelper(lang: 'cn' | 'en') {
  const cn = lang === 'cn';
  const prefix = cn ? '/zh' : '/en';
  const getLink = (str: string) => `${prefix}${str}`;
  const getText = (cnText: string, enText: string) => (cn ? cnText : enText);
  return { getText, getLink };
}

function getNavBar(lang: 'cn' | 'en'): NavItem[] {
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

function getSidebar(lang: 'cn' | 'en'): SidebarConfig4Multiple {
  const { getLink, getText } = getI18nHelper(lang);
  return {
    [getLink('/guide/')]: [
      {
        collapsable: false,
        title: getText('开始', 'Getting Started'),
        children: [
          getLink('/guide/introduction'),
          getLink('/guide/quick-start'),
          getLink('/guide/glossary'),
          getLink('/guide/features'),
        ],
      },
      {
        collapsable: false,
        title: getText('基础', 'Basic'),
        children: [
          getLink('/guide/basic/builder-config'),
          getLink('/guide/basic/build-target'),
          getLink('/guide/basic/output-files'),
          getLink('/guide/basic/static-assets'),
          getLink('/guide/basic/svg-assets'),
          getLink('/guide/basic/html-template'),
          getLink('/guide/basic/alias'),
        ],
      },
      {
        collapsable: false,
        title: getText('进阶', 'Advanced'),
        children: [
          getLink('/guide/advanced/build-performance'),
          getLink('/guide/advanced/inline-assets'),
          getLink('/guide/advanced/split-chunk'),
          getLink('/guide/advanced/custom-webpack-config'),
        ],
      },
      {
        collapsable: false,
        title: getText('常见问题', 'FAQ'),
        children: [
          getLink('/guide/faq/general'),
          getLink('/guide/faq/features'),
          getLink('/guide/faq/exceptions'),
        ],
      },
    ],
    [getLink('/api/')]: [
      {
        title: getText('API 总览', 'API Reference'),
        path: getLink('/api/'),
      },
      {
        title: getText('配置', 'Config'),
        collapsable: false,
        children: [
          getLink('/api/config-source'),
          getLink('/api/config-output'),
          getLink('/api/config-dev'),
          getLink('/api/config-html'),
          getLink('/api/config-security'),
          getLink('/api/config-tools'),
          getLink('/api/config-performance'),
          getLink('/api/config-experiments'),
        ],
      },
      {
        title: getText('Node API', 'Node API'),
        collapsable: false,
        children: [
          getLink('/api/builder-core'),
          getLink('/api/builder-instance'),
          getLink('/api/builder-types'),
          getLink('/api/plugin-core'),
          getLink('/api/plugin-hooks'),
        ],
      },
    ],
    [getLink('/plugins')]: [
      {
        collapsable: false,
        title: getText('指南', 'Guide'),
        children: [
          getLink('/plugins/introduction'),
          getLink('/plugins/integration'),
          getLink('/plugins/testing'),
        ],
      },
      {
        collapsable: false,
        title: getText('列表', 'List'),
        children: [
          getLink('/plugins/list'),
          getLink('/plugins/plugin-swc'),
          getLink('/plugins/plugin-esbuild'),
          getLink('/plugins/plugin-node-polyfill'),
        ],
      },
    ],
  };
}

export default defineConfig4CustomTheme<ThemeConfig>(ctx => ({
  base: '/builder/',
  head: [
    ['link', { rel: 'icon', href: `https://modernjs.dev/img/favicon.ico` }],
    ['meta', { name: 'theme-color', content: '#5c6ac4' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    [
      'meta',
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
      },
    ],
    [
      'meta',
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black' },
    ],
  ],
  locales: {
    '/zh/': {
      lang: 'zh-CN',
      title: 'Modern.js Builder',
      description: '一个面向现代 Web 开发场景的构建引擎',
    },
    '/en/': {
      lang: 'en-US',
      title: 'Modern.js Builder',
      description: 'A Build Engine for Modern Web Development',
    },
  },
  theme: 'vt',
  themeConfig: {
    repo: 'https://github.com/modern-js-dev/modern.js/tree/main/packages/builder',
    repoLabel: 'GitHub',
    docsDir: 'docs/docs/src',
    enableDarkMode: true,
    locales: {
      '/zh/': {
        label: '简体中文',
        selectText: '语言',
        ariaLabel: '语言',
        lastUpdated: '上次更新',
        searchMaxSuggestions: 10,
        searchPlaceholder: 'Search',
        nav: getNavBar('cn'),
        sidebar: getSidebar('cn'),
      },
      '/en/': {
        label: 'English',
        selectText: 'Languages',
        ariaLabel: 'Select language',
        lastUpdated: 'Last Updated',
        searchMaxSuggestions: 10,
        searchPlaceholder: 'Search',
        nav: getNavBar('en'),
        sidebar: getSidebar('en'),
      },
    },
  },
  plugins: [
    ['@vuepress/back-to-top', true],
    ['@vuepress/medium-zoom', true],
    ['redirect', { locales: true }],
  ],
  extraWatchFiles: [
    '.vuepress/config/**',
    '../node_modules/@modern-js/builder-doc/**',
  ],
  evergreen: true,
  markdown: {
    extractHeaders: ['h2', 'h3', 'h4'],
  },
  configureWebpack(config) {
    // OptimizeCssAssetsWebpackPlugin will cause the build to fail,
    // removed will not affect the build result
    config.plugins = config.plugins.filter(
      plugin => plugin.constructor.name !== 'OptimizeCssAssetsWebpackPlugin',
    );
  },
  extendMarkdown: md => {
    md.use(markdownItInclude);
  },
}));
