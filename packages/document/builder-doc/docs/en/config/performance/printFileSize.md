- **Type:** `boolean`
- **Default:** `true`

Whether to print the file sizes after production build.

```bash
info    Production file sizes:

  File                                      Size         Gzipped
  dist/static/js/lib-react.09721b5c.js      152.6 kB     49.0 kB
  dist/html/main/index.html                 5.8 kB       2.5 kB
  dist/static/js/main.3568a38e.js           3.5 kB       1.4 kB
  dist/static/css/main.03221f72.css         1.4 kB       741 B
```

### Example

Disable the logs:

```ts
export default {
  performance: {
    printFileSize: false,
  },
};
```
