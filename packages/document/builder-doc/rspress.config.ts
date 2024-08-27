import path from 'path';
import type { NavItem, Sidebar } from '@rspress/shared';
import { defineConfig } from 'rspress/config';

function getI18nHelper(lang: 'zh' | 'en') {
  const cn = lang === 'zh';
  const prefix = cn ? '' : '/en';
  const getLink = (str: string) => `${prefix}${str}`;
  const getText = (cnText: string, enText: string) => (cn ? cnText : enText);
  return { getText, getLink };
}

function getNavbar(lang: 'zh' | 'en'): NavItem[] {
  const { getLink } = getI18nHelper(lang);
  return [
    {
      text: 'API',
      link: getLink('/api/'),
      activeMatch: '/api/',
    },
  ];
}

function getSidebar(lang: 'zh' | 'en'): Sidebar {
  const { getLink, getText } = getI18nHelper(lang);

  return {
    [getLink('/api/')]: [
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
