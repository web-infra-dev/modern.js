- Type: `boolean`
- Default: `false`

Whether to disable source map.

By default, Builder generates the SourceMap of JS and CSS files for debugging and troubleshooting online issues.

If the project does not need SourceMap, you can turned off it to speed up the compile speed.

```js
export default {
  output: {
    disableSourceMap: true,
  },
};
```

If you want to enable source map in development and disable in the production, you can set to:

```js
export default {
  output: {
    disableSourceMap: process.env.NODE_ENV === 'production',
  },
};
```
