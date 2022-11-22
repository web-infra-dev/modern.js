---
title: 图片资源
sidebar_position: 4
---

## JS 中使用图片

JS 文件中引入的图片资源会返回解析之后的 URL：

```js title=src/App.jsx
import logoUrl from './logo.png';

console.log(logoUrl); // 输出： '/src/logo.png';
```

## Base64 编码内联

默认情况下，小于 10kb 的图片、字体文件，会经过 Base64 编码，内联进页面，不会再发送独立的请求。

可以通过配置 [`output.dataUriLimit`](/docs/configure/app/output/data-uri-limit) 修改这个阈值。

## JS 中使用 SVG

针对 SVG 资源，默认启用了 [SVGR](https://react-svgr.com/)，可以通过 React 组件的形式导入：

```js title=App.jsx
import logoUrl, { ReactComponent as LogoComponent } from './logo.svg';
```

## CSS 中使用图片

在 CSS 文件中既可以通过相对路径也可以通过别名的方式引入图片:

```css
.logo {
  background: url('./foo.png');
}

/** or **/
.logo {
  background: url('@/foo.png');
}
```
