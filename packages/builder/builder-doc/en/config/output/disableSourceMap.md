- Type: `boolean`
- Default: `false`

By default, Builder generates the SourceMap of JS and CSS files after production build for debugging and troubleshooting online issues.

If the project does not need SourceMap in the production environment, you can turned off it to speed up the build speed.

```js
export default {
  output: {
    disableSourceMap: true,
  },
};
```
