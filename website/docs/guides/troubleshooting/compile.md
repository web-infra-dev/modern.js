---
sidebar_position: 1
---

# 编译构建

### 打包时出现 JavaScript heap out of memory?

该报错表示打包过程中出现了内存溢出问题，大多数情况下是由于打包的内容较多，超出了 Node.js 默认的内存上限。

如果出现 OOM 问题，可以尝试通过增加内存上限来解决，Node.js 提供了 `--max-old-space-size` 选项来对此进行设置。

你可以在 `modern build` 命令前添加 NODE_OPTIONS 来设置此参数：

```bash
NODE_OPTIONS=--max_old_space_size=16384 modern build
```

参数的值代表内存上限大小（MB)，一般情况下设置为 `16384`（16GB）即可。
