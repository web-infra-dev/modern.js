---
sidebar_label: entries
sidebar_position: 6
---

# source.entries

:::info 适用的工程方案
* MWA
:::

* 类型： `Object = { [ entryName: string ]: string | Object }`
* 默认值： 根据当前项目目录结构动态结算出的默认入口对象。

对于大部分场景，Modern.js 根据目录结构自动生成的入口能满足大部分业务需求。

如需自定义构建入口时，可以通过该选项指定。例如，当值为 `string` 时，指向入口的文件路径:

```js title="modern.config.js"
export default defineConfig({
  source: {
    entries: {
      // 指定一个名称为 entry_customize 的新入口
      entry_customize: './src/home/test/index.js',
    },
  },
});
```

自定义的入口，只需要导出 `App` 组件，Modern.js 会生成真正的入口文件。

需要关闭这一行为时，可以将值设为 `Object`，属性 `disableMount` 设置为 `true`。


当值为 `Object` 时，可配置如下属性：

* `entry`：`string`，入口文件路径。
* `disableMount`：`boolean = false`，关闭 Modern.js 生成入口代码的行为。
* `enableFileSystemRoutes`：`boolean = false`，是否 [使用约定式路由](/docs/apis/hooks/mwa/src/pages)。

```js
export default defineConfig({
  source: {
    entries: {
      entry_customize: {
        // 入口文件路径
        entry: './src/home/test/App.jsx',
      },
      // 启用约定式路由
      entry_spa: {
        // 约定式路由的入口路径必须设置为目录
        entry: './src/about',
        enableFileSystemRoutes: true,
      },
    },
  },
};
```

