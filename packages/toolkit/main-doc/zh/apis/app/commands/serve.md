---
sidebar_position: 6
---

```bash
Usage: modern serve [options]

run server

Options:
  -c --config <config>  指定配置文件路径，可以为相对路径或绝对路径
  -h, --help            显示命令帮助
  --api-only            仅启动 API 接口服务
```

通常使用 `modern serve` 命令在生产环境下启用应用工程, 需要提前执行 [`build`](/docs/apis/app/commands/build) 命令构建出对应产物。

默认情况下，应用将会在 `localhost:8080` 启动，可以通过 `server.port` 修改 Server 端口号：

```js
export default defineConfig({
  server: {
    port: 8081,
  },
});
```

import CommandTip from '@site-docs/components/command-tip.md'

<CommandTip />
