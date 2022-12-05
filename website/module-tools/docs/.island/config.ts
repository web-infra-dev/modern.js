import { defineConfig } from 'islandjs';
import { createRequire } from 'module';
import { remarkCodeHike } from "@code-hike/mdx";

const require = createRequire(import.meta.url);
const theme = require("shiki/themes/nord.json")
const version = require('../../package.json').version;

function getI18nHelper(lang: 'zh' | 'en') {
  const cn = lang === 'zh';
  const prefix = cn ? '/zh' : '/en';
  const getLink = (str: string) => `${prefix}${str}`;
  const getText = (cnText: string, enText: string) => (cn ? cnText : enText);
  return { getText, getLink };
}

export default defineConfig({
  lang: 'en-US',
  title: 'Module tools',
  vite: {
    // custom config for vite
    server: {
      fs: {
        allow: ['../../../..'],
      }
    }
  },
  markdown: {
    rehypePlugins: [],
    remarkPlugins: [
      [
        remarkCodeHike,
        {
          theme,
          autoImport: true,
          showCopyButton: true,
          enableSpa: true
        }
      ],
    ],
  },
  route: {
    exclude: ['custom.tsx', '**/fragments/**']
  },
  themeConfig: {
    locales: {
      '/zh/': {
        lang: 'zh',
        label: '简体中文',
        lastUpdatedText: '上次更新',
        nav: getNavbar('zh'),
        sidebar: getSidebar('zh'),
        title: 'Module tools',
        outlineTitle: '目录',
        prevPageText: '上一页',
        nextPageText: '下一页',
        description: '模块工程解决方案',
        editLink: {
          pattern:
            'https://github.com/modern-js-dev/modern.js/tree/next/website/module-tools/docs/:path',
          text: '📝 在 GitHub 上编辑此页'
        }
      },
      '/en/': {
        lang: 'en',
        label: 'English',
        lastUpdated: 'Last Updated',
        nav: getNavbar('en'),
        sidebar: getSidebar('en'),
        title: 'Module tools',
        description: 'Module Engineering Solutions',
        lastUpdatedText: 'Last Updated',
        editLink: {
          pattern:
            'https://github.com/modern-js-dev/modern.js/tree/next/website/module-tools/docs/:path',
          text: '📝 Edit this page on GitHub'
        }
      }
    },
    outlineTitle: 'ON THIS PAGE',
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/modern-js-dev/modern.js'
      },
    ],

    footer: {
      message: 'The Module Engineering Solutions',
      copyright: '\nCopyright © 2022 ByteDance.'
    }
  }
});

function getSidebar(lang: 'zh' | 'en') {
  const { getLink, getText } = getI18nHelper(lang);

  return {
    [getLink('/guide/')]: [
      {
        text: getText('介绍', 'Introduction'),
        items: [
          {
            text: getText('欢迎使用', 'WelCome'),
            link: getLink('/guide/welcome')
          },
          {
            text: getText('为什么需要模块工程解决方案', 'Why module project solution'),
            link: getLink('/guide/why-module-engineering-solution')
          },
          {
            text: getText('快速开始', 'Getting Started'),
            link: getLink('/guide/getting-started')
          },
        ]
      },
      {
        text: getText('基础使用', 'Basic Guide'),
        items: [
          {
            text: getText('开始之前', 'Before getting started'),
            link: getLink('/guide/before-getting-started')
          },
          {
            text: getText('命令预览', 'Command preview'),
            link: getLink('/guide/command-preview')
          },
          {
            text: getText('修改输出产物', 'Modify output product'),
            link: getLink('/guide/modify-output-product')
          },
          {
            text: getText('使用微生成器', 'Use Micro generator'),
            link: getLink('/guide/use-micro-generator')
          },
          {
            text: getText('使用 Storybook', 'Using Storybook'),
            link: getLink('/guide/using-storybook')
          },
          {
            text: getText('测试项目', 'Test project'),
            link: getLink('/guide/test-your-project')
          },
          {
            text: getText('发布项目', 'Publish project'),
            link: getLink('/guide/publish-your-project')
          },
          {
            text: getText('为你的项目构建UI(可选)', 'Build your UI(optional)'),
            link: getLink('/guide/build-your-ui')
          },
        ]
      },
      {
        text: getText('进阶指南', 'Advanced Guide'),
        items: [
          {
            text: getText('使用插件扩展', 'Plugins extension'),
            link: getLink('/guide/extension')
          },
        ]
      }
    ],
    [getLink('/api/')]: [
      {
        text: getText('配置项', 'Config'),
        items: [
          {
            text: getText('BuildConfig', 'BuildConfig'),
            link: getLink('/api/build-config')
          },
          {
            text: getText('BuildPreset', 'BuildPreset'),
            link: getLink('/api/build-preset')
          },
          {
            text: getText('Dev', 'Dev'),
            link: getLink('/api/dev')
          },
          {
            text: getText('Test', 'Test'),
            link: getLink('/api/test')
          },
          {
            text: getText('Plugin', 'Plugin'),
            link: getLink('/api/plugin')
          },
          {
            text: getText('DesignSystem', 'DesignSystem'),
            link: getLink('/api/design-system')
          },
        ]
      },
    ]
  };
}

function getNavbar(lang: 'zh' | 'en') {
  const { getLink, getText } = getI18nHelper(lang);

  return [
    {
      text: getText('指南', 'Guide'),
      link: getLink('/guide/welcome'),
      activeMatch: '/guide/'
    },
    {
      text: getText('API', 'API'),
      link: getLink('/api/'),
      activeMatch: '/api/'
    },
    {
      text: `v${version}`,
      items: [
        {
          text: getText('更新日志', 'Changelog'),
          // TODO
          link: 'https://github.com/modern-js-dev/modern.js'
        },
        {
          text: getText('贡献指南', 'Contributing'),
          // TODO
          link: 'https://github.com/modern-js-dev/modern.js'
        }
      ]
    }
  ];
}
