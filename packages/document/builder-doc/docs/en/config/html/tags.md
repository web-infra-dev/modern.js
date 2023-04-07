- **Type:** `ArrayOrNot<HtmlInjectTag | HtmlInjectTagHandler>`
- **Default:** `undefined`

Modifies the tags that are injected into the HTML page.

#### Tag Object

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
   * Enable by default only for elements that are allowed to be included in the `head` tag.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head#see_also}
   */
  head?: boolean;
}
```

A tag object can be used to describe the tag to be injected and the location of the injection can be controlled by the parameters.

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

It will add a `script` tag to the end of the `head` of the HTML:

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

The final insertion position of the tag is determined by the `head` and `append` options, and two elements with the same configuration will be inserted into the same area and hold their relative positions to each other.

Fields in the tag that indicate the path to the external resource file are affected by the `publicPath` and `hash` options.
These fields include `src` for the `script` tag and `href` for the `link` tag.

Enabling `publicPath` will splice the `output.assetPrefix` field before the attribute representing the path in the tag.
And the `hash` field causes the filename to be followed by an additional hash query to control browser caching, with the same hash string as the HTML file product.

You can also pass functions to those fields to control the path joining.

#### Tags Handler

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

`html.tags` can also accept functions that can arbitrarily modify tags by writing logic to the callback, often used to ensure the relative position of tags while inserting them.

The callback function accepts a tag list as an argument and needs to modify or return a new tag array directly.

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

The function will be executed at the end of the HTML processing flow. In the example below, the 'tags' parameter will contain all tag objects that form config, regardless of the function's location in config.

Modifying the attributes `append`, `publicPath`, `hash` in the callback will not take effect, because they have been applied to the tag's location and path attributes, respectively.

So the end product will look like:

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

#### Limitation

This configuration is used to modify the content of HTML files after Builder completes building, and does not resolve or parse new modules. It cannot be used to import uncompiled source code files. Also cannot replace configurations such as [source.preEntry](https://modernjs.dev/builder/api/config-source.html#source.preentry).

For example, for the following project:

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

The tag object here will be directly added to the HTML product after simple processing, but the `polyfill.ts` will not be transpiled or bundled, so there will be a 404 error when processing this script in the application.

```html
<body>
  <script src="//example.com/src/polyfill.ts"></script>
</body>
```

Reasonable use cases include:

* Injecting static resources with **determined paths** on CDN.
* Injecting inline scripts that need to be loaded on the first screen.

For example, the usage of the following example:


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

The result will seems like:

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
