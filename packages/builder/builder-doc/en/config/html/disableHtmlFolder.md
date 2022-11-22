- Type: `boolean`
- Default: `false`

Remove the folder of the HTML files. When this option is enabled, the generated HTML file path will change from `[name]/index.html` to `[name].html`.

#### Example

By default, the structure of HTML files in the `dist` directory is:

```bash
/dist
└── html
    └── main
        └── index.html
```

Enable the `html.disableHtmlFolder` config:

```js
export default {
  html: {
    disableHtmlFolder: true,
  },
};
```

After recompiling, the directory structure of the HTML files in dist is:

```bash
/dist
└── html
    └── main.html
```

> If you want to set the path of the HTML files, use the `output.distPath.html` config.
