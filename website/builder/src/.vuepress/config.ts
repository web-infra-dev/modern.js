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
  const fx = (str: string) => `${prefix}${str}`;
  const ft = (cnText: string, enText: string) => (cn ? cnText : enText);
  return { ft, fx };
}

function getNavBar(lang: 'cn' | 'en'): NavItem[] {
  const { fx, ft } = getI18nHelper(lang);
  return [
    {
      text: ft('指南', 'Guide'),
      link: fx('/guide/introduction'),
    },
    {
      text: 'API',
      link: fx('/api/'),
    },
  ];
}

function getSidebar(lang: 'cn' | 'en'): SidebarConfig4Multiple {
  const { fx, ft } = getI18nHelper(lang);
  return {
    [fx('/guide/')]: [
      {
        collapsable: false,
        title: ft('开始', 'Start'),
        children: [fx('/guide/introduction'), fx('/guide/quick-start')],
      },
    ],
    [fx('/api/')]: [
      {
        title: ft('API 总览', 'API Reference'),
        path: fx('/api/'),
      },
      {
        title: ft('配置', 'Config'),
        collapsable: false,
        children: [
          fx('/api/config-source'),
          fx('/api/config-output'),
          fx('/api/config-dev'),
          fx('/api/config-html'),
          fx('/api/config-security'),
          fx('/api/config-tools'),
          fx('/api/config-performance'),
        ],
      },
    ],
  };
}

export default defineConfig4CustomTheme<ThemeConfig>(ctx => ({
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
      description: '面向现代 Web 开发场景的通用构建引擎',
    },
    '/en/': {
      lang: 'en-US',
      title: 'Modern.js Builder',
      description: 'A Universal Build Engine for Modern Web Development',
    },
  },
  theme: 'vt',
  themeConfig: {
    repo: 'https://github.com/modern-js-dev/modern.js',
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
  extendMarkdown: md => {
    md.use(markdownItInclude);
  },
  cache: false,
  // configureWebpack: config => {
  //   config.plugins.push(
  //     new WatchExternalFilesPlugin.default({
  //       files: ['./node_modules/@modern-js/builder-doc/**'],
  //     }),
  //   );
  // },
}));
