// @ts-check
/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'Modern.js - 现代 Web 工程体系',
  tagline: 'Modernjs are cool',
  url: 'https://modernjs.dev/',
  baseUrl: '/',
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
    navbar: {
      logo: {
        alt: 'Modernjs Logo',
        src: 'https://lf-cdn-tos.bytescm.com/obj/static/webinfra/modern-js-website/assets/images/images/modernjs-logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'start/mobile',
          position: 'left',
          label: '开始',
        },
        {
          type: 'doc',
          docId: 'guides/overview',
          position: 'left',
          label: '指南',
        },
        {
          type: 'doc',
          docId: 'apis/overview',
          position: 'left',
          label: 'API',
        },
        { to: '/blog', label: '博客', position: 'left' },
        { to: '/coming-soon', label: '社区', position: 'left' },
        {
          href: 'https://github.com/modern-js-dev/modern.js',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '使用指南',
          items: [
            {
              label: '快速上手',
              to: '/docs/start/mobile',
            },
            {
              label: '实战教程',
              to: '/docs/guides/tutorials/overview',
            },
            {
              label: '更多用法',
              to: '/docs/guides/usages/eslint',
            },
            {
              label: '专题详解',
              to: '/docs/guides/features/runtime/code-splitting',
            },
          ],
        },
        {
          title: 'API 资料',
          items: [
            {
              label: '命令',
              to: '/docs/apis/commands/overview',
            },
            {
              label: '运行时',
              to: '/docs/apis/runtime/overview',
            },
            {
              label: '文件约定',
              to: '/docs/apis/hooks/overview',
            },
            {
              label: '配置选项',
              to: '/docs/apis/config/overview',
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
                'https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/icons/feishu-qrcode.png',
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
      logo: {
        alt: 'ByteDance Open Source Logo',
        src: 'https://lf-cdn-tos.bytescm.com/obj/static/webinfra/modern-js-website/assets/images/images/modernjs-logo.svg',
      },
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          breadcrumbs: false,
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
          customCss: require.resolve('./src/css/custom.css'),
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
        translations: {
          search_placeholder: '搜索',
        },
        language: ['en', 'zh'],
      },
    ],
  ],
  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            to: '/docs/start/mobile', // string
            from: '/docs/start',
          },
          {
            to: '/docs/guides/overview', // string
            from: '/docs/guides',
          },
          {
            to: '/docs/guides/tutorials/overview', // string
            from: '/docs/guides/tutorials',
          },
          {
            to: '/docs/guides/usages/overview', // string
            from: '/docs/guides/usages',
          },
          {
            to: '/docs/guides/features/overview', // string
            from: '/docs/guides/features',
          },
          {
            to: '/docs/apis/overview', // string
            from: '/docs/apis',
          },
          {
            to: '/docs/apis/commands/overview', // string
            from: '/docs/apis/commands',
          },
          {
            to: '/docs/apis/hooks/overview', // string
            from: '/docs/apis/hooks',
          },
          {
            to: '/docs/apis/runtime/overview', // string
            from: '/docs/apis/runtime',
          },
          {
            to: '/docs/apis/config/overview', // string
            from: '/docs/apis/config',
          },
        ],
      },
    ],
    function ModernjsPlugin() {
      // ...
      return {
        name: 'Modernjs-plugin',
        configureWebpack() {
          return {
            output: {
              publicPath:
                process.env.NODE_ENV !== 'development'
                  ? `//lf-cdn-tos.bytescm.com/obj/static/webinfra/modern-js-website/`
                  : '/',
            },
            resolveLoader: {
              alias: {
                '@site': require('path').resolve(__dirname),
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
    defaultLocale: 'zh-cn',
    locales: ['zh-cn'],
    localeConfigs: {
      'zh-cn': {
        label: '简体中文（中国）',
        direction: 'ltr',
      },
    },
  },
  ssrTemplate: `<!DOCTYPE html>
  <html <%~ it.htmlAttributes %>>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=0.86, maximum-scale=3.0, minimum-scale=0.86">
      <meta name="generator" content="Docusaurus v<%= it.version %>">
      <%~ it.headTags %>
      <% it.metaAttributes.forEach((metaAttribute) => { %>
        <%~ metaAttribute %>
      <% }); %>
      <% it.stylesheets.forEach((stylesheet) => { %>
        <link rel="stylesheet" href="//lf-cdn-tos.bytescm.com/obj/static/webinfra/modern-js-website/<%= stylesheet %>" />
      <% }); %>
      <% it.scripts.forEach((script) => { %>
        <link rel="preload" href="//lf-cdn-tos.bytescm.com/obj/static/webinfra/modern-js-website/<%= script %>" as="script">
      <% }); %>
    </head>
    <body <%~ it.bodyAttributes %> itemscope="" itemtype="http://schema.org/Organization">
      <%~ it.preBodyTags %>
      <div id="__docusaurus">
        <%~ it.appHtml %>
      </div>
      <% it.scripts.forEach((script) => { %>
        <script src="//lf-cdn-tos.bytescm.com/obj/static/webinfra/modern-js-website/<%= script %>"></script>
      <% }); %>
      <%~ it.postBodyTags %>
    </body>
  </html>`,
};
