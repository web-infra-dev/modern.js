---
sidebar_label: builder
sidebar_position: 1
---

# electron.builder

:::info 适用的工程方案
* Modern.js MWA
:::

* 类型: `Object`
* 默认值： `{}`

应用构建相关配置。

:::tip 提示
我们对 Electron-builder 的配置本身做了一个简单的整合：
- 对于所有平台（mac、win、linux）通用的 Electron-builder 配置，我们放到：`baseConfig`下。
- 对于不同平台各自特有的配置，我们分别在对应的 key 下配置即可。
- 每一个 key 下面对应的，都是 Electron-builder 本身的配置， 详细可见：[Electron Builder](https://www.electron.build/configuration/configuration)。

最后，我们会根据这些配置，再结合框架内部默认的一些用户不需要改的配置（若需要修改，则直接配置就可覆盖），进行合并成最终
Electron-builder 的配置。
:::

## `electron.builder.baseConfig`

* 类型: `Object`
* 默认值： `{}`

对应 [Electron Builder](https://www.electron.build/configuration/configuration) 的配置，所有操作系统公用配置。

## `electron.builder.macConfig`

* 类型: `Object`
* 默认值： `{}`

对应 [Electron Builder](https://www.electron.build/configuration/mac) 的配置，Mac 相关构建配置。

## `electron.builder.winConfig`

* 类型: `Object`
* 默认值： `{}`

对应 [Electron Builder](https://www.electron.build/configuration/win) 的配置 Windows 32 位相关构建配置。

## `electron.builder.win64Config`

* 类型: `Object`
* 默认值： `{}`

对应 [Electron Builder](https://www.electron.build/configuration/linux) 的配置，Windows 64 位相关构建配置。

## `electron.builder.linuxConfig`

* 类型: `Object`
* 默认值： `{}`

对应 [Electron Builder](https://www.electron.build/configuration/configuration) 的配置，Linux 相关构建配置。
