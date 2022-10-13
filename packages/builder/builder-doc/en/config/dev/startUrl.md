- Type: `boolean | string | string[] | undefined`
- Default: `undefined`

`dev.startUrl` is used to set the page to open when starting,and the default is not to open. You can set it to the following values:

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
