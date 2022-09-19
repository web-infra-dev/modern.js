- Type: `boolean`
- Default: `false`

Remove the hash from the name of static files after production build.

After the production build, there will be a hash in the middle of the filename by default. You can disable this behavior through the `output.disableFilenameHash` config.

#### Example

By default, the filename is:

```bash
File                                     Size         Gzipped
dist/static/css/187.7879e19d.css         126.99 KB    9.17 KB
dist/static/js/main.18a568e5.js          2.24 KB      922 B
```

Add `output.disableFilenameHash` config:

```js
export default {
  output: {
    disableFilenameHash: true,
  },
};
```

After rebuild, the filenames become:

```bash
File                            Size         Gzipped
dist/static/css/187.css         126.99 KB    9.17 KB
dist/static/js/main.js          2.24 KB      922 B
```
