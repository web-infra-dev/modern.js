import path from 'path';
import docTools, { defineConfig, NavItem } from '@modern-js/doc-tools';
import { remarkCodeHike } from '@code-hike/mdx';
import { pluginAutoSidebar } from '@modern-js/doc-plugin-auto-sidebar';

const theme = require('shiki/themes/nord.json');
const { version } = require('./package.json');

const isDevCommand = process.env.NODE_ENV !== 'production';

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
  plugins: [docTools()],
  doc: {
    root: path.join(__dirname, 'docs'),
    lang: 'zh',
    base: isDevCommand ? '' : '/module-tools/',
    title: 'Module Tools',
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
        message: 'Copyright © 2023 ByteDance.',
      },
      socialLinks: [
        {
          icon: 'github',
          mode: 'link',
          content:
            'https://github.com/modern-js-dev/modern.js/tree/main/packages/solutions/module-tools',
        },
      ],
      locales: [
        {
          lang: 'zh',
          label: '简体中文',
          nav: getNavbar('zh'),
          title: 'Module Tools',
          outlineTitle: '目录',
          prevPageText: '上一页',
          nextPageText: '下一页',
          description: '模块工程解决方案',
        },
        {
          lang: 'en',
          label: 'English',
          nav: getNavbar('en'),
          title: 'Module Tools',
          description: 'Module Engineering Solutions',
        },
      ],
    },
  },
});
