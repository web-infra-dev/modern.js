# 使用 Webpack Inspector

Builder 内置了 [webpack inspector](https://github.com/modern-js-dev/webpack-inspector) 来辅助调试 webpack 构建问题。

## 介绍

由于 webpack 内部的工作流程比较黑盒，在使用 webpack 时，我们常常会遇到如下的一些问题:

- 在使用上层框架时，不知道最终生成的 webpack 配置包含哪些内容。
- 每个模块会经过不同的 loader 处理，经过各个 loader 的编译结果难以感知。
- 难以感知 webpack 各个编译环节 (比如 babel-loader、ts-loader) 的耗时情况。

为了更方便地进行 webpack 项目的错误排查、性能分析及 loader 开发，我们在 Builder 中内置了 [webpack inspector](https://github.com/modern-js-dev/webpack-inspector) 工具。

## 启用

你可以通过 [tools.inspector](/api/config-tools.html#tools-inspector) 配置项来开启 webpack inspector:

```ts
export default {
  tools: {
    inspector: {},
  },
};
```

为了避免 inspector 影响正常开发，建议配置仅在 DEBUG 时开启 inspector：

```ts
export default {
  tools: {
    inspector: process.env.DEBUG ? {} : undefined,
  },
};
```

添加以上配置后，当你执行 `DEBUG=true pnpm dev` 时，Builder 会在编译完成后启动 inspector，此时 Shell 中可以看到如下信息：

```shell
info    Starting dev server...

【Webpack Inspector】🔥 started at http://localhost:3333
```

打开 `http://localhost:3333` 地址，即可访问 inspector 的调试面板。

## 调试面板

Inspector 的调试面板提供了多种模式，你可以通过右上角的开关进行切换。

### 配置预览模式

面板的默认模式为配置预览模式。此模式下可以查看 webpack 内部所有的配置信息，配置对象可自由展开和折叠:

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/39248c0f-b1cd-4ea5-b522-3ebba7569497.png)

### 列表模式

此模式下会展示出所有的模块信息:

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/8ff3bba0-7824-43b3-996f-7a3b5d2c4f59.png)

点击列表项会出现模块的编译详情信息:

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/output.png)

### Loader 统计数据

点击如下的开关，可以查看 Loader 的统计数据:

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/c0697cd6-963f-4169-8dc3-dc178641a861.png)

### 依赖图模式

此模式下会展示出所有模块的依赖关系：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/9ee30176-e993-4638-83d0-add14484b1b2.png)

点击图中的节点也会呈现具体模块的编译详情：

![](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/6f4b6cc7-94c8-446a-8b64-86ca98fbdca7.png)

:::tip
出于性能考虑，模块数量 > 100 时不会展示依赖图。
:::
