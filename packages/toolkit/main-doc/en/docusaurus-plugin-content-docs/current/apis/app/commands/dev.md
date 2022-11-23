---
sidebar_position: 1
---

# dev

```bash
Usage: modern dev [options]

Development commands

Options:
  -e --entry <entry>    compiler by entry
  -c --config <config>  configuration file path, which can be a relative path or an absolute path
  -h, --help            show command help
  --analyze             analyze the bundle and view size of each module
  --api-only            only start API service
```

`modern dev` start a development server，watch file change，default support React Fast Refresh:

```bash
App running at:

  > Local:    http://localhost:8080/
  > Network:  http://192.168.0.1:8080/
```

import CommandTip from '@site-docs/components/command-tip.md'

<CommandTip />
