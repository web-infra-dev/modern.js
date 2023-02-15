import path from 'path';
import docTools, { defineConfig, type NavItem } from '@modern-js/doc-tools';
import { pluginAutoSidebar } from '@modern-js/doc-plugin-auto-sidebar';

const rootCategories = [
  'tutorials',
  'guides',
  'apis/app',
  'configure/app',
  'blog',
];

const { version } = require('./package.json');

const docPath = path.join(__dirname, '../../packages/toolkit/main-doc');

const getNavbar = (lang: string): NavItem[] => {
  const cn = lang === 'zh';
  const prefix = cn ? '' : '/en';
  const getLink = (str: string) => `${prefix}${str}`;
  const getText = (cnText: string, enText: string) => (cn ? cnText : enText);
  return [
    {
      text: getText('指南', 'Guide'),
      link: getLink('/guides/get-started/introduction'),
      activeMatch: '/guides/',
    },
    {
      text: getText('教程', 'Tutorials'),
      link: getLink('/tutorials/foundations/introduction'),
      activeMatch: '/tutorials/',
    },
    {
      text: getText('配置', 'Configure'),
      link: getLink('/configure/app/usage'),
      activeMatch: '/configure/app',
    },
    {
      text: getText('API', 'API'),
      link: getLink('/apis/app/commands/dev'),
      activeMatch: '/apis/',
    },
    // TODO enabled after we write the v2 release blog
    // {
    //   text: getText('博客', 'Blog'),
    //   link: getLink('/blog/index'),
    //   activeMatch: '/blog/',
    // },
    {
      text: `v${version}`,
      items: [
        {
          text: 'v1',
          link: 'https://modernjs.dev/v1/',
        },
      ],
    },
  ];
};

export default defineConfig({
  doc: {
    root: docPath,
    base: '/',
    logo: 'https://lf-cdn-tos.bytescm.com/obj/static/webinfra/modern-js-website/assets/images/images/modernjs-logo.svg',
    icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/uhbfnupenuhf/favicon.ico',
    lang: 'zh',
    themeDir: path.join(__dirname, 'src'),
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
          nav: getNavbar('zh'),
          label: '简体中文',
        },
        {
          lang: 'en',
          title: 'Modern.js',
          description:
            'A Progressive React Framework for modern web development.',
          nav: getNavbar('en'),
          label: 'English',
        },
      ],
      socialLinks: [
        {
          icon: 'github',
          mode: 'link',
          content: 'https://github.com/modern-js-dev/modern.js',
        },
      ],
    },
    route: {
      exclude: ['scripts/**', '**/components/**'],
    },
    builderConfig: {
      output: {
        disableTsChecker: true,
        svgDefaultExport: 'component',
        dataUriLimit: 0,
      },
      dev: {
        startUrl: true,
      },
      source: {
        alias: {
          '@site-docs': path.join(
            __dirname,
            '../../packages/toolkit/main-doc/zh',
          ),
          '@site-docs-en': path.join(
            __dirname,
            '../../packages/toolkit/main-doc/en',
          ),
          '@site': require('path').resolve(__dirname),
        },
      },
    },
    plugins: [
      pluginAutoSidebar({
        root: docPath,
        categories: ['zh', 'en'].flatMap(lang =>
          rootCategories.map(category => `${lang}/${category}`),
        ),
      }),
    ],
  },
  plugins: [docTools()],
});
