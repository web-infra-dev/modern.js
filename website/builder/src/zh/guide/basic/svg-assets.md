# 引用 SVG 资源

Builder 支持在代码中引用 SVG 资源，并将 SVG 图片转换为 React 组件或 URL。

## 在 JS 文件中引用

在 JS 文件中引用 SVG 资源时，如果你具名导入 `ReactComponent` 对象，Builder 会调用 [SVGR](https://react-svgr.com/)，将 SVG 图片转换为一个 React 组件。

```tsx
// src/component/Logo.tsx
import { ReactComponent as Logo } from './static/logo.svg';

export default () => <Logo />;
```

如果你使用默认导入，那么 SVG 会被当做普通的静态资源来处理，你会得到一个 URL 字符串：

```tsx
import logoURL from './static/logo.svg';

console.log(logoURL); // => "/static/logo.6c12aba3.png"
```

## 修改默认导出

你可以通过 [output.svgDefaultExport](/zh/api/config-output.html#output-svgdefaultexport) 配置项来修改 SVG 文件默认导出的内容，比如把默认导出的内容设置为 React 组件：

```ts
export default {
  output: {
    svgDefaultExport: 'component',
  },
};
```

此时再使用默认导入，你会得到一个 React 组件，而不是 URL：

```tsx
// src/component/Logo.tsx
import Logo from './static/logo.svg';

export default () => <Logo />;
```

## 在 CSS 文件中引用

在 CSS 文件中引用 SVG 资源时，SVG 会被当做一个普通的静态资源来处理，你会得到一个 URL：

```css
.logo {
  background-image: url('../static/logo.svg');
}
```

## 静态资源处理

当 SVG 不是作为 React 组件，而是作为一个普通的静态资源被引用时，它的处理逻辑和其他静态资源完全一致，也会受到静态资源内联、URL 前缀等规则的影响。

请阅读 [引用静态资源](/guide/basic/static-assets.html) 章节来了解静态资源的处理规则。
