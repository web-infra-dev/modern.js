---
sidebar_position: 5
---

```bash
Usage: modern build [options]

build application

Options:
  -c --config <config>  configuration file path, which can be a relative path or an absolute path
  -h, --help            show command help
  --analyze             analyze the bundle and view size of each module
```

`modern build` command will by default build production in `dist/`.

you can configure the [`output.distPath`](/docs/configure/app/output/dist-path) specifies the output directory for the product.

## Analyze Bundle

execute `npx modern build --analyze` command，can produce an HTML file that analyzes the volume of the bundle while packaging the production code:

```
Bundle Analyzer saved report to /example/dist/report.html
File sizes after production build:

  122.35 KB  dist/static/js/885.1d4fbe5a.js
  2.3 KB     dist/static/js/main.4b8e8d64.js
  761 B      dist/static/js/runtime-main.edb7cf35.js
  645 B      dist/static/css/main.0dd3ecc1.css
```

Open the above HTML file in the browser, you can see the tile diagram of the packaged product, and perform package volume analysis and optimization:

<img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/mwa-build-analyze-8784f762c1ab0cb20935829d5f912c4c.png" />

> this features based on [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer).

## Command Arguments

import CommandTip from '@site-docs-en/components/command-tip.md'

<CommandTip />
