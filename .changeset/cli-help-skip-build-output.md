---
'@modern-js/app-tools': patch
---

fix(app-tools): treat a build command followed only by `--help` or `-h` (for example `modern build --help` or `modern dev -h`) as printing help, so it no longer empties the output directory or regenerates `node_modules/.modern-js`. The plugin lifecycle order is unchanged.

fix(app-tools)：构建类命令后面只跟 `--help` 或 `-h` 时（例如 `modern build --help`、`modern dev -h`）视为打印帮助，不再清空产物目录，也不再重新生成 `node_modules/.modern-js`。插件生命周期顺序不变。
