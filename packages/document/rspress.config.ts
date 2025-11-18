import path from 'path';
import { pluginSass } from '@rsbuild/plugin-sass';
import { defineConfig } from '@rspress/core';
import { pluginLlms } from '@rspress/plugin-llms';
import { transformerNotationHighlight } from '@shikijs/transformers';

const docPath = path.join(__dirname, 'docs');

export default defineConfig({
  root: docPath,
  title: 'Modern.js',
  description:
    'The Modern.js framework is a progressive web framework based on React. At ByteDance, we use Modern.js to build upper-level frameworks that have supported the development of thousands of web applications.',
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
  plugins: [pluginLlms()],
  search: {
    codeBlocks: true,
  },
  head: [
    `
          <script>
          ;(function (w, d, u, b, n, pc, ga, ae, po, s, p, e, t, pp) {pc = 'precollect';ga = 'getAttribute';ae = 'addEventListener';po = 'PerformanceObserver';s = function (m) {p = [].slice.call(arguments);p.push(Date.now(), location.href);(m == pc ? s.p.a : s.q).push(p)};s.q = [];s.p = { a: [] };w[n] = s;e = document.createElement('script');e.src = u + '?bid=' + b + '&globalName=' + n;e.crossorigin = u.indexOf('sdk-web') > 0 ? 'anonymous' : 'use-credentials';d.getElementsByTagName('head')[0].appendChild(e);if (ae in w) {s.pcErr = function (e) {e = e || w.event;t = e.target || e.srcElement;if (t instanceof Element || t instanceof HTMLElement) {if (t[ga]('integrity')) {w[n](pc, 'sri', t[ga]('href') || t[ga]('src'))} else {w[n](pc, 'st', { tagName: t.tagName, url: t[ga]('href') || t[ga]('src') })}} else {w[n](pc, 'err', e.error)}};s.pcRej = function (e) {e = e || w.event;w[n](pc, 'err', e.reason || (e.detail && e.detail.reason))};w[ae]('error', s.pcErr, true);w[ae]('unhandledrejection', s.pcRej, true);};if('PerformanceLongTaskTiming' in w) {pp = s.pp = { entries: [] };pp.observer = new PerformanceObserver(function (l) {pp.entries = pp.entries.concat(l.getEntries)});pp.observer.observe({ entryTypes: ['longtask', 'largest-contentful-paint','layout-shift'] })}})(window,document,'https://lf3-short.bytegoofy.com/slardar/fe/sdk-web/browser.cn.js','modernjs_dev','Slardar');

          </script>
          `,
    `
          <script>
            window.Slardar('init', {
              bid: 'modernjs_dev'
            });
            window.Slardar('start')
          </script>
          `,
  ],
  themeConfig: {
    locales: [
      {
        lang: 'zh',
        title: 'Modern.js',
        description:
          'A Progressive React Framework for modern web development.',
        // nav: getNavbar('zh'),
        label: '简体中文',
      },
      {
        lang: 'en',
        title: 'Modern.js',
        description:
          'A Progressive React Framework for modern web development.',
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
    plugins: [pluginSass()],
  },
});
