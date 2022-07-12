export const EN_LOCALE = {
  solution: {
    self: 'Please select the solution you want to create',
    mwa: 'MWA Solution',
    module: 'Module Solution',
    monorepo: 'Monorepo Solution',
    custom: 'Custom Solution',
    default: 'Default',
  },
  scenes: {
    self: 'Please select the scene you want to create',
  },
  sub_solution: {
    self: 'Please select the solution you want to create',
    mwa: 'MWA Solution',
    mwa_test: 'MWA Solution(Test)',
    module: 'Module Solution',
    inner_module: 'Module Solution(Inner)',
    monorepo: 'Monorepo Solution',
  },
  action: {
    self: 'Action',
    function: {
      self: 'Enable features',
      tailwindcss: 'Enable Tailwind CSS',
      less: 'Enable Less',
      sass: 'Enable Sass',
      bff: 'Enable BFF',
      micro_frontend: 'Enable Micro Frontend',
      electron: 'Enable Electron',
      i18n: 'Enable Internationalization (i18n)',
      test: 'Enable Unit Test / Integration Test',
      e2e_test: 'Enable E2E Test',
      doc: 'Enable Document Station',
      storybook: 'Enable Storybook',
      runtime_api: 'Enable Runtime API',
      mwa_storybook: 'Enable Visual Testing (Storybook)',
      ssg: 'Enable SSG',
      polyfill: 'Enable UA-based Polyfill Feature',
      deploy: 'Enable Deploy',
      proxy: 'Enable Global Proxy',
    },
    element: {
      self: 'Create project element',
      entry: 'New "entry"',
      server: 'New "Server Custom" source code directory',
    },
    refactor: {
      self: 'Automatic refactor',
      bff_to_app: 'Transform BFF to frame mode',
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
    self: 'Package Management Tool',
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
  runWay: {
    self: 'Do you need to support the following types of applications',
    no: 'Not Enabled',
    electron: 'Electron',
  },
  needModifyConfig: {
    self: 'Modify the Default Configuration?',
    enableLess: 'Enable Less?',
    enableSass: 'Enable Sass?',
  },
  entry: {
    name: 'Entry name',
    no_empty: 'The entry name cannot be empty!',
    no_pages: 'The entry name cannot be "pages"!',
    disableStateManagement: 'Disable App State Management?',
    clientRoute: {
      self: 'Client Routing',
      selfControlRoute: 'Enable Self Control Route',
      conventionalRoute: 'Enable Conventional Route',
      no: 'Not Enabled',
    },
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
  deploy: {
    cloud: {
      self: 'Modify the default Web Server?',
    },
    cdn: {
      self: 'Please select the cdn platform you want to use',
      oss: 'Aliyun OSS',
      cos: 'Tencent COS',
      no: 'Not Enabled',
    },
    lambda: {
      self: 'Please select the lambda you want to use',
      fc: 'Aliyun FC',
      scf: 'Tencent SCF',
      no: 'Not Enabled',
    },
  },
};
