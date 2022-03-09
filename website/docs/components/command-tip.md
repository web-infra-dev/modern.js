:::tip 提示
Yarn 和 pnpm 调用命令时接收参数的方式不同，例如，在如下 `package.json` 配置中：

``` json
{
  "scripts": {
    "command": "modern command"
  }
}
```

当需要执行 `modern command --option`：

使用 Yarn 时，需要执行 `yarn command --option`。

使用 pnpm 时，需要执行 `pnpm run command -- --option`。

这是因为 pnpm 对于命令参数的处理与 Yarn 并不相同，但是与 npm 类似：在不加 `--` 字符串的时候，传递的是 pnpm 的参数；在使用 `--` 字符串的时候，传递的是执行脚本的参数。

在上述例子里参数 `--option` 传递给了 `modern command`。如果执行 `pnpm run command --option`，则参数 `--option` 将传递给 pnpm。

总结来说：

**在使用 pnpm 时，如果传递的参数给 pnpm，不需要加 `--`；如果传递的参数是给脚本使用，需要增加 `--` 字符串**。
:::
