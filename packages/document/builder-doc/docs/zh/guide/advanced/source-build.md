# 源码构建

源码构建模式允许开发者在 Monorepo 场景下使用依赖的子项目源码进行开发。这样可以在不启动子项目构建任务的情况下进行 HMR (Hot Module Replacement)。

## 开启特性

在 Builder 中，你可以通过设置 [`experiments.sourceBuild`](/api/config-experiments.html#experimentssourcebuild) 为 `true` 来开启该功能。

## 指定需要读取源码的子项目

当需要读取某一个子项目源码的时候，需要确保子项目的 package.json 中包含 `source` 字段，并且该字段对应的文件路径为源码文件路径。


```json title="package.json"
{
    "name": "lib",
    "main": "./dist/index.js",
    "source": "./src/index.ts"
}
```

如果子项目存在 [`exports`](https://nodejs.org/api/packages.html#package-entry-points) 配置的时候，那么需要同时在 exports 中增加 `source` 字段。

```json title="package.json"
{
    "name": "lib",
    "main": "./dist/index.js",
    "source": "./src/index.ts",
    "exports": {
        ".": {
            "source": "./src/index.ts",
            "default": "./dist/index.js"
        },
        "./features": {
            "source": "./src/features/index.ts",
            "default": "./dist/features/index.js"
        }
    }
}
```

## 注意事项

在使用源码构建模式的时候，需要注意几点：

1. 保证所有子项目使用的配置或者特性都需要在 Builder 的配置文件里设置。
2. 保证当前项目与子项目使用的代码语法特性相同，例如装饰器的语法。
3. 源码构建可能存在一定的限制。当遇到问题的时候，可以将子项目 package.json 中的 `source` 字段移除，使用子项目的构建产物进行调试。
