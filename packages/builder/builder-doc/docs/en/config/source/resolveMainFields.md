- Type:

```ts
type Fields = (string | string[])[];

type ResolveMainFields = Fields | Record<BuilderTarget, Fields>;
```

- Default: `undefined`

This config will determine which field of `package.json` you use to import the `npm` module. Same as the [resolve.mainFields](https://webpack.js.org/configuration/resolve/#resolvemainfields) config of webpack.

#### Example

```js
export default {
  source: {
    resolveMainFields: ['main', 'browser', 'exports'],
  },
};
```

#### Set according to Targets

When you build multiple targets at the same time, you can set different mainFields for different targets. At this point, you need to set `resolveMainFields` to an object whose key is the corresponding build target.

For example to set different mainFields for `web` and `node`:

```js
export default {
  output: {
    source: {
      resolveMainFields: {
        web: ['main', 'browser', 'exports'],
        node: ['main', 'node', 'exports'],
      },
    },
  },
};
```
