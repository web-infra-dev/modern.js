---
sidebar_position: 2
---

## Introduction

There are two types of generator plugin:

- Extension: Web App(Npm Module) = Web App(Npm Module) + Generator Plugin

- Custom: New Application(Npm Module) = Web App(Npm Module) + Generator Plugin


In simpler terms, extension means using the original project name of Modern.js, while custom means creating a new name.

## Identifier

The type of generator plugin is provided through the `meta` field in `package.json`:

### Extension

```json title="package.json"
{
 "meta": {
    "extend": "mwa" // module
 }
}
```

### Custom

```json title="package.json"
{
 "meta": {
    "key": "new_app",
    "name": "new App",
    "type": "mwa" // module and custom
 }
}
```

:::info
For custom type, the `type` field supports the `custom` value, which utilizes some best practice templates for project development provided by Modern.js, such as `.gitignore`, `.editorConfig`, etc. Other business-related code templates need to be manually provided through generator plugin.
:::

# Creating Initial Project

### Extension

```bash
npx @modern-js/create@latest plugin --plugin @modern-js/generator-plugin-plugin
? Please select the type of project you want to create: Npm Module
? Please select the project scenario: 生成器插件
? Please fill in the package name of the generator plugin: plugin
? Please select the programming language: TS
? Please select the package manager: pnpm
? Please select the type of plugin: extend
? Please select the base type of the plugin: Web App
```

### 自定义

```bash
npx @modern-js/create@latest plugin --plugin @modern-js/generator-plugin-plugin
? Please select the type of project you want to create: Npm Module
? Please select the project scenario: 生成器插件
? Please fill in the package name of the generator plugin: plugin
? Please select the programming language: TS
? Please select the package manager: pnpm
? Please select the type of plugin: custom
? Please fill in the plugin keyword: new_app
? Please fill in the display name of the plugin: new App
? Please select the base type of the plugin: Web App
```

## Execution Order

Generator plugins support using multiple plugins at the same time, which means that multiple `--plugin` parameters are supported when executing `@modern-js/create`.

### Extension

For extension generator plugins, when executing with the declared generator plugin parameters, the corresponding lifecycle functions of the project scheme that is extended will be executed in order.

For example, if there are two generator plugins A and B, both of which extend the Modern.js application scheme. A plugin declares to add the `a.ts` file, and B plugin declares to add the `b.ts` file. When executing `npx @modern-js/create@latest --plugin A --plugin B`, and selecting the Web APP scheme, the default project files of the Web APP will be generated first. Then, the A plugin will create the `a.ts` file, and then the B plugin will generate the `b.ts` file.

### Custom

For custom generator plugins, only one plugin can be executed at a time. When declaring the `--plugin` parameter for `@modern-js/create`, a selection option for the scenario of choosing the project scheme will be added after selecting the project scheme, which is the new name defined in the `package.json`. Choosing the corresponding generator plugin for the name will execute the corresponding generator plugin logic after the default project scheme is completed. When declaring the `--plugin` parameter, the corresponding generator plugin names will be listed one by one for selection in the project scheme scenario.
