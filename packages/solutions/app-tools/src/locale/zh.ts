export const ZH_LOCALE = {
  command: {
    shared: {
      analyze: '分析构建产物体积，查看各个模块打包后的大小',
      config: '指定配置文件路径，可以为相对路径或绝对路径',
      skipBuild: '跳过构建阶段',
      noNeedInstall: '无需安装依赖',
    },
    dev: {
      describe: '启动开发服务器',
      entry: '指定入口，编译特定的页面',
      apiOnly: '仅启动 API 接口服务',
      webOnly: '仅启动 Web 服务',
      selectEntry: '请选择需要构建的入口',
      requireEntry: '请至少选择一个入口',
    },
    build: {
      describe: '构建生产环境产物',
      watch: '开启 watch 模式, 监听文件变更并重新构建',
    },
    serve: { describe: '启动生产环境服务' },
    deploy: { describe: '部署应用' },
    new: {
      describe: 'Web App 项目中执行生成器',
      debug: '开启 Debug 模式，打印调试日志信息',
      config: '生成器运行默认配置(JSON 字符串)',
      distTag: '生成器使用特殊的 npm Tag 版本',
      registry: '生成器运行过程中定制 npm Registry',
      lang: '设置 new 命令执行语言(zh 或者 en)',
    },
    inspect: {
      env: '查看指定环境下的配置',
      output: '指定在 dist 目录下输出的路径',
      verbose: '在结果中展示函数的完整内容',
    },
    info: {
      describe: '展示项目信息',
    },
  },
};
