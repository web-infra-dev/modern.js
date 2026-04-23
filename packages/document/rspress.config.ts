import path from 'path';
import { pluginSass } from '@rsbuild/plugin-sass';
import { defineConfig } from '@rspress/core';
import { transformerNotationHighlight } from '@shikijs/transformers';
import { pluginOpenGraph } from 'rsbuild-plugin-open-graph';

const docPath = path.join(__dirname, 'docs');
const siteTitle = 'Modern.js';
const siteDescription =
  'The Modern.js framework is a progressive web framework based on React. At ByteDance, we use Modern.js to build upper-level frameworks that have supported the development of thousands of web applications.';
const socialDescription =
  'A Progressive React Framework for modern web development.';
const socialImage =
  'https://lf3-static.bytednsdoc.com/obj/eden-cn/nuvjhpqnuvr/modern-website/banner.jpeg';

export default defineConfig({
  root: docPath,
  llms: true,
  title: siteTitle,
  description: siteDescription,
  base: '/',
  logo: 'https://lf-cdn-tos.bytescm.com/obj/static/webinfra/modern-js-website/assets/images/images/modernjs-logo.svg',
  icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/uhbfnupenuhf/favicon.ico',
  lang: 'en',
  themeDir: path.join(__dirname, 'src'),
  markdown: {
    checkDeadLinks: true,
    shiki: {
      transformers: [transformerNotationHighlight()],
    },
  },
  search: {
    codeBlocks: true,
  },
  // head: [
  //   () => {
  //     return [
  //       `<meta property="og:image" content="${socialImage}">`,
  //       `<meta property="og:description" content="${socialDescription}">`,
  //       `<meta property="og:image:alt" content="${siteTitle}">`,
  //       `<meta name="twitter:card" content="summary_large_image">`,
  //       `<meta name="twitter:title" content="${siteTitle}">`,
  //       `<meta name="twitter:description" content="${socialDescription}">`,
  //       `<meta name="twitter:image" content="${socialImage}">`,
  //       `<meta name="twitter:image:alt" content="${siteTitle}">`,
  //     ].join('');
  //   },
  // ],
  themeConfig: {
    locales: [
      {
        lang: 'zh',
        title: siteTitle,
        description: socialDescription,
        // nav: getNavbar('zh'),
        label: '简体中文',
      },
      {
        lang: 'en',
        title: siteTitle,
        description: socialDescription,
        // nav: getNavbar('en'),
        label: 'English',
      },
    ],
    editLink: {
      docRepoBaseUrl:
        'https://github.com/web-infra-dev/modern.js/tree/main/packages/document/docs',
      text: 'Edit this page on GitHub',
    },
    socialLinks: [
      {
        icon: 'discord',
        mode: 'link',
        content: 'https://discord.gg/qPCqYg38De',
      },
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/web-infra-dev/modern.js',
      },
    ],
  },
  route: {
    // exclude document fragments from routes
    exclude: ['scripts/**', '**/zh/components/**', '**/en/components/**'],
  },
  replaceRules: [
    {
      // The major version is different inside the ByteDance,
      // so we use a flag to define it.
      search: /MAJOR_VERSION/g,
      replace: '2',
    },
  ],
  builderConfig: {
    performance: {
      buildCache: false,
    },
    tools: {
      // FIXME: use `?raw` after upgrading to Rsbuild@1.4.0, https://github.com/web-infra-dev/rsbuild/pull/5355
      rspack(_config, { addRules }) {
        addRules([
          {
            test: /\.txt$/i,
            type: 'asset/source',
          },
        ]);
      },
    },
    output: {
      dataUriLimit: 0,
    },
    dev: {
      lazyCompilation: process.env.LAZY !== 'false',
    },
    resolve: {
      alias: {
        '@site-docs': path.join(__dirname, './docs/zh'),
        '@site-docs-en': path.join(__dirname, './docs/en'),
        '@site': require('path').resolve(__dirname),
      },
    },
    plugins: [
      pluginSass(),
      pluginOpenGraph({
        // Note, title is page-specific
        title: 'Modern.js Home Page',
        // While site name is site wide
        siteName: siteTitle,
        type: 'website',
        url: 'https://modernjs.dev/',
        image: socialImage,
        description: socialDescription,
        twitter: {
          site: '@_Modern_JS',
          card: 'summary_large_image',
        },
      }),
    ],
  },
});
