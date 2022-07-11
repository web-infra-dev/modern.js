export const ZH_LOCALE = {
  solution: {
    self: '请选择你想创建的工程类型',
    mwa: '应用',
    module: '模块',
    monorepo: 'Monorepo',
    custom: '自定义',
    default: '默认',
  },
  scenes: {
    self: '请选择项目场景',
  },
  sub_solution: {
    self: '请选择你想创建的工程类型',
    mwa: '应用',
    mwa_test: '应用（测试）',
    module: '模块',
    inner_module: '模块（内部）',
  },
  action: {
    self: '请选择你想要的操作',
    function: {
      self: '启用可选功能',
      tailwindcss: '启用 Tailwind CSS 支持',
      less: '启用 Less 支持',
      sass: '启用 Sass 支持',
      bff: '启用「BFF」功能',
      micro_frontend: '启用「微前端」模式',
      electron: '启用「Electron」模式',
      i18n: '启用「国际化（i18n）」功能',
      test: '启用「单元测试 / 集成测试」功能',
      e2e_test: '启用「E2E 测试」功能',
      doc: '启用「文档站」功能',
      storybook: '启用「Storybook」',
      runtime_api: '启用「Runtime API」',
      mwa_storybook: '启用「Visual Testing (Storybook)」模式',
      ssg: '启用「SSG」功能',
      polyfill: '启用「基于 UA 的 Polyfill」功能',
      deploy: '启用「部署」功能',
      proxy: '启用「全局代理」',
    },
    element: {
      self: '创建工程元素',
      entry: '新建「应用入口」',
      server: '新建「Server 自定义」源码目录',
    },
    refactor: {
      self: '自动重构',
      bff_to_app: 'BFF 切换框架模式',
    },
  },
  boolean: {
    yes: '是',
    no: '否',
  },
  language: {
    self: '请选择开发语言',
  },
  packageManager: {
    self: '请选择包管理工具',
  },
  runWay: {
    self: '是否需要支持以下类型应用',
    no: '不需要',
    electron: 'Electron',
  },
  needModifyConfig: {
    self: '是否需要调整默认配置?',
    enableLess: '是否启用 Less 支持?',
    enableSass: '是否启用 Sass 支持?',
  },
  entry: {
    name: '请填写入口名称',
    no_empty: '入口名称不能为空！',
    no_pages: '入口名称不支持 "pages"！',
    needModifyConfig: '是否需要调整默认配置?',
    disableStateManagement: '是否关闭「应用状态管理」功能?',
    clientRoute: {
      self: '请选择客户端路由方式',
      selfControlRoute: '启用自控路由',
      conventionalRoute: '启用约定式路由',
      no: '不启用',
    },
  },
  packageName: {
    self: '请填写项目名称',
    sub_name: '请填写子项目名称',
    no_empty: '项目名称不能为空！',
  },
  packagePath: {
    self: '请填写子项目目录名称',
    no_empty: '目录名称不能为空！',
    format:
      '目录名称只能使用小写字母、数字和分隔线（-）、下划线（_）和目录分隔符（/）',
  },
  framework: {
    self: '请选择运行时框架',
    egg: 'Egg',
    express: 'Express',
    koa: 'Koa',
    nest: 'Nest',
  },
  bff: {
    bffType: {
      self: '请选择 BFF 类型',
      func: '函数模式',
      framework: '框架模式',
    },
  },
  deploy: {
    cloud: {
      self: '默认使用框架内置的产品级 Web 服务器，是否调整？',
    },
    cdn: {
      self: '请选择 CDN 平台',
      oss: '阿里云 OSS',
      cos: '腾讯云 COS',
      no: '不使用 CDN',
    },
    lambda: {
      self: '请选择云函数平台',
      fc: '阿里云 FC',
      scf: '腾讯云 SCF',
      no: '不使用云函数部署',
    },
  },
};
