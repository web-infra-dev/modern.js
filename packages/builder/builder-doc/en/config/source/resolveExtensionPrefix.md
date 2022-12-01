- Type: `string | Record<BuilderTarget, string>`
- Default: `undefined`

Add a prefix to [resolve.extensions](https://webpack.js.org/configuration/resolve/#resolveextensions).

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

#### Set according to Targets

When you build targets at the same time, you can set different extension prefix for different targets. At this point, you need to set `resolveExtensionPrefix` to an object whose key is the corresponding build target.

For example to set different extension prefix for `web` and `node`:

```js
export default {
  output: {
    source: {
      resolveExtensionPrefix: {
        web: '.web',
        node: '.node',
      },
    },
  },
};
```

When `import './foo'` in the code, the `foo.node.js` file will be resolved for node target, and the `foo.web.js` file will be resolved for web target.
