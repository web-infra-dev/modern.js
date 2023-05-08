import path from 'path';
import docTools, { defineConfig, NavItem, Sidebar } from '@modern-js/doc-tools';

const isProd = () => process.env.NODE_ENV === 'production';

const getI18nKey = (key: keyof typeof import('./i18n.json')) => key;

export default defineConfig({
  plugins: [docTools({})],
  doc: {
    markdown: {
      experimentalMdxRs: true,
      checkDeadLinks: true,
    },
    root: path.join(__dirname, 'docs'),
    title: 'Modern.js Doc',
    description: 'A modern web framework for building document site',
    // 默认英文
    lang: 'en',
    base: isProd() ? '/doc-tools/' : '/',
    icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/logo-1x-0104.png',
    builderConfig: {
      dev: {
        startUrl: false,
      },
    },
    route: {
      exclude: ['**/fragments/**'],
    },
    themeConfig: {
      nav: getNavbar(),
      sidebar: getSidebar(),
      footer: {
        message: '© 2023 Bytedance Inc. All Rights Reserved.',
      },
      socialLinks: [
        {
          icon: 'github',
          mode: 'link',
          content: 'https://github.com/web-infra-dev/modern.js',
        },
      ],
      locales: [
        {
          lang: 'zh',
          label: '简体中文',
        },
        {
          lang: 'en',
          label: 'English',
        },
      ],
      editLink: {
        docRepoBaseUrl:
          'https://github.com/web-infra-dev/modern.js/tree/main/packages/document/doc-tools-doc/docs',
        text: 'Edit this page on GitHub',
      },
    },
  },
});

function getSidebar(): Sidebar {
  return {
    '/guide/': [
      {
        text: getI18nKey('getting-started'),
        items: ['/guide/introduction', '/guide/getting-started'],
      },
      {
        text: getI18nKey('features'),
        items: [
          '/guide/conventional-route',
          '/guide/use-mdx',
          '/guide/static-assets',
          '/guide/global-styles',
        ],
      },
      {
        text: getI18nKey('default-theme'),
        items: [
          '/guide/navbar',
          '/guide/home-page',
          '/guide/doc-page',
          '/guide/overview-page',
          '/guide/i18n',
          '/guide/components',
        ],
      },
      {
        text: getI18nKey('advanced'),
        items: ['/advanced/extend-build', '/advanced/custom-theme'],
      },
    ],
    '/api/': [
      {
        text: getI18nKey('api-overview'),
        link: '/api/',
      },
      {
        text: getI18nKey('config'),
        items: [
          '/api/config-basic',
          '/api/config-theme',
          '/api/config-frontmatter',
          '/api/config-build',
        ],
      },
      {
        text: getI18nKey('client-api'),
        items: ['/api/api-runtime', '/api/api-components'],
      },
      {
        text: getI18nKey('commands'),
        link: '/api/commands',
      },
    ],
    '/plugin/': [
      {
        text: getI18nKey('plugin-system'),
        items: [
          '/plugin/introduction',
          '/plugin/write-a-plugin',
          '/plugin/plugin-api',
        ],
      },
      // {
      //   text: getI18nKey('plugin-list'),
      //   items: [
      //     '/plugin/official-plugins/',
      //     '/plugin/official-plugins/medium-zoom',
      //   ],
      // },
    ],
  };
}

function getNavbar(): NavItem[] {
  return [
    {
      text: getI18nKey('guide'),
      link: '/guide/getting-started',
      activeMatch: '/guide/',
    },
    {
      text: getI18nKey('plugin'),
      link: '/plugin/introduction',
      activeMatch: '/plugin/',
    },
    {
      text: getI18nKey('api'),
      link: '/api/',
      activeMatch: '/api/',
    },
  ];
}
