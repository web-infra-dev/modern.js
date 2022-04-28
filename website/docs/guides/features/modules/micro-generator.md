---
sidebar_position: 3
---

# 使用微生成器

Modern.js 对于新创建的可复用模块项目提供了最小的功能集合，这样做的目的是为了减少项目中不必要的依赖。当默认提供的功能不能满足开发需求的时候，我们可以通过 Modern.js 提供的微生成器功能来开启其他功能。

在可复用模块项目中，你可以在项目根目录下通过下面的命令来启动微生成器功能：

```
pnpm run new
```

当执行后，可以根据问题和选项进行选择从而开启相应功能。

``` md
? 请选择你想要的操作 (Use arrow keys)
❯ 启用可选功能
```

目前可复用模块项目支持通过微生成器开启以下功能：

- 启用 Less 支持
- 启用 Sass 支持
- 启用 「Storybook」
- 启用 「Runtime API」

:::info 补充信息
在编写样式的过程中，可以通过 “启用 Less 支持”、“启用 Sass 支持” 选项开启对 Less、Sass 代码的处理功能。关于如何开发样式，可以阅读 [开发样式](/docs/guides/features/modules/code-style)。
:::

:::info 补充信息
启用 「Storybook」可以进行 Storybook 调试，关于如何使用 Storybook 调试，可以阅读 [Storybook 调试](/docs/guides/features/modules/storybook)。
:::

:::info 补充信息
在创建「业务模型」类型的项目过程中，推荐通过 “启用 「Runtime API」” 来新增 `@modern-js/runtime`。
:::
