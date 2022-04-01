---
sidebar_position: 2
---

# 项目创建

`@modern-js/create` 是 Modern.js 提供的项目生成器工具，我们可以通过该工具来初始化可复用模块项目。

## 创建工具库类型的项目

`@modern-js/create` 默认支持工具库类型的可复用模块项目的生成。我们可以首先执行以下命令来启动项目生成器程序：

```
npx @modern-js/create tools-lib
```

:::info 注
tools-lib 是创建项目的目录名称。
:::

在执行该命令后，会看到一系列的提问和选项，我们按照如下进行选择：

``` md
? 请选择你想创建的工程类型 模块
? 请填写项目名称 tools-lib
? 请选择开发语言 TS
? 请选择包管理工具 pnpm
? 是否需要调整默认配置? 否
```

选择成功后，便开始初始化项目并安装依赖。当整个创建流程结束后，你会看到：

```
[INFO] 依赖自动安装成功
[INFO] git 仓库初始化成功
[INFO] 创建成功！
pnpm run dev          # 运行和调试组件
pnpm run build        # 按照社区规范和最佳实践，生成构建产物
pnpm run lint   # 检查和修复所有代码
pnpm run change       # 添加变更集
pnpm run bump         # 生成发版相关的修改，比如更新版本号、生成changelog
pnpm run new          # 继续创建更多项目要素
[INFO] 你可以执行 'cd tools-lib' 进入目录
```

此时打开项目可以看到初始化后的项目目录结构如下：

```
.
├── .changeset
├── .vscode
├── node_modules
├── src
├── tests
├── .editorconfig
├── .gitignore
├── .npmrc
├── .nvmrc
├── modern.config.js
├── package.json
├── pnpm-lock.yaml
├── README.md
└── tsconfig.json
```

其中 `src` 目录用于存放工具库的源代码，`tests` 目录用于存放测试代码。

:::info 补充信息
关于其他目录与文件的用途和解释，请阅读 [文件约定——模块工程方案](/docs/apis/hooks/module/src/index)
:::

此时我们成功创建了一个工具库类型的可复用模块项目。

## 可复用模块 —— UI 组件

可复用模块中除了工具库类型以外，使用最多的就是 UI 组件类型的可复用模块。接下来讲一下如何将默认创建的工具库类型项目转换为 UI 组件类型项目。

### 准备工作

首先同工具库类型项目的创建方式一样，只需要将「请填写项目名称」这一项填写合适的名称即可。

此时 `src` 目录变成了可以用于编写组件源码的地方，而 `test` 目录变成了可以用于测试组件源码的地方。

然后我们可以将默认的 `src/index.ts` 文件重命名为 `src/index.tsx` 文件，这样就可以编写 JSX 代码了。这里我们提供了一段默认的组件代码，你可以选择替换默认的 `src/index.ts` 文件的内容：

``` tsx
export default function () {
  return <div>This is a UI Component</div>;
}
```

同样我们也需要将 `tests/index.test.ts` 文件重命名为 `tests/index.test.tsx` 文件，这里也提供了可选的替换默认测试文件的代码：

``` tsx
import { render, screen } from '@modern-js/runtime/testing';

import Component from '@/index';

describe('默认值 cases', () => {
  test('Rendered', () => {
    render(<Component />);
    expect(screen.getByText('This is a UI Component')).toBeInTheDocument();
  });
});
```

> 其中别名 "@" 是项目默认支持的。

### 增加 `styles` 目录

UI 组件项目开发中需要进行样式代码的编写，Modern.js 不仅支持在目录 `src` 内部编写样式，同时也支持在项目下的 `styles`
目录里进行样式的编写。因此可以选择性的创建 `styles` 目录。

:::info 补充信息
关于在 `src` 里编写样式与在 `styles` 编写样式的区别，可以阅读 [如何开发样式](/docs/guides/features/modules/code-style)。在了解后，可以选择是否需要创建 `styles` 目录。
:::

### 创建成功

此时你已经成功的将工具库类型的可复用模块项目转换为 UI 组件类型。你可以在 `src` 目录下进行 React 代码的开发，可以在 `src`、`styles` 目录下进行 CSS、LESS、SASS、SCSS 样式代码的开发了。

## 可复用模块 —— 业务模型

业务模型类型的可复用模块项目是专门用于开发状态管理相关功能的工具库。

因此首先同工具库类型创建项目的方式一样，使用 `@modern-js/create` 进行初始化项目。

Modern.js 集成了主流的状态管理解决方案，它通过 `@modern-js/runtime` 模块提供，在 Modern.js 中推荐使用它进行状态管理、业务模型相关功能的开发。在可复用模块项目中，可以直接使用 `@modern-js/runtime` 进行业务模型的开发，因此我们需要新增 `@modern-js/runtime` 依赖：

```
pnpm add @modern-js/runtime
```

:::info 注
推荐通过使用微生成器来启用 Runtime API，微生成器的使用可以参考 [使用微生成器](/docs/guides/features/modules/micro-generator)。
:::

至此我们成功创建了业务模型类型的可复用模块项目。
