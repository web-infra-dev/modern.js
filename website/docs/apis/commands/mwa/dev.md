---
sidebar_position: 1
---

# dev

```bash
Usage: modern dev [options]

本地开发命令

Options:
  -e --entry <entry>    指定入口，编译特定的页面
  -c --config <config>  指定配置文件路径，可以为相对路径或绝对路径
  -h, --help            显示命令帮助
  --analyze             分析构建产物体积，查看各个模块打包后的大小
  --api-only            仅启动 API 接口服务
```

`modern dev` 命令启动一个开发服务器，同时监听源文件变化，默认支持 React Fast Refresh：

```bash
App running at:

  > Local:    http://localhost:8080/
  > Network:  http://192.168.0.1:8080/
```

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />

## Electron 应用开发

Modern.js 提供了基于 Electron 的桌面应用开发模式。

可以在项目创建时选择：

```bash
? 是否需要支持以下类型应用 Electron
```

也可在项目执行 `new` 命令启用「Electron」模式：

```bash
$ npx modern new
? 请选择你想要的操作 启用可选功能
? 启用可选功能 启用「Electron」模式
```

### dev electron-web

窗口中开启 Node 启动渲染进程。

```bash
Usage: modern dev electron-web [options]

Options:
  -h, --help  display help for command
```

#### 示例

```json
{
  "scripts": {
    "dev:render": "modern dev electron-web",
  }
}
```

在 Electron 中，项目下执行：`dev:render` 命令，启动渲染进程（**窗口中开启 Node**）。

:::info 补充信息
关于窗口中【[开启 Node](/docs/guides/features/electron/develop#窗口中开启-node)】。
:::

### dev electron-main

启动主进程。

```bash
Usage: modern dev electron-main [options]

Options:
  -e, --entry <entry>
  -h, --help           display help for command
```

#### 示例 - 普通启动主进程

```json
{
  "scripts": {
    "dev:main": "modern dev electron-main",
  }
}
```

在 Electron 中，项目下执行：`dev:main` 命令，启动主进程。


#### 示例 - 指定主进程入口文件地址


```json
{
  "scripts": {
    "dev:main": "modern dev electron-main --entry xx/xx.ts",
  }
}
```


### dev electron

先启动渲染进程，再启动主进程。

```bash
Usage: modern dev electron [options]

Options:
  -en, --enableNode    enable use node in electron render
  -e, --entry <entry>  specify the entry path of main process such as: xx/xx.ts(js)
  -h, --help           display help for command
```

#### 示例 - 普通启动

```json
{
  "scripts": {
    "dev:electron": "modern dev electron",
  }
}
```

在 Electron 中，项目下执行：`dev:electron` 命令，会先启动渲染进程，再启动主进程。

#### 示例 - 窗口中开启 Node

如果期望启动渲染进程的时候，在窗口中开启 Node，可以这样：

```json
{
  "scripts": {
    "dev:electron": "modern dev electron --enableNode",
  }
}
```

#### 示例 - 主进程启动时指定入口文件

```json
{
  "scripts": {
    "dev:electron": "modern dev electron --entry xx/xx.ts",
  }
}
```

