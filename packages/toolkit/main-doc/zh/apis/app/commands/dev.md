---
sidebar_position: 1
---

# dev / start

```bash
Usage: modern dev / modern start [options]

本地开发命令

Options:
  -e --entry <entry>    指定入口，编译特定的页面
  -c --config <config>  指定配置文件路径，可以为相对路径或绝对路径
  -h, --help            显示命令帮助
  --analyze             分析构建产物体积，查看各个模块打包后的大小
  --api-only            仅启动 API 接口服务
```

`modern dev` 命令用于启动一个本地开发服务器，对源代码进行开发环境编译，同时监听源文件变化，默认支持模块热更新和 React Fast Refresh。

`modern start` 是 `modern dev` 命令的别名，两者的功能和用法完全一致。

```bash
$ modern dev

info    Starting dev server...
info    App running at:

  > Local:    http://localhost:8080/
  > Network:  http://192.168.0.1:8080/
```

import CommandTip from '@site-docs/components/command-tip.md'

<CommandTip />
