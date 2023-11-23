- **Type:** `boolean`
- **Default:** `false`

Whether to generate a manifest file that contains information of all assets.

### Example

Enable asset manifest:

```js
export default {
  output: {
    enableAssetManifest: true,
  },
};
```

After compiler, there will be a `dist/manifest.json` file:

```json
{
  "files": {
    "main.css": "/static/css/main.45b01211.css",
    "main.js": "/static/js/main.52fd298f.js",
    "html/main/index.html": "/html/main/index.html"
  },
  "entrypoints": ["static/css/main.45b01211.css", "static/js/main.52fd298f.js"]
}
```

If the current project has multiple types of build artifacts, such as including SSR build artifacts, multiple manifest.json files will be generated.

- web artifact: `asset-manifest.json`
- node artifact: `asset-manifest-node.json`
