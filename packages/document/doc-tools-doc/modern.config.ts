import path from 'path';
import docTools, { defineConfig } from '@modern-js/doc-tools';

const isProd = () => process.env.NODE_ENV === 'production';

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
