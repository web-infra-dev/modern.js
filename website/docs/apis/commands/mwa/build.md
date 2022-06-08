---
sidebar_position: 5
---

```bash
Usage: modern build [options]

build application

Options:
  -c --config <config>  指定配置文件路径，可以为相对路径或绝对路径
  -h, --help  显示命令帮助
  --analyze   分析构建产物体积，查看各个模块打包后的大小
```

`modern build` 命令默认会在 `/dist` 目录下构建出可用于生产环境的产物。

可以通过修改配置 [`output.path`](/docs/apis/config/output/path) 指定产物的输出目录。

## 分析构建产物体积

执行 `npx modern build --analyze` 命令，可以在打包生产环境代码的同时，产出一个分析构建产物体积的 HTML 文件：

```
Bundle Analyzer saved report to /example/dist/report.html
File sizes after production build:

  122.35 KB  dist/static/js/885.1d4fbe5a.js
  2.3 KB     dist/static/js/main.4b8e8d64.js
  761 B      dist/static/js/runtime-main.edb7cf35.js
  645 B      dist/static/css/main.0dd3ecc1.css
```

手动在浏览器中打开上述 HTML 文件，可以看到打包产物的瓦片图，并进行包体积分析和优化：

<img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/mwa-build-analyze-8784f762c1ab0cb20935829d5f912c4c.png" />

> 该功能基于 [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) 实现。

## 命令行参数

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />

## Electron 应用

Modern.js 提供了基于 Electron 的桌面应用开发模式。

可以在项目创建时选择:

```bash
? 是否需要支持以下类型应用 Electron
```

也可在项目执行 `new` 命令启用「Electron」模式：

```bash
$ npx modern new
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用「Electron」模式
```

### build electron-web

```bash
Usage: modern build electron-web [options]

build electron renderer with node environment

Options:
  -h, --help  display help for command
```

窗口中开启 Node 时构建渲染进程。

#### 示例

```json
{
  "scripts": {
    "build:render": "modern build electron-web",
  }
}
```

在 Electron 中，项目下执行：`build:render` 命令，构建渲染进程（窗口中启用 Node）。

:::info 补充信息
关于窗口中【[开启 Node](/docs/guides/features/electron/develop#窗口中开启-node)】。
:::


### build electron-main

```bash
Usage: modern build electron-main [options]

build electron main process

Options:
  -d, --development       build with NODE_ENV=development
  -m, --main <main>       specify the entrance folder path of main process, such as: electron/
  -i, --ignore <ignore>   ignore folder or file
  -e, --extra <extra...>  specify extra folders to compile
  -en, --enableNode       enable use node in electron render
  -h, --help              display help for command
```

构建主进程。

#### 示例 - 普通构建

```json
{
  "scripts": {
    "build:main": "modern build electron-main",
  }
}
```

在 Electron 中，项目下执行：`build:main` 命令，构建主进程。

#### 示例 - 指定主进程目录

打包的时候，我们也可以通过 `--main` 指定我们的主进程目录。

```json
{
  "scripts": {
    "build:main": "modern build electron-main --main ./electron",
  }
}
```

#### 示例 - 指定其他编译目录
打包的时候，我们在主进程里引用了其他目录，则可以如下进行构建：

比如： 主进程使用了 shared 目录。

```bash

{
  "scripts": {
    "build:main": "modern build electron-main --extra ./shared",
  }
}
```

:::tip
由于主进程目前采用的是 babel 构建，维持主进程目录结构。因此，在构建起他目录的时候，需要通过 --extra 进行额外的指定。
:::

> 详细示例：[主进程构建](/docs/guides/features/electron/extra/compile-extra)

#### 示例 - 忽略不需要编译的文件
我们可以通过指定 “--ignore” 忽略不需要编译的文件。

```json
{
  "scripts": {
    "build:main": "modern build electron-main --ignore electron/xx.ts,electron/xxx.ts",
  }
}
```

:::info 补充信息
"--ignore" 也可以填写文件夹，多个可以逗号隔开。
:::

### build electron-app

```bash
Usage: modern build electron-app [options]

build electron app

Options:
  -h, --help  display help for command
```

打包应用。

#### 示例

```json
{
  "scripts": {
    "build:app": "modern build electron-app",
  }
}
```
在构建完成主进程、渲染进程之后，执行此命令，打包成可执行文件与安装程序。

:::info 补充信息
- 其中，可在执行打包时传入环境变量 `PLATFORM` 指定构建的操作系统。
- `PLATFORM` 可为 `mac`、`win32`、`win64`、`linux`、`linuxArm64` 其中一个。
:::

### build electron

```bash
Usage: modern build electron [options]

build electron all: render process、main process and electron app

Options:
  -d, --development       build with NODE_ENV=development
  -m, --main <main>       specify the entrance folder path of main process, such as: electron/
  -i, --ignore <ignore>   ignore folder or file
  -e, --extra <extra...>  specify extra folders to compile
  -en, --enableNode       enable use node in electron render
  -h, --help              display help for command

一行命令构建：渲染进程、主进程、应用。

```json
{
  "scripts": {
    "build:all": "modern build electron",
  }
}
```
通过上述命令，会顺序构建渲染进程、主进程，打包应用。

:::info 补充信息
- 其中，可在执行打包时传入环境变量 `PLATFORM` 指定构建的操作系统。
- `PLATFORM` 可为 `mac`、`win32`、`win64`、`linux`、`linuxArm64` 其中一个。
:::

#### 示例 -【DEBUG 模式】构建

有时候我们期望打一些 DEBUG 包，其中的 js 没有被混淆压缩，我们可以这样：

```json
{
  "scripts": {
    "build:all": "modern build electron --development",
  }
}
```

#### 示例-指定主进程目录

打包的时候，我们也可以指定我们的主进程目录。

```json
{
  "scripts": {
    "build:all": "modern build electron --main ./electron",
  }
}
```

#### 示例 - 启用 Node 构建渲染进程

```json
{
  "scripts": {
    "build:all": "modern build electron --enableNode",
  }
}
```

#### 示例-忽略不需要编译的文件

我们可以通过指定 “--ignore” 忽略不需要编译的文件。

```json
{
  "scripts": {
    "build:all": "modern build electron --ignore electron/xx.ts,electron/xxx.ts",
  }
}
```

:::info 补充信息
"--ignore" 也可以填写文件夹，多个可以逗号隔开。
:::
