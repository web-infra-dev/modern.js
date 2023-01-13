---
sidebar_position: 1
---

# dev / start

```bash
Usage: modern dev / modern start [options]

Development commands

Options:
  -e --entry <entry>    compiler by entry
  -c --config <config>  configuration file path, which can be a relative path or an absolute path
  -h, --help            show command help
  --analyze             analyze the bundle and view size of each module
  --api-only            only start API service
```

`modern dev` start a development server，watch file change，default support React Fast Refresh:

`modern start` is an alias of `modern dev` command, the usage of the two are exactly the same.

```bash
$ modern dev

info    Starting dev server...
info    App running at:

  > Local:    http://localhost:8080/
  > Network:  http://192.168.0.1:8080/
```
