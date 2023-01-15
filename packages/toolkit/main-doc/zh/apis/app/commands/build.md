---
sidebar_position: 5
---

```bash
Usage: modern build [options]

build application

Options:
  -c --config <config>  指定配置文件路径，可以为相对路径或绝对路径
  -h, --help  显示命令帮助
  --analyze   分析构建产物体积，查看各个模块打包后的大小
```

`modern build` 命令默认会在 `dist/` 目录下构建出可用于生产环境的产物。

可以通过修改配置 [`output.distPath`](/docs/configure/app/output/dist-path) 指定产物的输出目录。

## 分析构建产物体积

执行 `npx modern build --analyze` 命令，可以在打包生产环境代码的同时，产出一个分析构建产物体积的 HTML 文件：

```
Bundle Analyzer saved report to /example/dist/report.html
File sizes after production build:

  122.35 KB  dist/static/js/885.1d4fbe5a.js
  2.3 KB     dist/static/js/main.4b8e8d64.js
  761 B      dist/static/js/runtime-main.edb7cf35.js
  645 B      dist/static/css/main.0dd3ecc1.css
```

手动在浏览器中打开上述 HTML 文件，可以看到打包产物的瓦片图，并进行包体积分析和优化：

<img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/mwa-build-analyze-8784f762c1ab0cb20935829d5f912c4c.png" />

> 该功能基于 [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) 实现。
