---
title: autoLoadPlugins (自动注册插件)
sidebar_position: 11
---

- 类型：`boolean`
- 默认值：`false`

用于配置 Modern.js 是否开启自动注册插件。

### 手动注册插件

默认情况下，安装插件后需要你在 `modern.config.ts` 文件中手动注册插件。

```ts title="modern.config.ts"
import AppToolsPlugin, { defineConfig } from '@modern-js/app-tools';
import I18nPlugin from '@modern-js/plugin-i18n';

default export defineConfig({
  plugins: [AppToolsPlugin(), I18nPlugin()]
})

```

### 自动注册插件

除了手段注册，Modern.js 还提供自动注册插件的方式: 将 `autoLoadPlugin` 配置项置为 `true`。

```ts title="modern.config.ts"
import { defineConfig } from '@modern-js/app-tools';

default export defineConfig({
  autoLoadPlugins: true
})
```

Modern.js 将通过以下几个步骤帮你自动注册插件

1. Modern.js 在内部维护一份官方插件列表。

```js
const InternalPlugins = ['@modern-js/app-tools', '@modern-js/plugin-i18n', ...];
```

2. Modern.js 将读取你的 `package.json` 文件，收集依赖信息。

```json title="package.json"
"dependencies": {
  "@modern-js/plugin-i18n": "x.x.x"
  ...
},
"devDependencies": {
  "@modern-js/app-tools": "x.x.x"
  ...
}
```

3. Modern.js 观察到你安装了 `@modern-js/plugin-i18n` 和 `@modern-js/app-tools` 等依赖后，将会引入插件自动注册。

可以注意到这种方式相对黑盒，你甚至对加载插件的过程是无感知的。我们希望更多的细节暴露给开发者，能让开发者去控制这一过程。

**因此我们更加推荐你手动注册插件。**
