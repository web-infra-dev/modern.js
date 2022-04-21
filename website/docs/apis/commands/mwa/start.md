---
sidebar_position: 6
---

```bash
Usage: modern start [options]

start server

Options:
  -h, --help  display help for command
  --api-only  start api server only
```

通常使用 `modern start` 命令在生产环境下启用 MWA 应用, 需要提前执行 [`build`](/docs/apis/commands/mwa/build) 命令构建出对应产物。

默认情况下，应用将会在 `localhost:8080` 启动，可以通过 `server.port` 修改 Server 端口号：

```js
export default defineConfig({
  server: {
    port: 8081,
  }
})
```

import CommandTip from '@site/docs/components/command-tip.md'

<CommandTip />


