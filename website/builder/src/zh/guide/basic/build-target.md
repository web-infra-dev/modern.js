# 构建产物类型

Builder 支持构建出多种产物类型，你可以通过 [createBuilder](/zh/api/builder-core.html#createbuilder) 方法的 `target` 参数来设置产物类型。

## 默认产物

默认情况下，`target` 会被设置为 `'web'`，并构建出**运行在浏览器环境里的产物**。

同时，Builder 会读取项目中的 [Browserslist 配置](https://github.com/browserslist/browserslist)，以确定需要兼容的浏览器范围。

## 可选类型

除了 `'web'` 外，你还可以将 `target` 设置为以下值：

- `'node'`: 构建出运行在 Node.js 环境的产物，通常用于 SSR 等场景。
- `'web-worker'`：构建出运行在 Web Worker 里的产物。
- `'modern-web'`：构建出运行在现代浏览器里的产物。

比如构建出适用于 Node.js 环境的产物：

```ts
const builder = await createBuilder(provider, {
  target: 'node',
});
```

## 并行构建

当 target 为包含多个值的数组时，Builder 会并行构建，并生成多份不同的产物。

比如同时构建浏览器产物和 SSR 产物：

```ts
const builder = await createBuilder(provider, {
  target: ['web', 'node'],
});
```

## Node 产物

指运行在 Node.js 环境的产物，通常用于 SSR 等场景。

当 `target` 设置为 `'node'` 时，Builder 会进行以下处理：

- 不会生成 HTML 文件，与 HTML 相关的逻辑也不会执行，因为 Node.js 环境不需要 HTML。
- 不会打包或抽取 CSS 代码，但产物中会包含 CSS Modules 的 id 信息。
- 不会开启默认的拆包策略，但 dynamic import 依然可以生效。
- 不会开启热更新相关的能力。
- 将 Browserslist 的默认值调整为 `['node >= 12']`。

:::tip
如果触发了并行构建，比如同时构建 web 产物和 node 产物，那么上述处理不会影响 web 产物，web 产物所需的 HTML、CSS 等文件依然会正确生成。
:::

## Web Worker 产物

指运行在 [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) 环境的产物。

当 `target` 设置为 `'web-worker'` 时，Builder 会进行以下处理：

- 不会生成 HTML 文件，与 HTML 相关的逻辑也不会执行，因为 Web Worker 环境不需要 HTML。
- 不会打包或抽取 CSS 代码，但产物中会包含 CSS Modules 的 id 信息。
- 不会开启默认的拆包策略，**并且 dynamic import 也不会生效**，因为 Web Worker 仅运行支持单个 JavaScript 文件。
- 不会开启热更新相关的能力。

## Modern Web 产物

指运行在现代浏览器环境的产物。

:::tip 什么是现代浏览器?
现代浏览器是我们的一个约定用语，指支持 [原生 ES Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) 的浏览器。
:::

当 `target` 设置为 `'modern-web'` 时，Builder 会进行以下处理：

- 将 Browserslist 的默认值调整为：

```js
const browserslist = [
  'chrome > 61',
  'edge > 16',
  'firefox > 60',
  'safari > 11',
  'ios_saf > 11',
];
```
