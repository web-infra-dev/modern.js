import path from 'path';
import { Sidebar, NavItem } from '@rspress/shared';
import { defineConfig } from 'rspress/config';

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
      link: getLink('/guide/introduction'),
      activeMatch: '/guide/',
    },
    {
      text: 'API',
      link: getLink('/api/'),
      activeMatch: '/api/',
    },
    {
      text: getText('插件', 'Plugins'),
      link: getLink('/plugins/introduction'),
      activeMatch: '/plugins/',
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
          getLink('/guide/introduction'),
          getLink('/guide/quick-start'),
          getLink('/guide/glossary'),
          getLink('/guide/features'),
        ],
      },
      {
        collapsible: false,
        text: getText('基础', 'Basic'),
        items: [
          getLink('/guide/basic/builder-config'),
          getLink('/guide/basic/build-target'),
          getLink('/guide/basic/output-files'),
          getLink('/guide/basic/css-usage'),
          getLink('/guide/basic/static-assets'),
          getLink('/guide/basic/svg-assets'),
          getLink('/guide/basic/json-files'),
          getLink('/guide/basic/wasm-assets'),
          getLink('/guide/basic/html-template'),
          getLink('/guide/basic/css-modules'),
          getLink('/guide/basic/typescript'),
          getLink('/guide/basic/builder-cli'),
        ],
      },
      {
        collapsible: false,
        text: getText('进阶', 'Advanced'),
        items: [
          getLink('/guide/advanced/rspack-start'),
          getLink('/guide/advanced/alias'),
          getLink('/guide/advanced/define'),
          getLink('/guide/advanced/hmr'),
          getLink('/guide/advanced/rem'),
          getLink('/guide/advanced/browserslist'),
          getLink('/guide/advanced/browser-compatibility'),
          getLink('/guide/advanced/custom-webpack-config'),
          getLink('/guide/advanced/source-build'),
        ],
      },
      {
        collapsible: false,
        text: getText('框架', 'Framework'),
        items: [
          getLink('/guide/framework/vue3'),
          getLink('/guide/framework/vue2'),
        ],
      },
      {
        collapsible: false,
        text: getText('优化', 'Optimization'),
        items: [
          getLink('/guide/optimization/optimize-bundle'),
          getLink('/guide/optimization/build-performance'),
          getLink('/guide/optimization/split-chunk'),
          getLink('/guide/optimization/inline-assets'),
        ],
      },
      {
        collapsible: false,
        text: getText('调试', 'Debug'),
        items: [
          getLink('/guide/debug/debug-mode'),
          getLink('/guide/debug/inspector'),
        ],
      },
      {
        collapsible: false,
        text: getText('常见问题', 'FAQ'),
        items: [
          getLink('/guide/faq/general'),
          getLink('/guide/faq/features'),
          getLink('/guide/faq/exceptions'),
          getLink('/guide/faq/hmr'),
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
          getLink('/api/config-source'),
          getLink('/api/config-html'),
          getLink('/api/config-security'),
          getLink('/api/config-dev'),
          getLink('/api/config-output'),
          getLink('/api/config-tools'),
          getLink('/api/config-performance'),
          getLink('/api/config-experiments'),
        ],
      },
      {
        text: getText('Node API', 'Node API'),
        collapsible: false,
        items: [
          getLink('/api/builder-core'),
          getLink('/api/builder-instance'),
          getLink('/api/builder-types'),
        ],
      },
      {
        text: getText('Plugin API', 'Plugin API'),
        collapsible: false,
        items: [getLink('/api/plugin-core'), getLink('/api/plugin-hooks')],
      },
    ],
    [getLink('/plugins')]: [
      {
        collapsible: false,
        text: getText('指南', 'Guide'),
        items: [getLink('/plugins/introduction')],
      },
      {
        collapsible: false,
        text: getText('列表', 'List'),
        items: [
          getLink('/plugins/list'),
          getLink('/plugins/plugin-vue'),
          getLink('/plugins/plugin-vue2'),
          getLink('/plugins/plugin-swc'),
          getLink('/plugins/plugin-stylus'),
          getLink('/plugins/plugin-esbuild'),
          getLink('/plugins/plugin-node-polyfill'),
          getLink('/plugins/plugin-image-compress'),
        ],
      },
    ],
  };
}

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  lang: 'zh',
  base: '/builder/',
  title: 'Modern.js Builder',
  icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/logo-1x-0104.png',
  markdown: {
    checkDeadLinks: true,
    experimentalMdxRs: true,
  },
  route: {
    // exclude document fragments from routes
    exclude: [
      '**/zh/config/**',
      '**/en/config/**',
      '**/zh/shared/**',
      '**/en/shared/**',
    ],
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
          'https://github.com/web-infra-dev/modern.js/tree/main/packages/builder',
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
        description: '基于 Rspack 的 Web 构建工具',
      },
      {
        lang: 'en',
        label: 'English',
        nav: getNavbar('en'),
        sidebar: getSidebar('en'),
        title: 'Modern.js Builder',
        description: 'An Rspack-based build tool for web development.',
      },
    ],
    editLink: {
      docRepoBaseUrl:
        'https://github.com/web-infra-dev/modern.js/tree/main/packages/document/builder-doc/docs',
      text: 'Edit this page on GitHub',
    },
  },
  replaceRules: [
    // Using "#MODERNJS" to display "Modern.js"
    // and it will not be replaced in EdenX in the in-house document
    {
      search: /#MODERNJS/g,
      replace: 'Modern.js',
    },
  ],
  builderConfig: {
    source: {
      alias: {
        '@components': path.join(__dirname, 'src/components'),
        '@en': path.join(__dirname, 'docs/en'),
        '@zh': path.join(__dirname, 'docs/zh'),
      },
    },
    dev: {
      startUrl: 'http://localhost:<port>/builder/',
    },
  },
});
