- Type: `'ascii' | 'utf8'`
- Default: `'ascii'`

By default, Builder's output is ASCII-only and will escape all non-ASCII characters.

If you want to output the original characters without using escape sequences, you can set `output.charset` to `utf8`.

```js
export default {
  output: {
    charset: 'utf8',
  },
};
```

Builder will automatically add `<meta charset="utf-8">` to the generated HTML files if `output.charset` is `utf8`.
