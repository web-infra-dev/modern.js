---
sidebar_position: 7
---

# 模块的入口文件配置

对于可复用模块来说，`package.json` 是一个很重要的文件，其中包含了很多信息，例如项目的名称、依赖的模块。

本章将要介绍 `package.json` 文件中 "exports" 字段的使用以及 Modern.js 对于它做了哪些支持。

## package.json 中的 `exports` 是什么？

在一个包的 `package.json` 文件中，"main" 字段可以用于定义一个包的入口文件。这个字段在 Node.js 所有版本中都支持，并且在其他工具中（例如 webpack）中也默认支持。
虽然它已经被普遍支持，但是它提供的能力其实很有限：它仅仅只能定义一个主要的入口文件。

而 "exports" 字段提供了 "main" 的替代方案，它不仅可以定义主要的入口文件，还可以自定义入口。在自定义入口的同时还起到了封装入口的作用：使用者不可以访问未在 "exports" 中定义的入口路径以外的任何其他路径。

### 举个例子

如果有一个 **foo** 包，其中包含了 `./index.js`、`./lib.js`、`./feature.js` 三个文件，如果它的 `package.json` 定义如下：

```json
{
  "name": "foo",
  "exports": {
    ".": "./index.js",
    "./lib": "./lib.js"
  }
}
```

在支持 "exports" 的环境里，你可以在代码中这样导入模块 **foo** 的文件：

``` js
const foo = require('foo');
const fooLib = require('foo/lib');
```

但是你无法这样使用：

``` js
const fooFeat = require('foo/feature');
```

因为在 `package.json` 中未定义 `./feature` 入口路径。

### 关于"exports" 与 "main"之间的优先级

如果同时定义了 "exports" 和 "main"，"exports" 字段优先于 "main"。因此如果当 "exports" 字段存在的时候，"main" 字段的配置会被覆盖掉。

"exports" 字段不是特定作用于 ES Module 还是 CommonJS，因此不能使用 "main" 字段来作为使用 CommonJS 的回退手段。但它可以作为不支持 "exports "字段的旧版本的 Node.js 的回退手段。
因此对于上面的例子中我们就可以这样修改：

**package.json**
```
{
  "name": "foo",
  "main": "./index.js",
  "exports": {
    ".": "./index.js",
    "./lib": "./lib.js"
  }
}
```

### 条件导出

"exports" 字段提供了条件导出的功能。通过条件导出，可以定义每个环境对应不同的模块包的入口文件，这也包括模块包被使用的时候是通过 `require` 的方式还是通过 `import` 的方式。

例如针对上面的例子进行扩展，假设该模块包提供了 ES Module 实现的文件 `wrapper.mjs` ，那么 `package.json` 会有如下的变化：

``` json
{
  "name": "foo",
  "main": "./index.cjs",
  "exports": {
    "import": "./wrapper.mjs",
    "require": "./index.cjs"
  }
}
```

此时如果通过 `require('foo')` 这样的方式使用该模块，则实际上导入的是 `foo/index.cjs` 文件。

而当通过 `import foo from 'foo';` 这样使用的时候，则实际导入的是 `foo/wrapper.mjs` 文件。

:::info 补充信息
关于 `.cjs` 与 `.mjs`

* `.mjs` 为后缀的文件其代码会被识别为使用了 ES Module 模块系统。
* `.cjs` 为后缀的文件其代码会被识别为使用了 CommonJS 模块系统。
:::

除了像上面使用直接映射方式之外，还可以使用嵌套条件的方式来定义 "exports"，例如：

``` json
{
  "main": "./main.js",
  "exports": {
    "node": {
      "import": "./feature-node.mjs",
      "require": "./feature-node.cjs"
    },
    "default": "./feature.mjs",
  }
}
```

> "node" 用于匹配任何 Node.js 环境，可以是 CommonJS 或者是 ES Module 文件。

> "default" 用于在不满足上面任何条件情况下的回退手段。

关于更多关于 "exports" 的使用，可以阅读 [Node.js Documentation About Packages](https://nodejs.org/api/packages.html)

## 在 Modern.js 中提供的支持

对于不同的可复用模块来说，可能会有不同的（语法以及模块化）构建产物需求 Modern.js 针对该需求提供了不同形式的构建产物以满足各种场景。

在 [构建可复用模块](/docs/guides/features/modules/build) 章节中提到，默认情况下，在 JS 构建产物目录（`dist/js` ）下会存在三个目录：

- `dist/js/modern`
- `dist/js/node`
- `dist/js/treeshaking`

这些目录从上到下分别对应了：`ES6 + ES Module`、`ES6 + CommonJS`、`ES5 + ES Module` 这三种构建产物。

因此如果可复用模块是用于在 Node.js 中使用，那么可以在 `package.json` 中按照如下方式进行配置：

``` json
{
  "name": "node-lib",
  "main": "./dist/js/node/index.js",
  "exports": {
    "node": {
      "require": "dist/js/node/index.js",
      "import": "dist/js/modern/index.js"
    },
    "default": "dist/js/treeshaking/index.js"
  }
}
```

:::info 补充信息
对于其他环境，例如 webpack。可能存在不完全支持 "exports"的情况，因此对于在非 Node.js 环境运行的可复用模块要谨慎使用。
:::

除了默认的三种产物以外，Modern.js 还提供了多个预设配置以及丰富的构建配置供不同场景去选择使用。具体如何使用，可以阅读 【[如何构建模块](/docs/guides/features/modules/build)】。



