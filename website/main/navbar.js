module.exports = {
  logo: {
    alt: 'Modernjs Logo',
    src: 'https://lf-cdn-tos.bytescm.com/obj/static/webinfra/modern-js-website/assets/images/images/modernjs-logo.svg',
  },
  items: [
    {
      type: 'doc',
      docId: 'tutorials/foundations/introduction',
      position: 'left',
      label: '教程',
      category: 'tutorials',
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
      docId: 'configure/app/usage',
      activeBasePath: 'docs/configure',
      position: 'left',
      label: '配置',
      category: 'configure',
    },
    {
      type: 'doc',
      docId: 'apis/app/overview',
      activeBasePath: 'docs/apis',
      position: 'left',
      label: 'API',
      category: 'apis',
    },
    { to: '/blog', label: '博客', position: 'left', category: 'blog' },
    {
      href: 'https://github.com/modern-js-dev/modern.js',
      position: 'right',
      className: 'header-github-link',
      'aria-label': 'GitHub repository',
    },
    {
      type: 'localeDropdown',
      position: 'right',
    },
  ],
};
