# Inline Static Assets

Builder will automatically inline static assets that are less than 10KB, but sometimes you may need to manually control assets to force them to be inlined or not, and this document explains how to precisely control the inlining behavior of static assets.

## Automatic Inlining

By default, Builder will inline assets when the file size of is less than a threshold (the default is 10KB). When inlined, the asset will be converted to a Base64 encoded string and will no longer send a separate HTTP request. When the file size is greater than this threshold, it is loaded as a separate file with a separate HTTP request.

The threshold can be modified with the [output.dataUriLimit](/en/api/config-output.html#output-dataurilimit) config. For example, set the threshold of images to 5000 Bytes, and set media assets not to be inlined:

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

## Force Inlining

You can force an asset to be inlined by adding the `inline` query when importing the asset, regardless of whether the asset's size is smaller than the size threshold.

```tsx
import React from 'react';
import img from '. /foo.png?inline';

export default function Foo() {
  return <img src={img} />;
}
```

In the above example, the `foo.png` image will always be inlined, regardless of whether the size of the image is larger than the threshold.

In addition to the `inline` query, you can also use the `__inline` query to force inlining of the asset:

```tsx
import img from '. /foo.png?__inline';
```

### Referenced from CSS file

When you reference a static asset in your CSS file, you can also force inline the asset with the `inline` or `__inline` queries.

```css
.foo {
  background-image: url('. /icon.png?inline');
}
```

:::tip Do you really need to force inlining?
Inline large assets will significantly increase the first paint time or first contentful paint time of a page, which will hurt user experience. And when you inline a static asset multiple times into a CSS file, the base64 content will be repeatedly injected, causing the bundle size to grow . Please use forced inlining with caution.
:::

## Force no inlining

When you want to always treat some assets as separate files, no matter how small the asset is, you can add the `url` query to force the asset not to be inlined.

```tsx
import React from 'react';
import img from '. /foo.png?url';

export default function Foo() {
  return <img src={img} />;
}
```

In the above example, the `foo.png` image will always be loaded as a separate file, even if the size of the image is smaller than the threshold.

In addition to the `url` query, you can also use the `__inline=false` query to force the asset not to be inlined:

```tsx
import img from '. /foo.png?__inline=false';
```

### Referenced from CSS file

When you reference a static asset in your CSS file, you can also force the asset not to be inlined with `url` or `__inline=false` queries.

```css
.foo {
  background-image: url('. /icon.png?url');
}
```

:::tip Do you really need to exclude assets from inlining?
Excluding assets from inlining will increase the number of assets that the Web App needs to load. This will reduce the efficiency of loading assets in a weak network environment or in scenarios where HTTP2 is not enabled. Please use force no Inline with caution.

## Inline JS files

In addition to inlining static resource files into JS files, Builder also supports inlining JS files into HTML files.

Just enable the [output.enableInlineScripts](/zh/api/config-output.html#output-enableinlinescripts) config, and the generated JS files will not be written into the output directory, but will be directly inlined to the corresponding in the HTML file.

```ts
export default {
  output: {
    enableInlineScripts: true,
  },
};
```

:::tip
Inline JS files may cause the single HTML file to be too large, and it will break the HTTP caching. Please use it with caution.
:::

## Inline CSS files

You can also inline CSS files into HTML files.

Just enable the [output.enableInlineStyles](/zh/api/config-output.html#output-enableinlinestyles) config, the generated CSS file will not be written into the output directory, but will be directly inlined to the corresponding in the HTML file.

```ts
export default {
  output: {
    enableInlineStyles: true,
  },
};
```
