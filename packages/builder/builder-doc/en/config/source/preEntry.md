- Type: `string | string[]`
- Default: `undefined`

Add a script before the entry file of each page. This script will be executed before the page code. It can be used to execute global logics, such as polyfill injection.

#### Add a single script

First create a `src/polyfill.ts` file:

```js
console.log('I am a polyfill');
```

Then configure `src/polyfill.ts` to `source.preEntry`:

```js
export default {
  source: {
    preEntry: './src/polyfill.ts',
  },
};
```

Re-run the compilation and visit any page, you can see that the code in `src/polyfill.ts` has been executed, and the `I am a polyfill` is logged in the console.

#### Add multiple scripts

Multiple scripts can be added by setting `preEntry` to an array:

```js
export default {
  source: {
    preEntry: ['./src/polyfill-a.ts', './src/polyfill-b.ts'],
  },
};
```
