- **Type**

```ts
type DistPathConfig = {
  root?: string;
  js?: string;
  css?: string;
  svg?: string;
  font?: string;
  html?: string;
  image?: string;
  media?: string;
  server?: string;
};
```

- **Default**

```js
const defaultDistPath = {
  root: 'dist',
  html: 'html',
  js: 'static/js',
  css: 'static/css',
  svg: 'static/svg',
  font: 'static/font',
  image: 'static/image',
  media: 'static/media',
  server: 'bundles',
};
```

Set the directory of the dist files. Builder will output files to the corresponding subdirectory according to the file type.

Detail:

- `root`: The root directory of all files.
- `html`: The output directory of HTML files.
- `js`: The output directory of JavaScript files.
- `css`: The output directory of CSS style files.
- `svg`: The output directory of SVG images.
- `font`: The output directory of font files.
- `image`: The output directory of non-SVG images.
- `media`: The output directory of media resources, such as videos.
- `server`: The output directory of server bundles when target is `node`.

#### Example

The JavaScript files will be output to the `distPath.root` + `distPath.js` directory, which is `dist/static/js`.

If you need to output JavaScript files to the `build/resource/js` directory, you can add following config:

```js
export default {
  output: {
    distPath: {
      root: 'build',
      js: 'resource/js',
    },
  },
};
```
