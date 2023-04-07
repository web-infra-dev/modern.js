- **类型：** `ArrayOrNot<HtmlInjectTag | HtmlInjectTagHandler>`
- **默认值：** `undefined`

添加和修改最终注入到 HTML 页面的标签。

#### 对象形式

```ts
export interface HtmlInjectTag {
  tag: string;
  attrs?: Record<string, string | boolean | null | undefined>;
  children?: string;
  /** @default false */
  hash?: boolean | string | ((url: string, hash: string) => string);
  /** @default true */
  publicPath?: boolean | string | ((url: string, publicPath: string) => string);
  /** @default false */
  append?: boolean;
  /**
   * 仅对于允许包含在 head 中的元素会默认启用
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head#see_also}
   */
  head?: boolean;
}
```

对象形式的配置项可以用于描述需要注入的标签，并可以通过参数控制注入的位置：

```js
export default {
  output: {
    assetPrefix: '//example.com/',
  },
  html: {
    tags: [
      {
        tag: 'script',
        attrs: { src: 'a.js' },
        head: true,
        append: true,
        publicPath: true,
        hash: true,
      },
    ],
  },
};
```

这样的配置将会在 HTML 的 `head` 最后添加一个 `script` 标签：

```html
<html>
  <head>
    <!-- some other headTags... -->
    <script src="//example.com/a.js?8327ec63"></script>
  </head>
  <body>
    <!-- some other bodyTags... -->
  </body>
</html>
```

标签最终的插入位置由 `head` 和 `append` 选项决定，两个配置相同的元素将被插入到相同区域，并且维持彼此之间的相对位置。

标签中表示外部资源文件路径的字段会受到 `publicPath` 和 `hash` 选项的影响，
这些字段包括 `script` 标签的 `src` 和 `link` 标签的 `href`。

启用 `publicPath` 会让标签中表示路径的属性被拼接上 `output.assetPrefix` 字段。
而 `hash` 字段会让文件名后多出一个哈希查询用于控制浏览器缓存，哈希字符串与 HTML 文件产物的哈希值相同。

用户也可以向这两个配置传入函数，以自行控制路径拼接的逻辑。

#### 函数形式

```ts
export type HtmlInjectTagUtils = {
  outputName: string;
  publicPath: string;
  hash: string;
};

export type HtmlInjectTagHandler = (
  tags: HtmlInjectTag[],
  utils: HtmlInjectTagUtils,
) => HtmlInjectTag[] | void;
```

`html.tags` 也支持传入回调函数，通过在回调中编写逻辑可以任意修改标签列表，常用于修改标签列表或是在插入标签的同时确保其相对位置。

回调函数接受 tags 列表作为参数，并需要修改或直接返回新的 tags 数组：

```typescript
export default {
  html: {
    tags: [
      tags => {
        tags.splice(0, 1);
      },
      /* ^?
       *   { tag: 'script', attrs: { src: 'b.js' } },
       *   ... some other headTags
       *   { tag: 'script', attrs: { src: 'c.js' } },
       *   ... some other bodyTags
       *   { tag: 'script', attrs: { src: 'a.js' }, head: false },
       */
      { tag: 'script', attrs: { src: 'a.js' }, head: false },
      { tag: 'script', attrs: { src: 'b.js' }, append: false },
      { tag: 'script', attrs: { src: 'c.js' } },
      tags => [...tags, { tag: 'script', attrs: { src: 'd.js' } }],
      /* ^?
       *   ... some other headTags
       *   { tag: 'script', attrs: { src: 'c.js' } },
       *   ... some other bodyTags
       *   { tag: 'script', attrs: { src: 'a.js' }, head: false },
       */
    ],
  },
};
```

函数将在 HTML 处理流程的最后被执行，即如下的例子中不管回调函数在配置项中的位置如何，
参数 `tags` 都会包含配置项中所有的对象形式配置。

也因此在回调中修改 `append` `publicPath` `hash` 等属性都不会生效，因为这些属性都已经分别应用到了标签的位置和路径属性。

于是最终产物将会类似：

```html
<html>
  <head>
    <!-- tags with `{ head: true, append: false }` here. -->
    <!-- some other headTags... -->
    <!-- tags with `{ head: true, append: true }` here. -->
    <script src="//example.com/c.js"></script>
    <script src="//example.com/d.js"></script>
  </head>
  <body>
    <!-- tags with `{ head: false, append: false }` here. -->
    <!-- some other bodyTags... -->
    <!-- tags with `{ head: false, append: true }` here. -->
    <script src="//example.com/a.js"></script>
  </body>
</html>
```

#### 限制

这个配置用于在 Bundler 构建完成后修改 HTML 产物的内容，并不会引入和解析新的模块，它无法替代 [source.preEntry](/api/config-source.html#source.preentry) 等能力。

例如对于以下项目：

```plain
web-app
├── src
│   ├── index.tsx
│   └── polyfill.ts
└── modern.config.ts
```

```ts title="modern.config.ts"
export default {
  output: {
    assetPrefix: '//example.com/',
  },
  html: {
    tags: [
      { tag: 'script', attrs: { src: './src/polyfill.ts' } },
    ],
  },
};
```

这里的 tag 对象将会在简单处理后直接添加到 HTML 产物中，但对应的 `polyfill.ts` 将不会被转译、打包，也因此应用会在处理这行脚本时出现 404 错误。

```html
<body>
  <script src="//example.com/src/polyfill.ts"></script>
</body>
```

合理的使用场景包括：

* 注入 CDN 上 **路径确定** 的静态资源
* 注入需要首屏加载的内联脚本

例如以下示例的使用方式：

```plain
web-app
├── src
│   └── index.tsx
├── public
│   └── service-worker.js
└── modern.config.ts
```

```ts title="modern.config.ts"
function report() {
  fetch('https://www.example.com/report')
}

export default {
  html: {
    output: {
      assetPrefix: '//example.com/',
    },
    tags: [
      // Inject asset from the `public` directory.
      { tag: 'script', attrs: { src: 'service-worker.js' } },
      // Inject asset from other CDN url.
      {
        tag: 'script',
        publicPath: false,
        attrs: { src: 'https://cdn.example.com/foo.js' },
      },
      // Inject inline script.
      {
        tag: 'script',
        children: report.toString() + '\nreport()',
      }
    ],
  },
};
```

得到的产物将会类似：

```html
<body>
  <script src="//example.com/service-worker.js"></script>
  <script src="https://cdn.example.com/foo.js"></script>
  <script>
    function report() {
      fetch('https://www.example.com/report')
    }
    report()
  </script>
</body>
```
