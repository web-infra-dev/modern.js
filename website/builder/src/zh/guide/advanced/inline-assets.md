# 静态资源内联

静态资源内联是一种优化网页性能的方法，它指的是将静态资源直接内联到 HTML 或 JS 文件中，而不是使用外部文件引用的方式。这样做的好处是减少了浏览器发起的请求数，从而提高页面的加载速度。

不过，静态资源内联也有一些缺点，比如增加了单个文件的体积，可能会导致加载变慢。所以在实际应用中，需要根据具体情况来决定是否使用静态资源内联。

Builder 默认会自动内联体积小于 10KB 的静态资源，但有时候你可能需要手动控制某些特殊资源，让其强制内联或者强制不内联，这篇文档阐述了如何进行精确地控制静态资源内联行为。

## 自动内联

默认情况下，当图片、字体、媒体等类型的文件体积小于阈值（默认为 10KB）时，Builder 会将资源进行内联处理，资源内联后，会被转换成一个 Base64 编码的字符串，不再会发送独立的 HTTP 请求。当文件体积大于或等于该阈值时，则会被作为单独的资源文件，通过独立的 HTTP 请求来加载。

自动内联的体积阈值可以通过 [output.dataUriLimit](/zh/api/config-output.html#output-dataurilimit) 配置项修改。例如，修改图片资源的阈值为 5000 字节，设置视频资源不内联：

```ts
export default {
  output: {
    dataUriLimit: {
      image: 5000,
      media: Infinite,
    },
  },
};
```

## 强制内联

你可以通过在引入资源时添加 `inline` URL 参数来强制内联该资源，无论该资源的体积是否小于阈值。

```tsx
import React from 'react';
import img from './foo.png?inline';

export default function Foo() {
  return <img src={img} />;
}
```

在上面这个例子中，`foo.png` 图片将始终被内联，无论该图片的大小是否大于阈值。

除了 `inline` 参数以外，你也可以使用 `__inline` 参数来强制内联该资源：

```tsx
import img from './foo.png?__inline';
```

### 从 CSS 文件中引用

当你在 CSS 文件中引用静态资源时，同样可以通过 `inline` 或 `__inline` 参数来强制内联资源。

```css
.foo {
  background-image: url('./icon.png?inline');
}
```

:::tip 你真的需要强制内联吗？
内联体积过大的资源时，会显著增加页面的白屏时间或首次可交互时间，这会损害用户体验。并且当你将一个静态资源多次内联到 CSS 文件中时，base64 内容会重复注入，导致产物体积增大。因此，请酌情使用强制内联。
:::

## 强制不内联

当你想把一些资源始终作为单独的资源文件来处理，无论该资源的体积多小时，你可以添加 `url` URL 参数来强制不内联该资源。

```tsx
import React from 'react';
import img from './foo.png?url';

export default function Foo() {
  return <img src={img} />;
}
```

在上面这个例子中，`foo.png` 图片将始终通过单独的资源文件加载，无论该图片的大小是否小于阈值。

除了 `url` 参数以外，你也可以使用 `__inline=false` 参数来强制不内联该资源：

```tsx
import img from './foo.png?__inline=false';
```

### 从 CSS 文件中引用

当你在 CSS 文件中引用静态资源时，同样可以通过 `url` 或 `__inline=false` 参数来强制不内联资源。

```css
.foo {
  background-image: url('./icon.png?url');
}
```

:::tip 你真的需要把资源排除内联吗？
将资源排除内联将增加 Web App 需要加载的资源数量，这对于弱网环境，或是未开启 HTTP2 的场景下，将会降低资源加载效率，因此，请酌情使用强制不内联。
:::

## 内联 JS 文件

除了将静态资源文件内联到 JS 文件里，Builder 也支持将 JS 文件内联到 HTML 文件中。

只需要开启 [output.enableInlineScripts](/zh/api/config-output.html#output-enableinlinescripts) 配置项，构建生成的 JS 文件将不会被写入产物目录下，而是会直接内联到对应的 HTML 文件中。

```ts
export default {
  output: {
    enableInlineScripts: true,
  },
};
```

:::tip
内联 JS 文件可能会导致 HTML 单文件体积过大，并且不利于静态资源缓存，请酌情使用。
:::

## 内联 CSS 文件

你也可以将 CSS 文件内联到 HTML 文件中。

只需要开启 [output.enableInlineStyles](/zh/api/config-output.html#output-enableinlinestyles) 配置项，构建生成的 CSS 文件将不会被写入产物目录下，而是会直接内联到对应的 HTML 文件中。

```ts
export default {
  output: {
    enableInlineStyles: true,
  },
};
```

## 添加类型声明

当你在 TypeScript 代码中使用 `?inline` 和 `?url` 等 URL 参数时，TypeScript 可能会提示该模块缺少类型定义：

```
TS2307: Cannot find module './logo.png?inline' or its corresponding type declarations.
```

此时你需要为这些 URL 参数添加类型声明，请在项目中创建 `src/assets.d.ts` 文件，并添加以下类型声明：

```ts
declare module '*?inline' {
  const content: string;
  export default content;
}

declare module '*?inline' {
  const content: string;
  export default content;
}

declare module '*?__inline' {
  const content: string;
  export default content;
}

declare module '*?inline=false' {
  const content: string;
  export default content;
}
```
