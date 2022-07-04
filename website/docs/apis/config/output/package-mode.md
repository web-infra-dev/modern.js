---
sidebar_label: packageMode
---

# output.packageMode

:::info 适用的工程方案
* 模块
:::


* 类型： `'universal-js' | 'universal-js-lite' | 'browser-js' | 'browser-js-lite' | 'node-js'`
* 默认值： `'universal-js'`

:::warning 警告
将在下一个大版本被废弃，推荐使用 [`output.buildPreset`](/docs/apis/config/output/build-preset) 。
:::

通过该配置可以决定构建产物支持的语法以及模块化规范。

不同类型构建产物的产出目录的名称如下：

- `dist/js/modern`
- `dist/js/node`
- `dist/js/treeshaking`

以上目录名称的含义与在 `package.json` 中的使用方式有关，与具体的 **JS** 语法和模块化规范无关。具体的使用方式如下：

``` json
{
    "jsnext:source": "./src/index.js",
    "types": "dist/types/index.d.ts",
    "main": "dist/js/node/index.js",
    "module": "dist/js/treeshaking/index.js",
    "jsnext:modern": "./dist/js/modern/index.js",
    "exports": {
        ".": {
            "node": {
                "import": "./dist/js/modern/index.js",
                "require": "./dist/js/node/index.js"
            },
            // 为何设置default？以防止出现不支持的环境，作为导出的 fallback。
            "default": "./dist/js/treeshaking/index.js"
        }
    }
}
```

具体的 `packageMode` 值以及构建产物的内容如下：

- `'universal-js'` （**Universal JS** 的默认选择，三份构建产物，支持 **Node.js**，对现代浏览器有优化。）
  - `node`: CommonJS + ES6(+)
  - `treeshaking`: ES Module + ES5
  - `modern`: ES Module + ES6(+)

- `'universal-js-lite'` （**Universal JS** 的优化选择，两份构建产物，对现代浏览器无优化。）
  - `node`: CommonJS + ES6(+)
  - `treeshaking`: ES Module + ES5
  - `modern`: ES Module + ES5

- `'browser-js'` （纯前端代码的默认选择，两份构建产物。）
  - `node`: ES Module + ES6(+)
  - `treeshaking`: ES Module + ES5
  - `modern`: ES Module + ES6(+)

- `'browser-js-lite'` （纯前端代码的优化选择，单份构建产物，对现代浏览器无优化。）
  - `node`: ES Module + ES5
  - `treeshaking`: ES Module +ES5
  - `modern`: ES Module + ES5

- `'node-js'` （纯 **Node.js** 代码的默认选择，两份构建产物。）
  - `node`: CommonJS + ES6(+)
  - `treeshaking`: 无文件
  - `modern`: ES Module + ES6(+)
