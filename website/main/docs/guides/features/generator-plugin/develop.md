---
sidebar_position: 3
---

# 如何开发生成器插件

## 创建项目

Modern.js 提供了创建生成器插件项目的生成器插件用于创建项目，可直接执行以下命令创建:

```bash
npx @modern-js/create plugin --plugin @modern-js/generator-plugin-plugin
```

插件类型不同，会提问不同的问题，可根据需求选择插件类型

### 扩展类型

```
? 请选择你想创建的工程类型 模块
? 请选择项目场景 生成器插件
? 插件包名 plugin
? 请选择开发语言 TS
? 请选择包管理工具 pnpm
? 插件类型 扩展
? 插件基础类型 应用
```

### 自定义类型

```
? 请选择你想创建的工程类型 模块
? 请选择项目场景 生成器插件
? 插件包名 plugin
? 请选择开发语言 TS
? 请选择包管理工具 pnpm
? 插件类型 自定义
? 插件关键字 mobile-app
? 插件展示名称 移动应用
? 插件基础类型 应用
```

创建项目命令执行完成后，会对应的生成一个开发生成器插件的项目，`package.json` 中也会根据你的选择对应的生成 `meta` 信息。

:::info
生成器插件开发可参考 `@modern-js/generator-plugin-plugin` [源码地址](https://github.com/modern-js-dev/modern.js/tree/main/packages/generator/plugins/generator-plugin)
:::

## 开发插件逻辑

在 `src/index.ts` 中完成插件逻辑开发。

插件默认导出一个函数，函数参数为 `context`，`context` 上提供一些方法可直接对当前项目进行操作。

简单介绍一下提供的方法，完整的 API 列表可查看[生成器插件API](/docs/apis/generator/plugin/introduce)。

### 自定义输入

- addInputBefore

在默认的输入前添加输入，比如在`选择包管理工具`问题前添加问题，具体 Modern.js 每个问题的配置可查看[生成器配置](/docs/apis/generator/config/introduce)。

```ts
context.addInputBefore('packageManager', {
    key: 'test',
    name: '测试输入',
    type: 'input'
})
```

- setInput

设置已经存在问题的属性

```ts
context.setInput('test', 'type', 'radio')
context.setInput('test', 'options', [{ key: 'option1', name: '选项一' }])
```

### onForged

工程方案类型文件相关操作执行完成后钩子，多个扩展产检将按照 `plugin` 参数顺序依次执行其 `onForged` 函数。

`onForged` 参数是一个回调函数，函数参数为 `api` 和 `input`。

`api` 上会提供一些文件操作相关的方法，可在该钩子中对当前的模板文件进行操作。

`input` 为当前用户输入，可用于获取用户当前的输入信息及配置信息。

当需要新的模板文件时，可直接在 `templates` 目录添加，在 `onForged` 函数中可直接对 `templates` 目录文件进行操作，比如下方的 `addFile` 中 `templateFile` 参数就为 `templates` 目录下的文件。这里不需要显示的声明 `templates`，直接写相对于 `templates` 的相对路径即可。

`onForged` 中支持的 API 函数也可参考 [生成器插件API](/docs/apis/generator/plugin/hook/onForged)。

```ts
context.onForged(async (api: ForgedAPI, input: Record<string, unknown>) => {
    const { language } = input;
    api.addFile({
        type: FileType.Text,
        file: `src/index.${language as string}`,
        templateFile: `index.${language as string}.handlebars`,
        force: true,
    });
})
```

### afterForged

`onForged` 函数执行完成后钩子，这里主要可进行安装依赖，Git 操作等。

如果你的工程方案是基于 Modern.js 提供的三种工程方案进行的，这个钩子函数是可以不需要的。默认的工程方案中会自动包含安装依赖、提交代码逻辑。

生成器插件还支持了一种自定义的 `custom` 类型，这种类型只提供了少量的开发层面的最佳实践的代码，比如 `.gitignore`、`.editorConfig` 等文件，这时则需要在 `afterForged` 函数中手动补充安装依赖和 Git 操作逻辑。

`afterForged` 参数也是一个回调函数，函数参数为 `api` 和 `input`。

`api` 上会提供一些 npm、Git 等方法，可在该钩子中进行安装依赖，Git 操作。

`input` 为当前用户输入，可用于获取用户当前的输入信息及配置信息。

`afterForged` 中支持的 API 函数也可参考 [生成器插件API](/docs/apis/generator/plugin/hook/afterForged)。
