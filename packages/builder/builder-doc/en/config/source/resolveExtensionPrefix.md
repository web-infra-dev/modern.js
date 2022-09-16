- Type: `string`
- Default: `undefined`

Add a prefix to `resolve.extensions`.

If multiple files share the same name but have different extensions, Builder will resolve the one with the extension listed first in the array and skip the rest.

#### Example

```js
export default {
  source: {
    resolveExtensionPrefix: '.web',
  },
};
```

With the configuration above, the extensions array will become:

```js
// before
const extensions = ['.js', '.ts', ...];

// after
const extensions = ['.web.js', '.js', '.web.ts' , '.ts', ...];
```

When `import './foo'` in the code, the `foo.web.js` file will be resolved first, then the `foo.js` file.
