### Node.js

需要 [Node.js LTS](https://github.com/nodejs/Release)，并确保 Node 版本大于等于 14.17.6，推荐使用 16.x 版本。

Modern.js 推荐在开发环境里先安装 [nvm](https://github.com/nvm-sh/nvm#install--update-script)，在 shell 里集成[自动切换 node 版本的脚本](https://github.com/nvm-sh/nvm#deeper-shell-integration)。

然后只要仓库根目录下有内容为 `lts/fermium` 或 `lts/gallium` 的 `.nvmrc` 文件，进入这个仓库时就会自动安装或切换到正确的 Node.js 版本。

### pnpm

推荐使用 [pnpm](https://pnpm.io/installation) 来管理依赖：

```bash
npm install -g pnpm
```

:::note
Modern.js 同样支持使用 `yarn`、`npm` 进行依赖管理。
:::
