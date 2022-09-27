:::tip 提示
pnpm v6 和 pnpm v7 版本在执行命令时使用姿势不完全一致，需要注意以下事项：

pnpm v7：

在使用 pnpm 调用 `package.json` 中的命令时，如果需要传递参数至 pnpm，需要将参数放到命令前。

例如使用 pnpm `--filter` 参数执行 prepare 命令：

```bash
pnpm run --filter ./packages/** prepare
```

如果需要传递参数至命令，需要将参数放到命令后。

例如，在如下 `package.json` 配置中：

``` json
{
  "scripts": {
    "command": "modern command"
  }
}
```

执行 command 命令时携带参数方式为：
```bash
pnpm run command --options
```

pnpm v6:

在如下 `package.json` 配置中：

``` json
{
  "scripts": {
    "command": "modern command"
  }
}
```

当需要执行 `modern command --option`：

使用 pnpm 时，需要执行 `pnpm run command -- --option`。

这是因为 pnpm 对于命令参数的处理与 Yarn 并不相同，但是与 npm 类似：在不加 `--` 字符串的时候，传递的是 pnpm 的参数；在使用 `--` 字符串的时候，传递的是执行脚本的参数。

在上述例子里参数 `--option` 传递给了 `modern command`。如果执行 `pnpm run command --option`，则参数 `--option` 将传递给 pnpm。

总结来说：

**在使用 pnpm v7 时，如果传递参数给 pnpm，需要将参数放置到命令前**

**在使用 pnpm v6 时，如果传递的参数给 pnpm，不需要加 `--`；如果传递的参数是给脚本使用，需要增加 `--` 字符串**。

:::
