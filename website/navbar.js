module.exports = {
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
      category: 'start',
    },
    {
      type: 'doc',
      docId: 'guides/overview',
      position: 'left',
      label: '指南',
      category: 'guides',
    },
    {
      type: 'doc',
      docId: 'apis/overview',
      position: 'left',
      label: 'API',
      category: 'apis',
      secondnav: [
        {
          label: '模块工程',
          url: '/docs/apis/module/overview',
          key: 'module',
        },
        {
          label: '应用工程',
          url: '/docs/apis/app/overview',
          key: 'app',
        },
        {
          label: 'Monorepo工程',
          url: '/docs/apis/monorepo/overview',
          key: 'monorepo',
        },
        {
          label: '项目生成器',
          url: '/docs/apis/generator/overview',
          key: 'generator',
        },
      ],
    },
    { to: '/blog', label: '博客', position: 'left', category: 'blog' },
    {
      to: '/coming-soon',
      label: '社区',
      position: 'left',
      category: 'coming-soon',
    },
    {
      href: 'https://github.com/modern-js-dev/modern.js',
      position: 'right',
      className: 'header-github-link',
      'aria-label': 'GitHub repository',
    },
  ],
};
