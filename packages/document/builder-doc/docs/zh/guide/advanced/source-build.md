# 源码构建模式

源码构建模式用于 monorepo 开发场景，它允许开发者直接引用 monorepo 中其他子项目的源码进行开发。

## 使用场景

**monorepo 中项目互相引用主要有产物引用和源码引用两种方式**。我们以一个最简单的 monorepo 为例子，来介绍源码引用的使用场景。

比如 monorepo 中包含了一个 app 应用和一个 lib 包：

```ts
monorepo
├── app
└── lib
    └── src
        └── index.ts
```

其中，app 是基于 Modern.js Builder 构建的，app 依赖了 lib 中的一些方法：

```json
{
  "name": "app",
  "dependencies": {
    "lib": "workspace:*"
  }
}
```

### 产物引用

**产物引用指的是当前项目引用其他子项目构建后的产物。**

比如上述例子中的 lib 是使用 TypeScript 编写的，通常情况下，我们需要提前构建 lib 的代码，生成 JavaScript 产物，这样 app 才可以正确引用它。当 lib 代码更新时，还需要重新执行一次构建（或者使用 `tsc --watch`），否则 app 无法引用到最新的代码。

这种方式的优势在于：

- 各个子项目的构建过程是完全独立的，可以拥有不同的构建配置。
- 可以针对子项目进行构建缓存。

劣势在于：

- 本地开发时 HMR 的链路变长。
- 当一个项目中包含多个 lib 包时，以上过程会显得十分繁琐。

### 源码引用

**源码引用指的是当前项目引用其他子项目的源码进行构建。**

比如上述例子，当你开启了源码构建模式，并在 lib 中添加相关配置后，Modern.js Builder 会自动引用 lib 的 `src/index.ts` 源代码。这意味着，你不需要提前构建 lib 的代码，并且当 lib 的源代码更新时，也可以自动触发 app 的热更新。

这种方式的优势在于：

- 子项目不依赖构建工具，也不需要添加构建配置，子项目的代码会被当前项目的构建工具编译。
- 不需要提前执行子项目的构建流程。
- 本地开发时 HMR 更高效。

劣势在于：

- 当前项目需要支持子项目用到的语法特性，并且遵循相同的语法规范，比如使用一致的装饰器语法版本。如果当前项目和子项目需要使用不同的编译配置，则不适合使用源码构建。
- 当前项目需要编译更多的代码，因此构建时间可能会变长。

## 使用源码构建

### 开启配置

你可以通过设置 [experiments.sourceBuild](/api/config-experiments.html#experimentssourcebuild) 为 `true` 来开启源码构建模式。

```ts
export default {
  experiments: {
    sourceBuild: true,
  },
};
```

### 配置子项目

当开启源码构建模式后，Modern.js Builder 在构建过程中，会优先读取子项目的 `source` 字段对应的文件。因此，你需要在子项目的 package.json 中配置 `source` 字段，并且指向源码文件路径。

比如以下例子，当 lib 包被引用时，会读取 `./src/index.ts` 文件进行构建：

```json title="package.json"
{
  "name": "lib",
  "main": "./dist/index.js",
  "source": "./src/index.ts"
}
```

如果子项目使用了 [exports](https://nodejs.org/api/packages.html#package-entry-points) 配置，那么你同样需要在 `exports` 中增加 `source` 字段。

```json title="package.json"
{
  "name": "lib",
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

## 配置 Project Reference

在 TypeScript 项目中，你需要使用 TypeScript 提供的 [Project Reference](https://www.typescriptlang.org/docs/handbook/project-references.html) 能力，它可以帮助你更好地使用源码开发。

### 介绍

Project reference 提供了以下能力：

- 使 TypeScript 可以正确识别其他子项目的类型，而无须对子项目进行构建。
- 当你在 VS Code 内进行代码跳转时，VS Code 可以自动跳转到对应模块的源代码文件。
- Modern.js Builder 会读取 project reference 配置，并自动识别子项目的 `tsconfig.compilerOptions.path` 配置，从而让子项目的别名可以正确生效。

### 示例

在上文的例子中，由于 app 引用了 lib 子项目，我们需要在 app 的 `tsconfig.json` 内配置 `composite` 和 `references`，并指向 lib 对应的相对目录：

```json title="app/tsconfig.json"
{
  "compilerOptions": {
    "composite": true
  },
  "references": [
    {
      "path": "../lib"
    }
  ]
}
```

添加以上两个选项后，project reference 就已经配置完成了，你可以重新启动 VS Code 来查看配置以后的效果。

注意以上只是一个最简单的例子，在实际的 monorepo 项目中，可能会有更复杂的依赖关系，你需要添加完整的 `references` 配置，才能使上述功能正确运作。

:::tip
如果你想了解更多关于 project reference 的内容，请阅读 [TypeScript - Project References](https://www.typescriptlang.org/docs/handbook/project-references.html) 官方文档。
:::

## 注意事项

在使用源码构建模式的时候，需要注意几点：

1. 需要保证当前项目可以编译子项目里使用的语法或特性。比如子项目使用了 Stylus 来编写 CSS 样式，那就需要当前 app 支持 Stylus 编译。
2. 需要保证当前项目与子项目使用的代码语法特性相同，例如装饰器的语法版本一致。
3. 源码构建可能存在一些限制。如果在使用中遇到问题，你可以将子项目 package.json 中的 `source` 字段移除，使用子项目的构建产物进行调试。
4. 开启 `composite: true` 后，TypeScript 会生成 `*.tsbuildinfo` 临时文件，你需要将这些临时文件加入 .gitignore 中。

```text title=".gitignore"
*.tsbuildinfo
```
