- Type: `Record<string, false | string | Record<string, string | boolean>>`
- Default: `undefined`

Configure the `<meta>` tag of the HTML.

#### String Type

When the `value` of a `meta` object is a string, the `key` of the object is automatically mapped to `name`, and the `value` is mapped to `content`.

For example to set `description`:

```js
export default {
  html: {
    meta: {
      description: 'a description of the page',
    },
  },
};
```

The `meta` tag in HTML is:

```html
<meta name="description" content="a description of the page" />
```

#### Object Type

When the `value` of a `meta` object is an object, the `key: value` of the object is mapped to the attribute of the `meta` tag.

In this case, the `name` and `content` properties will not be set by default.

For example to set `http-equiv`:

```js
export default {
  html: {
    meta: {
      'http-equiv': {
        'http-equiv': 'x-ua-compatible',
        content: 'ie=edge',
      },
    },
  },
};
```

The `meta` tag in HTML is:

```html
<meta http-equiv="x-ua-compatible" content="ie=edge" />
```

### Remove Default Value

Setting the `value` of the `meta` object to `false` and the meta tag will not be generated.

For example to remove the `imagemode`:

```ts
export default {
  html: {
    meta: {
      imagemode: false,
    },
  },
};
```
