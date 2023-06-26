---
sidebar_position: 1
---

# 介绍及创建项目

## 介绍

Modern.js 提供了 Web 应用、Npm 模块等工程方案，并通过使用 `@modern-js/create` 工具可以创建工程方案的初始项目模板，初始项目模板会提供基本的代码开发环境、简单的示例代码及配置等。

Modern.js 提供的初始化模板具有通用性，能满足一些通用的项目开发需求。

当你深度使用 Modern.js 时，必然会发现每次创建的项目都会进行一些针对自身项目的特定的相似改动，比如修改示例代码、增加一些配置、开启某些功能等。

生成器插件可以帮你将这些针对个人或团队特定的改动沉淀下来，在执行 `npx @modern-js/create@latest` 只需简单的带上 `--plugin` 参数即可避免每次创建完项目都需重复性修改项目的工作。

生成器插件是在 Modern.js 提供的初始化模板项目的基础上，提供对模板进行增加、删除、修改的方法，并通过快捷的方式修改 `package.json`、`modernConfig` 配置和开启功能等操作。

## 创建项目

使用 `@modern-js/create` 可直接创建生成器插件项目：

```bash
npx @modern-js/create@latest plugin --plugin @modern-js/generator-plugin-plugin
? 请选择你想创建的工程类型 Npm 模块
? 请选择项目场景 生成器插件
? 请输入生成器插件插件包名 plugin
? 请选择开发语言 TS
? 请选择包管理工具 pnpm
? 请选择插件类型 extend
? 请选择插件基础类型 Web 应用
```

创建完成后，我们可以看一下这个项目的目录结构：

```bash
.
├── .changeset
│   └── config.json
├── .eslintrc.js
├── .gitignore
├── .npmrc
├── .nvmrc
├── .prettierrc
├── README.md
├── modern.config.ts
├── package.json
├── src
│   ├── modern-app-env.d.ts
│   └── index.ts
├── templates
│   └── .gitkeep
└── tsconfig.json
```

项目是基于 Npm 模块项目创建的，核心是下面几个文件：

```bash
*
├── package.json
├── src
│   └── index.ts
├── templates
│   └── .gitkeep
```

## package.json

`package.json` 中除了正常的模块项目的字段外，提供了 meta 字段，用于描述生成器插件的信息。

生成器插件分为两类：扩展和自定义，具体分类定义可查看[类型](/guides/topic-detail/generator/plugin/category)。

```json title="package.json"
{
  ...,
  "meta": {
    "extend": "mwa"
  }
}
```

## src/index.ts

该文件用于完成生成器插件的内容开发。

```js
import { IPluginContext, ForgedAPI } from '@modern-js/generator-plugin';

export default function (context: IPluginContext) {
  context.onForged(async (_api: ForgedAPI, _input: Record<string, unknown>) => {
    /**
     * todo
     */
  });
}
```

该文件默认导出一个函数，函数参数为 `context`，`context` 上提供了生成器插件支持的 API 方法，可用于实现生成器插件的逻辑。`context` 提供的能力可以参考 [context](/guides/topic-detail/generator/plugin/context)。

## templates

`templates` 目录存在当前定制化方式的模板文件，支持 [Handlebars](https://handlebarsjs.com/) 和 [EJS](https://ejs.co/) 格式，将根据模板文件后缀使用不同的渲染引擎就行渲染，如果无后缀，将会直接复制模板文件到目标目录。

如果模板文件为 `js`、`ts` 或者 `json` 文件，推荐直接使用 `.handlebars` 或者 `.ejs` 后缀，可避免项目 eslint 报错和在 Monorepo 中项目识别问题。

模板中 `.gitignore` 文件和 `.npmrc` 文件在发布 npm 包时会自动删除，需要使用 `.handlebars` 或者 `.ejs` 后缀将其保留。
