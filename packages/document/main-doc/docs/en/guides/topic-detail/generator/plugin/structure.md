---
sidebar_position: 1
---

# Introduction and Project Creation

## Introduction

Modern.js provides engineering solutions such as Web App and Npm Module. By using the `@modern-js/create` tool, you can create initial project templates for engineering solutions. The initial project template provides a basic code development environment, simple example code, and configuration, etc.

The initial templates provided by Modern.js are generic and can meet some common project development needs.

When you use Modern.js deeply, you will inevitably find that each created project will make some specific similar changes for its own project, such as modifying example code, adding some configurations, enabling certain features, etc.

Generator plugin can help you to deposit these specific changes for individuals or teams. When running `npx @modern-js/create@latest`, you only need to simply add the `--plugin` parameter to avoid repetitive modification of the project after each project creation.

Generator plugin is based on the initial template projects provided by Modern.js, providing methods to add, delete, and modify templates, and modifying `package.json`, `modernConfig` configurations, and enabling features through a convenient way.

## Create Project

Use `@modern-js/create` to create a generator plugin project directly:

```bash
npx @modern-js/create@latest plugin --plugin @modern-js/generator-plugin-plugin
? Please select the type of project you want to create: Npm Module
? Please select the project scenario: Generator Plugin
? Please fill in the package name of the generator plugin: plugin
? Please select the programming language: TS
? Please select the package manager: pnpm
? Please select the type of plugin: extend
? Please select the base type of the plugin: Web App
```

After creating, we can take a look at the directory structure of this project:

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

The project is based on the Npm module project, and the core files are as follows:

```bash
*
├── package.json
├── src
│   └── index.ts
├── templates
│   └── .gitkeep
```

## package.json

In addition to the normal fields of a module project, `package.json` provides a `meta` field to describe information about the generator plugin.

Generator plugin is divided into two categories: extension and custom. For specific classification definitions, please refer to [Type](/guides/topic-detail/generator/plugin/category).

```json title="package.json"
{
  ...,
  "meta": {
    "extend": "mwa"
  }
}
```

## src/index.ts

This file is used to complete the content development of the generator plugin.

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

This file exports a function by default, and the function takes `context` as a parameter. The `context` object provides API methods supported by the generator plugin, which can be used to implement the logic of the generator plugin. The capabilities provided by `context` can be found in [context](/guides/topic-detail/generator/plugin/context).

## templates

The `templates` directory contains template files for the current customization method, supporting [Handlebars](https://handlebarsjs.com/) and [EJS](https://ejs.co/) formats. Different rendering engines will be used for rendering according to the template file suffix. If there is no suffix, the template file will be copied directly to the target directory.

If the template file is a `js`, `ts`, or `json` file, it is recommended to use the `.handlebars` or `.ejs` suffix directly to avoid project eslint errors and recognition issues in Monorepo projects.

The `.gitignore` and `.npmrc` files in the template will be automatically deleted when publishing the npm package, so it is necessary to use the `.handlebars` or `.ejs` suffix to keep them.
