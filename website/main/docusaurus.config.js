const path = require('path');
const navbar = require('./navbar');

const baseUrl = '/v2/';
const isProd = process.env.NODE_ENV !== 'development';
const isLocal = process.env.LOCAL;
// eslint-disable-next-line no-nested-ternary
const publicPath = !isProd
  ? '/'
  : isLocal
  ? baseUrl
  : `https://lf-cdn-tos.bytescm.com/obj/static/webinfra/modern-js-website/`;

const templatePublicPath =
  isProd && !isLocal
    ? `${publicPath}<%= it.baseUrl.replace('${baseUrl}', '') %>`
    : '<%= it.baseUrl %>';

// @ts-check
/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Modern.js - 现代 Web 工程体系',
  tagline: 'Modernjs are cool',
  url: 'https://modernjs.dev/',
  baseUrl: isProd ? baseUrl : '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'Modern Js', // Usually your GitHub org/user name.
  projectName: 'Modern.js', // Usually your repo name.
  /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
  themeConfig: {
    prism: {
      additionalLanguages: ['powershell'],
    },
    navbar,
    footer: {
      style: 'dark',
      links: [
        {
          title: '使用指南',
          items: [
            {
              label: '快速上手',
              to: '/docs/guides/get-started/quick-start',
            },
            {
              label: '实战教程',
              to: '/docs/tutorials/first-app/overview',
            },
            {
              label: '基础功能',
              to: '/docs/guides/basic-features/',
            },
            {
              label: '进阶功能',
              to: '/docs/guides/advanced-features/',
            },
          ],
        },
        {
          title: 'API 资料',
          items: [
            {
              label: '命令',
              to: '/docs/apis/app/commands',
            },
            {
              label: '运行时',
              to: '/docs/apis/app/runtime',
            },
            {
              label: '文件约定',
              to: '/docs/apis/app/hooks',
            },
            {
              label: '配置选项',
              to: '/docs/configure/app/usage',
            },
          ],
        },
        {
          title: '关注我们',
          items: [
            {
              icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/icons/weixin.png',
              qrcode:
                'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/icons/weixin-qrcode.jpeg',
              to: '/weixin',
              label: '微信',
            },
            {
              icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/icons/bilibili.png',
              to: 'https://space.bilibili.com/1195398938',
              label: 'bilibili',
            },
            {
              icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/icons/feishu.png',
              qrcode:
                'https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/feishu-qrcode-0914.png',
              to: 'Feishu',
              label: '飞书',
            },
            {
              icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/icons/github.png',
              qrcode: '',
              to: 'https://github.com/modern-js-dev/modern.js',
              label: 'GitHub',
            },
          ],
        },
      ],
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          path: path.join(__dirname, '../../packages/toolkit/main-doc/zh'),
          sidebarPath: require.resolve('./sidebars.js'),
          breadcrumbs: false,
          async sidebarItemsGenerator({
            defaultSidebarItemsGenerator,
            ...args
          }) {
            const sidebarItems = await defaultSidebarItemsGenerator(args);
            return sidebarItems;
          },
          // Please change this to your repo.
          // editUrl: 'https://github.com/facebook/docusaurus/edit/main/website/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/edit/main/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/dyte/custom.css'),
        },
      },
    ],
  ],
  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexDocs: true,
        indexBlog: true,
        indexPages: false,
        searchContextByPaths: ['docs/apis', 'docs/configure'],
        language: ['en', 'zh'],
      },
    ],
  ],
  plugins: [
    function ModernjsPlugin() {
      // ...
      return {
        name: 'Modernjs-plugin',
        configureWebpack(config) {
          let { entry } = config;
          if (config.name === 'client' && isProd) {
            entry = [path.join(__dirname, './scripts/pre-entry.js'), entry];
          }

          return {
            entry,
            output: {
              publicPath,
            },
            resolve: {
              alias: {
                '@site-docs': path.join(
                  __dirname,
                  '../../packages/toolkit/main-doc/zh',
                ),
              },
            },
            resolveLoader: {
              alias: {
                '@site': path.resolve(__dirname),
              },
            },
          };
        },
        injectHtmlTags() {
          return {
            headTags: [
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
          };
        },
      };
    },
  ],
  i18n: {
    path: path.join(__dirname, '../../packages/toolkit/main-doc'),
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans', 'en'],
    localeConfigs: {
      'zh-Hans': {
        label: '简体中文（中国）',
      },
      en: {
        label: 'English',
      },
    },
  },
  ssrTemplate: `<!DOCTYPE html>
  <html <%~ it.htmlAttributes %>>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=0.86, maximum-scale=3.0, minimum-scale=0.86">
      <meta name="generator" content="Docusaurus v<%= it.version %>">
      <% it.metaAttributes.forEach((metaAttribute) => { %>
        <%~ metaAttribute %>
      <% }); %>
      <script>
        window.__assetsPrefix__ = "${templatePublicPath}";
      </script>
      <%~ it.headTags %>
      <% it.stylesheets.forEach((stylesheet) => { %>
        <link rel="stylesheet" href="${templatePublicPath}<%= stylesheet %>" />
      <% }); %>
      <% it.scripts.forEach((script) => { %>
        <link rel="preload" href="${templatePublicPath}<%= script %>" as="script">
      <% }); %>
    </head>
    <body <%~ it.bodyAttributes %>>
      <%~ it.preBodyTags %>
      <div id="__docusaurus">
        <%~ it.appHtml %>
      </div>
      <% it.scripts.forEach((script) => { %>
        <script src="${templatePublicPath}<%= script %>"></script>
      <% }); %>
      <%~ it.postBodyTags %>
    </body>
  </html>`,
};
