---
sidebar_position: 6
---

```bash
Usage: modern serve [options]

run server

Options:
  -c --config <config>  configuration file path, which can be a relative path or an absolute path
  -h, --help            show command help
  --api-only            only run API service
```

Usually use the `modern serve` command to enable project run in the production environment, and you need to execute the [`build'](/docs/apis/app/commands/build) command in advance to build the product.

By default, the project will run in `localhost:8080`, you can modify the Server port number with `server.port`:

```js
export default defineConfig({
  server: {
    port: 8081,
  },
});
```

import CommandTip from '@site-docs-en/components/command-tip.md'

<CommandTip />
