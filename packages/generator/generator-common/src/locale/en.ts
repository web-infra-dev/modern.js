export const EN_LOCALE = {
  solution: {
    self: 'Please select the solution you want to create',
    mwa: 'Web App',
    module: 'Npm Module',
    monorepo: 'Monorepo',
    custom: 'Custom Solution',
    default: 'Default',
  },
  scenes: {
    self: 'Please select the scene you want to create',
  },
  sub_solution: {
    self: 'Please select the solution you want to create',
    mwa: 'Web App',
    mwa_test: 'Web App (Test)',
    module: 'Npm Module',
    inner_module: 'Npm Module (Inner)',
    monorepo: 'Monorepo',
  },
  action: {
    self: 'Action',
    function: {
      self: 'Enable features',
      tailwindcss: 'Enable Tailwind CSS',
      bff: 'Enable BFF',
      micro_frontend: 'Enable Micro Frontend',
      i18n: 'Enable Internationalization (i18n)',
      test: 'Enable Unit Test / Integration Test',
      e2e_test: 'Enable E2E Test',
      doc: 'Enable Document Station',
      storybook: 'Enable Storybook',
      runtime_api: 'Enable Runtime API',
      mwa_storybook: 'Enable Visual Testing (Storybook)',
      ssg: 'Enable SSG',
      polyfill: 'Enable UA-based Polyfill Feature',
      proxy: 'Enable Global Proxy',
      swc: 'Enable SWC Compile',
      rspack: 'Enable Rspack Build (experimental)',
    },
    element: {
      self: 'Create project element',
      entry: 'New "entry"',
      server: 'New "Custom Web Server" source code directory',
    },
    refactor: {
      self: 'Automatic refactor',
      react_router_5: 'Use React Router v5',
    },
  },
  boolean: {
    yes: 'Yes',
    no: 'No',
  },
  language: {
    self: 'Development Language',
  },
  packageManager: {
    self: 'Package Manager',
  },
  packageName: {
    self: 'Package Name',
    sub_name: 'Package Name',
    no_empty: 'The package name cannot be empty!',
  },
  packagePath: {
    self: 'Package Path',
    no_empty: 'The package path cannot be empty!',
    format:
      'Only lowercase letters, numbers and delimiters (-), and underscore (_), and directory delimiters (/) can be used in package path.',
  },
  entry: {
    name: 'Entry name',
    no_empty: 'The entry name cannot be empty!',
    no_pages: 'The entry name cannot be "pages"!',
  },
  framework: {
    self: 'Please select the framework you want to use',
    egg: 'Egg',
    express: 'Express',
    koa: 'Koa',
    nest: 'Nest',
  },
  bff: {
    bffType: {
      self: 'BFF Type',
      func: 'Function',
      framework: 'Framework',
    },
  },
  buildTools: {
    self: 'Bundler',
    webpack: 'webpack',
    rspack: 'Rspack (experimental)',
  },
};
