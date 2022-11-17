- Type: `boolean | string | string[] | undefined`
- Default: `undefined`

`dev.startUrl` is used to set the URL of the page that automatically opens in the browser when Dev Server starts.

By default, no page will be opened.

You can set it to the following values:

```js
export default {
  dev: {
    // Open the project's default preview page
    startUrl: true,
    // Open the specified page
    startUrl: 'http://localhost:8080',
    // Open multiple pages
    startUrl: ['http://localhost:8080', 'http://localhost:8080/about'],
  },
};
```
