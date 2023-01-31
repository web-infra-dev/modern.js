- **Type**

```ts
type FilenameConfig = {
  js?: string;
  css?: string;
  svg?: string;
  font?: string;
  image?: string;
  media?: string;
};
```

- **Default**

```js
// Development
const devDefaultFilename = {
  js: '[name].js',
  css: '[name].css',
  svg: '[name].[contenthash:8].svg',
  font: '[name].[contenthash:8][ext]',
  image: '[name].[contenthash:8][ext]',
  media: '[name].[contenthash:8][ext]',
};

// Production
const prodDefaultFilename = {
  js: '[name].[contenthash:8].js',
  css: '[name].[contenthash:8].css',
  svg: '[name].[contenthash:8].svg',
  font: '[name].[contenthash:8][ext]',
  image: '[name].[contenthash:8][ext]',
  media: '[name].[contenthash:8][ext]',
};
```

Sets the filename of dist files.

After the production build, there will be a hash in the middle of the filename by default. You can disable this behavior through the `output.disableFilenameHash` config.

Detail:

- `js`: The name of the JavaScript file.
- `css`: The name of the CSS style file.
- `svg`: The name of the SVG image.
- `font`: The name of the font file.
- `image`: The name of a non-SVG image.
- `media`: The name of a media asset, such as a video.

### Example

Set the name of the JavaScript file to `[name]_script.js`:

```js
export default {
  output: {
    filename: {
      js:
        process.env.NODE_ENV === 'production'
          ? '[name]_script.[contenthash:8].js'
          : '[name]_script.js',
    },
  },
};
```
