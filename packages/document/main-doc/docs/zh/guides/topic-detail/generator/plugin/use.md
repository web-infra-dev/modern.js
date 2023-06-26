---
sidebar_position: 3
---

# 使用

`@modern-js/create` 提供了 `--plugin` 参数用于运行生成器插件项目。

`--plugin` 支持三种格式：

## 绝对路径

适用于本地开发调试，开发完成后，在生成器插件执行 `npm run build` 构建项目，然后使用下面命令即可进行测试。

```bash
npx @modern-js/create@latest --plugin <pluginPath>
```

## 相对路径

适用于本地开发调试或者生成器插件项目和目标创建项目在同一个 Monorepo，无需发布 NPM 包，构建项目后，执行下面命令即可。

```bash
npx @modern-js/create@latest --plugin file:../<pluginPath>
```

## npm 包

适用于生成器插件发布于 npm 上，共享生成器插件场景。

```bash
npx @modern-js/create@latest --plugin <pluginPackage>
```
