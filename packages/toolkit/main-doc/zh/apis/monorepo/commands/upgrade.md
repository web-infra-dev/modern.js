---
sidebar_position: 11
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

`modern upgrade` 命令，用于升级项目 Modern.js 相关依赖至最新版本。

在项目根目录下执行命令 `npx modern upgrade`，会默认将当前执行命令项目的 `package.json` 中的 Modern.js 相关依赖更新至最新版本。
