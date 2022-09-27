- Type: `Record<string, unknown>`
- Default: `{}`

Replaces variables in your code with other values or expressions at compile time. This can be useful for allowing different behavior between development builds and production builds.

Each key passed into options is an identifier or multiple identifiers joined with `.`.

- If the value is a string it will be used as a code fragment.
- If the value isn't a string, it will be stringified (including functions).
- If the value is an object all keys are defined the same way.
- If you prefix typeof to the key, it's only defined for typeof calls.

For more information please visit [https://webpack.js.org/plugins/define-plugin/](https://webpack.js.org/plugins/define-plugin/).

#### Example

```js
export default {
  source: {
    define: {
      PRODUCTION: JSON.stringify(true),
      VERSION: JSON.stringify('5fa3b9'),
      BROWSER_SUPPORTS_HTML5: true,
      TWO: '1 + 1',
      'typeof window': JSON.stringify('object'),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'import.meta': { test: undefined },
    }
  }
}
```

Expressions will be replaced with the corresponding code fragments:

```js
const foo = TWO;

// ⬇️ Turn into being...
const foo = 1 + 1;
```
