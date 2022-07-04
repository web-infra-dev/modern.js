---
sidebar_label: packageFields
---

# output.packageFields

:::info 适用的工程方案
* 模块
:::

* 类型：`Object`
* 默认值：`undefined`

:::warning 警告
将在下一个大版本被废弃，推荐使用 [`output.buildConfig`](/docs/apis/config/output/build-config) 。
:::

当 `packageMode` 无法满足需求，或者只是想单独构建其中一种类型产物的时候，可以通过该配置自定义构建产物的内容。

配置是一个 *key-value* 的对象。

其中 **value** 的内容由 **语法规范 + 模块化规范** 组成。

:::info 补充信息
支持的语法规范为：
- ES6: 代表支持 ES6 以上的语法。
- ES5: 代码支持 ES5 的语法。
支持的模块化规范：
- CJS: CommonJS
- ESM: ES Module
:::

目前支持的 **value** 有：

- CJS + ES6(+) 构建产物：`CJS+ES6`
- ESM + ES5(+) 构建产物：`ESM+ES5`
- ESM + ES6(+) 构建产物：`ESM+ES6`


目前支持的 key 有:

- `main`: 对应的构建产物目录名称为 `node`。
- `module`：对应的构建产物目录名称为 `treeshaking`。
- `jsnext:modern`: 对应的构建产物目录名称为 `modern`。


## 示例

``` javascript
module.exports = {
  output: {
    packageFields: {
        "main": "CJS+ES6",
        "module": "ESM+ES5",
        "jsnext:modern": "ESM+ES6"
    },
  }
};
```
