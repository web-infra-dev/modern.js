# Import SVG Assets

Builder supports import SVG assets and transform SVG into React components or URLs.

:::tip What is SVG
SVG stands for Scalable Vector Graphics. It is a type of image format that uses vector graphics to represent images. Vector graphics are different from raster graphics, which are made up of pixels. Instead, vector graphics use geometric shapes, lines, and curves to represent images. Because vector graphics are not made up of pixels, they can be scaled to any size without losing resolution or quality.
:::

## Import SVG in JS file

When import an SVG in a JS file, if you import `ReactComponent`, Builder will call [SVGR](https://react-svgr.com/) to convert the SVG into a React component.

```tsx
// src/component/Logo.tsx
import { ReactComponent as Logo } from './static/logo.svg';

export default () => <Logo />;
```

If you use the default import, then the SVG will be treated as a normal static asset and you will get a URL:

```tsx
import logoURL from './static/logo.svg';

console.log(logoURL); // => "/static/logo.6c12aba3.png"
```

## Modify the Default Export

You can modify the default export of SVG files through the [output.svgDefaultExport](/en/api/config-output.html#output-svgdefaultexport) config. For example, set the default export as a React component:

```ts
export default {
  output: {
    svgDefaultExport: 'component',
  },
};
```

Then import the SVG, you'll get a React component instead of a URL:

```tsx
// src/component/Logo.tsx
import Logo from './static/logo.svg';

export default () => <Logo />;
```

## Import SVG in CSS file

When import an SVG in a CSS file, the SVG is treated as a normal static resource and you will get a URL:

```css
.logo {
  background-image: url('../static/logo.svg');
}
```

## Assets Processing

When SVG is imported not as a React component but as a normal static resource, it is processed exactly the same as other static assets, and it is also affected by rules such as assets inlining and URL prefixing.

Please read the [Import Static Assets](/guide/basic/static-assets.html) section to understand the processing rules for static assets.
