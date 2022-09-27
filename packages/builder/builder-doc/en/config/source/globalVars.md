- Type: `Record<string, JSONValue>`
- Default: `{}`

Define global variables. It will replace all expr like `process.env.FOO` in your code at compile time.

Such as:

```js
console.log(process.env.NODE_ENV);

// ⬇️ Turn into being...
console.log('development');
```

Values of options record should be JSON-safe, so it can be serialized.
And each key will be connected with the prefix `process.env`.

The environment variable `NODE_ENV` will be added to `globalVars` by default, so you don't need to set it in manually.

Doesn't works with destructuring assignment, because builder does not know if `NODE_ENV` and `process.env.NODE_ENV` are associated:

```js
const { NODE_ENV } = process.env;
console.log(NODE_ENV);
// ❌ Won't get a string.
```
You can take `globalVars` as the syntax sugar of `define`, which makes it easier to set the value of global variables.

```js
export default {
  source: {
    globalVars: {
      NODE_ENV: 'development',
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('development'),
    },
  },
};
```

#### Example

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
