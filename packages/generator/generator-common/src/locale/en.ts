export const EN_LOCALE = {
  solution: {
    self: 'Please select the type of project you want to create:',
    mwa: 'Web App',
    module: 'Npm Module',
    doc: 'Doc Site',
    monorepo: 'Monorepo',
    custom: 'Custom Solution',
    default: 'Default',
  },
  scenes: {
    self: 'Please select the project scenario:',
  },
  sub_solution: {
    self: 'Please select the type of project you want to create:',
    mwa: 'Web App',
    mwa_test: 'Web App (Test)',
    module: 'Npm Module',
    inner_module: 'Npm Module (Inner)',
    monorepo: 'Monorepo',
  },
  action: {
    self: 'Please select the operation you want:',
    function: {
      self: 'Enable Features',
      question: 'Please select the name of feature:',
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
      self: 'Create Element',
      question: 'Please select the type of element to create:',
      entry: 'New "entry"',
      server: 'New "Custom Web Server" source code directory',
    },
    refactor: {
      self: 'Automatic Refactor',
      question: 'Please select the type of refactoring:',
      react_router_5: 'Use React Router v5',
    },
  },
  boolean: {
    yes: 'Yes',
    no: 'No',
  },
  language: {
    self: 'Please select the development language:',
  },
  packageManager: {
    self: 'Please select the package management tool:',
  },
  entry: {
    name: 'Please fill in the entry name:',
    no_empty: 'The entry name cannot be empty!',
    no_pages: 'The entry name cannot be "pages"!',
  },
  packageName: {
    self: 'Please fill in the project name:',
    sub_name: 'Please fill in the sub-project name:',
    no_empty: 'The package name cannot be empty!',
  },
  packagePath: {
    self: 'Please fill in the sub-project directory name:',
    no_empty: 'The package path cannot be empty!',
    format:
      'Only lowercase letters, numbers and delimiters (-), and underscore (_), and directory delimiters (/) can be used in package path.',
  },
  framework: {
    self: 'Please select the framework:',
    egg: 'Egg',
    express: 'Express',
    koa: 'Koa',
    nest: 'Nest',
  },
  bff: {
    bffType: {
      self: 'Please select the BFF type:',
      func: 'Function',
      framework: 'Framework',
    },
  },
  buildTools: {
    self: 'Please select the bundler tool:',
    webpack: 'webpack',
    rspack: 'Rspack (experimental)',
  },
};
