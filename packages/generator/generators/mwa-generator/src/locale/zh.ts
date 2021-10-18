export const ZH_LOCALE = {
  get_packages_error: '获取包列表失败，请检查环境后重试',
  success: `创建成功！
可在新项目的目录下运行以下命令：
{packageManager} dev          # 按开发环境的要求，运行和调试项目
{packageManager} build        # 按产品环境的要求，构建项目
{packageManager} start        # 按产品环境的要求，运行项目
{packageManager} lint         # 检查和修复所有代码
{packageManager} new          # 继续创建更多项目要素，比如应用入口`,
  electron: {
    success: `
{packageManager} dev:electron # 按开发环境的要求，启动 Electron
{packageManager} build:electron # 按产品环境的要求，构建 Electron 项目
`,
  },
};
