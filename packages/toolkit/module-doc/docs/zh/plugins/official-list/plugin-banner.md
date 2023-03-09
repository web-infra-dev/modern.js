# Banner 插件

提供为每个 JS 和 CSS 文件的顶部和底部注入内容的能力。

## 快速开始

### 安装

```bash
# npm
npm install @modern-js/plugin-module-banner -D

# yarn
yarn add @modern-js/plugin-module-banner -D

# pnpm
pnpm add @modern-js/plugin-module-banner -D
```


### 注册插件

在 Module Tools 中，你可以按照如下方式注册插件：

```ts
import moduleTools, defineConfig from '@modern-js/module-tools';
import pluginBanner from '@modern-js/plugin-module-banner';

export default defineConfig({
  plugins: [
    moduleTools(),
    pluginBanner({
      banner: {
        js: '//comment',
        css: '/*comment*/',
      },
    }),
  ],
});
```

:::tip
注意：CSS 的注释不支持 `//comment` 这样的写法。详见[【CSS 注释】](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Comments)
:::

## 示例

### 在 JS 文件顶部增加版权信息

```ts
import pluginBanner from '@modern-js/plugin-module-banner';

const copyRight = `/*
 © Copyright 2020 xxx.com or one of its affiliates.
 * Some Sample Copyright Text Line
 * Some Sample Copyright Text Line
 * Some Sample Copyright Text Line
 * Some Sample Copyright Text Line
 * Some Sample Copyright Text Line
 * Some Sample Copyright Text Line
*/`;

export default defineConfig({
  plugins: [
    pluginBanner({
      banner: {
        js: copyRight,
      },
    }),
  ],
});
```

## 配置

* 类型：

```ts
type BannerOptions = {
  banner: {
    js?: string;
    css?: string;
  };
  footer?: {
    js?: string;
    css?: string;
  };
};
```

### banner

在顶部增加内容。

* `banner.js`：在 JS 文件顶部增加内容。
* `banner.css`：在 CSS 文件顶部增加内容。

### footer

在底部增加内容。

* `footer.js`：在 JS 文件底部增加内容。
* `footer.css`：在 CSS 文件底部增加内容。
