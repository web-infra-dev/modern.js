- **Type:** `Record<string, JSONValue>`
- **Default:**

```ts
const defaultGlobalVars = {
  // The environment variable `process.env.NODE_ENV` will be added by default,
  // so you don't need to set it in manually.
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
};
```

Define global variables. It can replace expressions like `process.env.FOO` in your code after compile. Such as:

```js
console.log(process.env.NODE_ENV);

// ⬇️ Turn into being...
console.log('development');
```

Doesn't works with destructuring assignment, because builder does not know if `NODE_ENV` and `process.env.NODE_ENV` are associated:

```js
const { NODE_ENV } = process.env;
console.log(NODE_ENV);
// ❌ Won't get a string.
```

You can take `source.globalVars` as the syntax sugar of `source.define`, the only difference is that `source.globalVars` will automatically stringify the value, which makes it easier to set the value of global variables. The values of `globalVars` should be JSON-safe to ensure it can be serialized.

```js
export default {
  source: {
    globalVars: {
      'process.env.BUILD_VERSION': '0.0.1',
      'import.meta.foo': { bar: 42 },
      'import.meta.baz': false,
    },
    define: {
      'process.env.BUILD_VERSION': JSON.stringify('0.0.1'),
      'import.meta': {
        foo: JSON.stringify({ bar: 42 }),
        baz: JSON.stringify(false),
      },
    },
  },
};
```

### Example

Add the following config to use:

```js
export default {
  source: {
    globalVars: {
      ENABLE_VCONSOLE: true,
      APP_CONTEXT: { answer: 42 },
    },
  },
};
```
