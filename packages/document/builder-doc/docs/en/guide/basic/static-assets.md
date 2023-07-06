# Import Static Assets

Builder supports import static assets, including images, fonts, and medias.

:::tip What is Static Assets
Static assets are files that are part of a web application and do not change, even when the application is being used. Examples of static assets include images, fonts, medias, stylesheets, and JavaScript files. These assets are typically stored on a web server or CDN, and delivered to the user's web browser when the Web application is accessed. Because they do not change, static assets can be cached by the browser, which helps to improve the performance of the Web application.
:::

## Assets Format

The following are the formats supported by Builder by default:

- **Image**: png, jpg, jpeg, gif, svg, bmp, webp, ico, apng, avif, tiff.
- **Fonts**: woff, woff2, eot, ttf, otf, ttc.
- **Media**: mp4, webm, ogg, mp3, wav, flac, aac, mov.

If you need to import assets in other formats, please refer to [Extend Asset Types](#extend-asset-types).

:::tip SVG images
SVG image is a special case. Builder support convert SVG to React components, so SVG is processed separately. For details, see [Import SVG Assets](/guide/basic/svg-assets.html).
:::

## Import Assets in JS file

In JS files, you can directly import static assets in relative paths:

```tsx
// Import the logo.png image in the static directory
import logo from './static/logo.png';

export default = () => <img src={logo} />;
```

Import with [alias](/guide/advanced/alias.html) are also supported:

```tsx
import logo from '@/static/logo.png';

export default = () => <img src={logo} />;
```

## Import Assets in CSS file

In CSS files, you can reference static assets in relative paths:

```css
.logo {
  background-image: url('../static/logo.png');
}
```

Import with [alias](/guide/advanced/alias.html) are also supported:

```css
.logo {
  background-image: url('@/static/logo.png');
}
```

## Import Results

The result of importing static assets depends on the file size:

- When the file size is greater than 10KB, a URL will be returned, and the file will be output to the dist directory.
- When the file size is less than 10KB, it will be automatically inlined to Base64 format.

```js
import largeImage from './static/largeImage.png';
import smallImage from './static/smallImage.png';

console.log(largeImage); // "/static/largeImage.6c12aba3.png"
console.log(smallImage); // "data:image/png;base64,iVBORw0KGgo..."
```

For a more detailed introduction to asset inlining, please refer to the [Static Asset Inlining](/guide/optimization/inline-assets.html) chapter.

## Output Files

When static assets are imported, they will be output to the dist directory. You can:

- Modify the output filename through [output.filename](/en/api/config-output.html#outputfilename).
- Modify the output path through [output.distPath](/en/api/config-output.html#outputdistpath).

Please read [Output Files](/guide/basic/output-files.html) for details.

## URL Prefix

The URL returned after importing a asset will automatically include the path prefix:

- In development, using [dev.assetPrefix](/en/api/config-dev.html#devassetprefix) to set the path prefix.
- In production, using [output.assetPrefix](/en/api/config-output.html#outputassetprefix) to set the path prefix.

For example, you can set `output.assetPrefix` to `https://modern.com`:

```js
import logo from './static/logo.png';

console.log(logo); // "https://modern.com/static/logo.6c12aba3.png"
```

## Add Type Declaration

When you import static assets in TypeScript code, TypeScript may prompt that the module is missing a type definition:

```
TS2307: Cannot find module './logo.png' or its corresponding type declarations.
```

To fix this, you need to add a type declaration file for the static assets, please create a `src/global.d.ts` file, and add the corresponding type declaration. Taking png images as an example, you need to add the following declarations:

```ts title="src/global.d.ts"
declare module '*.png' {
  const content: string;
  export default content;
}
```

After adding the type declaration, if the type error still exists, you can try to restart the current IDE, or adjust the directory where `global.d.ts` is located, making sure the TypeScript can correctly identify the type definition.

## Extend Asset Types

If the built-in asset types in Builder cannot meet your requirements, you can modify the built-in webpack/Rspack configuration and extend the asset types you need using [tools.bundlerChain](/api/config-tools.html#toolsbundlerchain).

For example, if you want to treat `*.pdf` files as assets and directly output them to the dist directory, you can add the following configuration:

```ts
export default {
  tools: {
    bundlerChain(chain) {
      chain.module
        .rule('pdf')
        .test(/\.pdf$/)
        .type('asset/resource');
    },
  },
};
```

After adding the above configuration, you can import `*.pdf` files in your code, for example:

```js
import myFile from './static/myFile.pdf';

console.log(myFile); // "/static/myFile.6c12aba3.pdf"
```

For more information about asset modules, please refer to:

- [Rspack Documentation - Asset modules](https://www.rspack.dev/guide/asset-module.html#asset-modules)
- [webpack Documentation - Asset modules](https://webpack.js.org/guides/asset-modules/)

## Image Format

When using image assets, you can choose a appropriate image format according to the pros and cons in the table below.

| Format | Pros                                                                                                      | Cons                                                                                | Scenarios                                                                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PNG    | Lossless compression, no loss of picture details, no distortion, support for translucency                 | Not suitable for pictures with complex color tables                                 | Suitable for pictures with few colors and well-defined borders, suitable for logos, icons, transparent images and other scenes                         |
| JPG    | Rich colors                                                                                               | Lossy compression, which will cause image distortion, does not support transparency | Suitable for pictures with a large number of colors, gradients, and overly complex pictures, suitable for portrait photos, landscapes and other scenes |
| WebP   | Supports both lossy and lossless compression, supports transparency, and is much smaller than PNG and JPG | iOS compatibility is not good                                                       | Pixel images of almost any scene, and the hosting environment that supports WebP, should prefer WebP image format                                      |
| SVG    | Lossless format, no distortion, supports transparency                                                     | Not suitable for complex graphics                                                   | Suitable for vector graphics, suitable for icons                                                                                                       |
