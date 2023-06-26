import path from 'path';
import { docTools, defineConfig, type NavItem } from '@modern-js/doc-tools';
import { pluginAutoSidebar } from '@modern-js/doc-plugin-auto-sidebar';

const rootCategories = [
  'tutorials',
  'guides',
  'apis/app',
  'configure/app',
  'community',
];

const { version } = require('./package.json');

const docPath = path.join(__dirname, 'docs');

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
      link: getLink('/apis/app/commands'),
      activeMatch: '/apis/',
    },
    {
      text: getText('社区', 'Community'),
      link: getLink('/community/showcase'),
      activeMatch: '/community/',
    },
    {
      text: `v${version}`,
      items: [
        {
          text: 'Modern.js Module',
          link: 'https://modernjs.dev/module-tools/en/',
        },
        {
          text: 'Modern.js Doc',
          link: 'https://modernjs.dev/doc-tools/',
        },
        {
          text: 'Modern.js Builder',
          link: 'https://modernjs.dev/builder/en/',
        },
        {
          text: 'Modern.js v1',
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
    markdown: {
      checkDeadLinks: true,
      experimentalMdxRs: true,
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
      editLink: {
        docRepoBaseUrl:
          'https://github.com/web-infra-dev/modern.js/tree/main/packages/document/main-doc/docs',
        text: 'Edit this page on GitHub',
      },
      socialLinks: [
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
    builderConfig: {
      output: {
        disableTsChecker: true,
        svgDefaultExport: 'component',
        dataUriLimit: 0,
      },
      dev: {
        startUrl: false,
      },
      source: {
        alias: {
          '@site-docs': path.join(__dirname, './docs/zh'),
          '@site-docs-en': path.join(__dirname, './docs/en'),
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
  plugins: [docTools({})],
});
