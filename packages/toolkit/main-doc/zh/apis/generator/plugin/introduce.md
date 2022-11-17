---
sidebar_position: 1
---

# 介绍

Modern.js 支持通过生成器插件的方式对提供的工程方案进行定制化或针对工程方案进行特定场景的定制化。

## 生成器插件构成

生成器插件是一个模块，可以直接使用 Modern.js 的模块工程方案开发。当然，Modern.js 也提供了对应的生成器插件(`@modern-js/generator-plugin-plugin`)直接新建生成器插件项目。

一个生成器插件项目目录如下：

```bash
.
├── README.md
├── package.json
├── src
│   ├── index.ts
│   └── modern-app-env.d.ts
├── templates
└── tsconfig.json
```

`src/index.ts` 中为源码目录，用于开发生成器插件逻辑。插件默认导出一个函数，函数参数为 `context`，`context` 上提供一些方法可直接对当前项目进行操作，本章节后续将详细介绍这些方法。

`templates` 目录为模板目录，用于存在生成器插件中需要使用的模板文件。


## 生成器插件分类

生成器插件分为两种：

1. 扩展工程方案：直接对默认提供的三大工程方案进行定制化

2. 创建工程方案场景：基于默认的三大工程方案创建对应的工程方案场景

### 类型定义

生成器插件的分类通过 `package.json` 中的 `meta` 信息提供。

#### 扩展工程方案

```json
{
    "meta": {
        "extend": "mwa"
    }
}
```

`extend` 为扩展的工程方案名称，Modern.js 的工程方案名称分别为 `mwa`、`module`、 `monorepo`。

#### 创建工程方案场景

```json
{
    "meta": {
        "key": "new_solution",
        "name": "新工程方案",
        "type": "mwa"
    }
}
```

`key` 为场景方案名称，值为字符串。
`name` 为场景方案展示名称，用与使用时选项的展示，值为字符串。
`type` 为工程方案类型，除了和 `extend` 一样支持三种工程方案之外，还支持自定义(custom)类型。

### 自定义(custom)类型

自定义类型提供了完全自定义工程方案的实现能力，当使用该类型新建工程方案场景时，只提供了少量的开发层面的最佳实践的代码，比如 `.gitignore`、`.editorConfig` 等文件，具体为下方目录结构：

```
.
├── .editorconfig
├── .gitignore
├── .idea
│   ├── codeStyles
│   │   ├── Project.xml
│   │   └── codeStyleConfig.xml
│   ├── inspectionProfiles
│   │   └── Project_Default.xml
│   └── jsLinters
│       └── eslint.xml
├── .nvmrc
└── .vscode
    ├── extensions.json
    └── settings.json
```

自定义类型保证了可根据自身对工程方案的需求灵活进行配置。
