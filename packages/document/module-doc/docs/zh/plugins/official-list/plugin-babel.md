# Babel 插件

:::tip
通常情况下，我们无需使用 Babel 转换我们的代码，此插件仅作为一种降级方式。
:::

## 快速开始

### 安装

```bash
# npm
npm install @modern-js/plugin-module-babel -D

# yarn
yarn add @modern-js/plugin-module-babel -D

# pnpm
pnpm add @modern-js/plugin-module-babel -D
```

### 注册插件

在 Module Tools 中，你可以按照如下方式注册插件：

```ts
import moduleTools, { defineConfig } from '@modern-js/module-tools';
import { modulePluginBabel } from '@modern-js/plugin-module-babel';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginBabel(),
  ],
});
```

## 配置

See [babel options](https://babeljs.io/docs/options)

下面是一个配置了`@babel/preset-env`的例子：

```ts
import moduleTools, { defineConfig } from '@modern-js/module-tools';
import { modulePluginBabel } from '@modern-js/plugin-module-babel';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginBabel({
      presets: [['@babel/preset-env']],
    }),
  ],
});
```
