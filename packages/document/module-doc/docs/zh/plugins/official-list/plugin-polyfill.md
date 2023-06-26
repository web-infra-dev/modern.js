# Polyfill 插件

:::tip
通常情况下，我们不需要为 npm 包注入 polyfill，这一步应该在 Web 应用的框架侧完成，但是在某些场景，为了让我们的库能够直接运行在低版本浏览器里，我们需要注入 polyfill。

请注意，此插件并不会转化你的代码语法，只会为你的代码中使用到的不支持的功能注入 polyfill，把它们作为普通函数导入而不是污染全局。你需要安装 `core-js-pure` 依赖

:::

## 快速开始

### 安装

```bash
# npm
npm install @modern-js/plugin-module-polyfill -D

# yarn
yarn add @modern-js/plugin-module-polyfill -D

# pnpm
pnpm add @modern-js/plugin-module-polyfill -D
```

### 注册插件

在 Module Tools 中，你可以按照如下方式注册插件：

```ts
import { moduleTools, defineConfig } from '@modern-js/module-tools';
import { modulePluginPolyfill } from '@modern-js/plugin-module-polyfill';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginPolyfill(),
  ],
});
```

## 配置

* **类型：**

```ts
type options = {
  targets?: Record<string, string> | string;
}
```

### targets

参考 [Babel target](https://babeljs.io/docs/options#targets).

下面是一个例子：

```ts
import { moduleTools, defineConfig } from '@modern-js/module-tools';
import { modulePluginPolyfill } from '@modern-js/plugin-module-polyfill';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginPolyfill({
      targets: "> 0.25%, not dead"
    }),
  ],
});
```
