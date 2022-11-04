- Type: `url` | `component`
- Default: `url`

`output.svgDefaultExport` is used to configure the default export type of SVG files.

When `output.svgDefaultExport` is set to `url` , the default export of SVG files is the URL of the file. For example:

```js
import logo from './logo.svg';

console.log(logo); // => resource url
```

When `output.svgDefaultExport` is set to `component` , the default export of SVG files is the React component of the file. For example:

```js
import Logo from './logo.svg';

console.log(Logo); // => React Component
```

At this time, you can also specify the `?url` query to import the URL, for example:

```js
import logo from './logo.svg?url';

console.log(logo); // => resource url
```
