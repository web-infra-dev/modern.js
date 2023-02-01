---
sidebar_position: 2
---

# 深入理解 dev 命令

模块工程提供的 `dev` 命令主要用于代码的调试。

## 命令运行的整体流程

1. 当执行 `dev` 命令的时候，Module Tools 开始寻找是否存在可以执行的调试工具或者任务。调试工具或者任务就是类似 Storybook 这样的 Module Tools 调试工具插件。
2. 当发现存在一个调试工具的时候，则会立即执行它。
3. 当发现多个调试工具的时候，则显示调试工具列表菜单。可以通过选择某个调试工具对应的名称选项启动它。
4. 当没有发现调试工具的时候，则告诉用户没有可用的调试工具。

我们除了可以执行 `dev` 命令以外，也可以通过 `dev [调试工具名称]` 的方式来直接启动调试工具或者任务。

在执行 `dev` 命令的时候，调试工具可以选择是否在启动之前执行代码构建的监听模式，例如 Storybook 调试工具就开启了该功能。

## Storybook

Storybook 是目前模块工程官方提供的 Module Tools 调试工具插件。

上面我们说到 Storybook 在启动之前会执行监听模式的源码构建任务，因此在终端里你会看到 Storybook 和源码构建的日志信息同时出现。并且在更新源码后会触发构建产物的变化，当构建产物变化的时候也会触发 Storybook 热更新。

## 扩展 dev 命令

如果需要扩展 dev 命令或者说提供自己的 Module Tools 调试工具插件，那么你需要先了解以下内容：

* [开发插件](plugins/guide/getting-started)
* [调试工具插件 API](/api/plugin-api/plugin-hooks#调试钩子)

一般来说，实现一个什么都不做的调试工具，其实现代码以及相关配置如下：

``` ts do-nothing.ts
export default (): CliPlugin<ModuleTools> => ({
  name: 'do-nothing',
  setup() {
    return {
      registerDev() {
        return {
          // 调试工具名称
          name: 'do-nothing',
          // 菜单显示内容
          menuItem: {
            name: 'DoNothing',
            value: 'do-nothing',
          },
          // 定义的 dev 子命令
          subCommands: ['donothing', 'dn'],
          async action() {
            // dev logic
            console.info('Run build --watch, and do nothing.');
          },
        };
      },
    };
  },
});
```

如果需要使用该调试工具插件，则需要在配置文件中增加它：

``` ts
import doNothingPlugin from './plugins/do-nothing';

export default defineConfig({
  plugins: [
    //..
    doNothingPlugin()
  ],
});
```

此时我们执行 `dev` 或者 `dev do-nothing` 命令的时候，就可以执行它了。在执行后，它会先执行监听模式的源码构建任务，并紧接着打印日志信息。

对于目前官方支持的调试工具和第三方支持的调试工具，可以在[插件列表](plugins/official-list/overview)中查看。
