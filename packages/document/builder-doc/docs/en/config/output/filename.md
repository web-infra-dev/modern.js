- **Type:**

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

- **Default:**

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

After the production build, there will be a hash in the middle of the filename by default. This behavior can be disabled through the `output.disableFilenameHash` config.

The following are the details of each filename:

- `js`: The name of the JavaScript file.
- `css`: The name of the CSS style file.
- `svg`: The name of the SVG image.
- `font`: The name of the font file.
- `image`: The name of a non-SVG image.
- `media`: The name of a media asset, such as a video.

### Example

To set the name of the JavaScript file to `[name]_script.js`, use the following configuration:

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

:::tip Filename hash
Usually, we only set the filename hash in the production mode (i.e., when `process.env.NODE_ENV === 'production'`).

If you set the filename hash in the development mode, it may cause HMR to fail (especially for CSS files). This is because every time the file content changes, the hash value changes, preventing tools like [mini-css-extract-plugin](https://www.npmjs.com/package/mini-css-extract-plugin) from reading the latest file content.
:::

### Filename of Async Modules

When you import a module via dynamic import, the module will be bundled into a single file, and its default naming rules are as follows:

- In the development environment, the filename will be generated based on the module path, such as `dist/static/js/async/src_add_ts.js`.
- In the production environment, it will be a random numeric id, such as `dist/static/js/async/798.27e3083e.js`. This is to avoid leaking the source code path in the production environment, and the number of characters is also less.

```js title="src/index.ts"
const { add } = await import('./add.ts');
```

If you want to specify a fixed name for the async module, you can use the [magic comments](https://webpack.js.org/api/module-methods/#magic-comments) provided by the bundler to achieve this, using `webpackChunkName ` to specify the module name:

```js title="src/index.ts"
const { add } = await import(
  /* webpackChunkName: "my-chunk-name" */ './add.ts'
);
```

After specifying the module name as above, the generated file will be `dist/static/js/async/my-chunk-name.js`.
