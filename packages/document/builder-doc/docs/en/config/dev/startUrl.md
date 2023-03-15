- **Type:** `boolean | string | string[] | undefined`
- **Default:** `undefined`

`dev.startUrl` is used to set the URL of the page that automatically opens in the browser when Dev Server starts.

By default, no page will be opened.

You can set it to the following values:

```js
export default {
  dev: {
    // Open the project's default preview page, equivalent to `http://localhost:<port>`
    startUrl: true,
    // Open the specified page
    startUrl: 'http://localhost:8080',
    // Open multiple pages
    startUrl: ['http://localhost:8080', 'http://localhost:8080/about'],
  },
};
```

### Port placeholder

Since the port number may change, you can use the `<port>` placeholder to refer to the current port number, and Builder will automatically replace the placeholder with the actual listening port number.

```js
export default {
  dev: {
    startUrl: 'http://localhost:<port>/home',
  },
};
```
