# 引用 SVG 资源

Builder 支持在代码中引用 SVG 资源，并将 SVG 图片转换为 React 组件或 URL。

:::tip 什么是 SVG
SVG 是 Scalable Vector Graphics 的缩写，意为可伸缩矢量图形。SVG 是一种用来描述二维矢量图形的 XML-based 格式，可以用来创建可以无限放大或缩小而不失真的图像。因为 SVG 图形是由矢量图形元素组成的，所以可以轻松地在各种尺寸和分辨率下渲染。
:::

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

你可以通过 [output.svgDefaultExport](/api/config-output.html#outputsvgdefaultexport) 配置项来修改 SVG 文件默认导出的内容，比如把默认导出的内容设置为 React 组件：

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

## 添加类型声明

当你在 TypeScript 代码中引用 SVG 资源时，TypeScript 可能会提示该模块缺少类型定义：

```
TS2307: Cannot find module './logo.svg' or its corresponding type declarations.
```

此时你需要为 SVG 资源添加类型声明文件，请在项目中创建 `src/global.d.ts` 文件，并添加相应的类型声明：

```ts
declare module '*.svg' {
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement>
  >;

  const content: string;
  export default content;
}
```

如果你将 `svgDefaultExport` 设置为 `'component'`，则将类型声明修改为：

```ts
declare module '*.svg' {
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement>
  >;

  export default ReactComponent;
}
```

添加类型声明后，如果依然存在上述错误提示，请尝试重启当前 IDE，或者调整 `global.d.ts` 所在的目录，使 TypeScript 能够正确识别类型定义。
