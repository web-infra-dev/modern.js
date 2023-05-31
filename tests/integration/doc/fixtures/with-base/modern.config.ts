import * as path from 'path';
import docTools, { defineConfig } from '@modern-js/doc-tools';

export default defineConfig({
  plugins: [docTools()],
  doc: {
    root: path.join(__dirname, 'doc'),
    lang: 'zh',
    base: '/base',
    themeConfig: {
      darkMode: false,
      locales: [
        {
          lang: 'zh',
          title: '一个很棒的项目',
          description: '一个很棒的项目描述',
          sidebar: {
            '/guide/': [
              {
                text: '指南',
                items: [
                  {
                    text: '快速上手',
                    link: '/guide/quick-start',
                  },
                  {
                    text: '安装',
                    link: '/guide/install',
                  },
                ],
              },
            ],
          },
          // 语言切换按钮的文案
          // Language switch button text
          label: '简体中文',
        },
        {
          lang: 'en',
          title: 'A awesome project',
          description: 'A awesome project description',
          sidebar: {
            '/en/guide/': [
              {
                text: 'Guide',
                items: [
                  {
                    text: 'Quick Start',
                    link: '/en/guide/quick-start',
                  },
                  {
                    text: 'Install',
                    link: '/en/guide/install',
                  },
                ],
              },
            ],
          },
          label: 'English',
        },
      ],
    },
  },
});
