---
sidebar_position: 8
---

```
Usage: modern upgrade [options]

升级 Modern.js 到最新版本

Options:
  --registry <registry>  定制 npm registry (default: "")
  -d,--debug             开启 Debug 模式，打印调试日志信息 (default: false)
  --cwd <cwd>            项目路径 (default: "")
  -h, --help             display help for command
```

在项目根目录下执行命令 `npx modern upgrade`，会默认将当前执行命令项目的 `package.json` 中的 Modern.js 相关依赖更新至最新版本。

:::info
命令在 `@modern-js/app-tools` 版本 >= 1.17.0 提供，之前版本可使用 `npx @modern-js/upgrade` 进行升级。
:::
