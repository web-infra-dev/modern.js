- **类型：** `boolean`
- **默认值：** `false`

是否生成 manifest 文件，该文件包含所有构建产物的信息。

### 示例

添加以下配置来开启：

```js
export default {
  output: {
    enableAssetManifest: true,
  },
};
```

开启后，当编译完成时，会自动生成 `dist/asset-manifest.json` 文件：

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

如果当前项目有多种类型构建产物，比如包含了 SSR 构建产物，那么会生成多份 manifest.json 文件。

- web 产物：`asset-manifest.json`
- node 产物：`asset-manifest-node.json`
