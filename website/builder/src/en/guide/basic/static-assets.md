# Import Static Assets

Builder supports import static assets, including images, fonts, and medias.

## Assets Format

The following are the formats supported by Builder by default:

- **Image**: png, jpg, jpeg, gif, svg, bmp, webp, ico, apng, avif, tiff.
- **Fonts**: woff, woff2, eot, ttf, otf, ttc.
- **Media**: mp4, webm, ogg, mp3, wav, flac, aac, mov.

If you need to import static resources in other formats, please provide feedback through [GitHub Issues](https://github.com/modern-js-dev/modern.js/issues).

:::tip SVG images
SVG image is a special case. Builder support convert SVG to React components, so SVG is processed separately. For details, see "Import SVG Assets".
:::

## Import Assets in JS file

In JS files, you can directly import static assets in relative paths:

```tsx
// Import the logo.png image in the static directory
import logo from './static/logo.png';

export default = () => <img src={logo} />;
```

Import with [alias](/guide/basic/alias.html) are also supported:

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

Import with [alias](/guide/basic/alias.html) are also supported:

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

For a more detailed introduction to asset inlining, please refer to the [Static Asset Inlining](/guide/advanced/inline-assets.html) chapter.

## Output Files

When static assets are imported, they will be output to the dist directory. You can:

- Modify the output filename through [output.filename](/en/api/config-output.html#output-filename).
- Modify the output path through [output.distPath](/en/api/config-output.html#output-distpath).

## URL Prefix

The URL returned after importing a asset will automatically include the path prefix:

- In development, using [dev.assetPrefix](/en/api/config-dev.html#dev-assetprefix) to set the path prefix.
- In production, using [output.assetPrefix](/en/api/config-output.html#output-assetprefix) to set the path prefix.

For example, you can set `output.assetPrefix` to `https://modern.com`:

```js
import logo from './static/logo.png';

console.log(logo); // "https://modern.com/static/logo.6c12aba3.png"
```
