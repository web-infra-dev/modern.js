# Output Files

This chapter will introduces the directory structure of output files and how to control the output directory of different types of files.

## Default Directory Structure

The following is a basic directory for output files. By default, the compiled files will be output in the `dist` directory of current project.

```bash
dist
├── static
│   ├── css
│   │   ├── [name].[hash].css
│   │   └── [name].[hash].css.map
│   │
│   └── js
│       ├── [name].[hash].js
│       ├── [name].[hash].js.LICENSE.txt
│       └── [name].[hash].js.map
│
└── html
    └── [name]
        └── index.html
```

The most common output files are HTML files, JS files, and CSS files:

- HTML files: default output to the `html` directory.
- JS files: default output to `static/js` directory,
- CSS files: default output to the `static/css` directory.

In addition, JS files and CSS files sometimes generate some related files:

- License files: contains open source license, which is output to the same level directory of the JS file, and adds `.LICENSE.txt` suffix.
- Source Map files: contains the source code mappings, which is output to the same level directory of JS files and CSS files, and adds a `.map` suffix.

In the filename, `[name]` represents the entry name corresponding to this file, such as `index`, `main`. `[hash]` is the hash value generated based on the content of the file.

## Modify the Directory

Builder provides some configs to modify the directory or filename, you can:

- Modify the filename through [output.filename](/en/api/config-output.html#output-filename).
- Modify the output path of through [output.distPath](/en/api/config-output.html#output-distpath).
- Modify the license file through [output.legalComments](/en/api/config-output.html#output-legalcomments).
- Remove Source Map file through [output.disableSourceMap](/en/api/config-output.html#output-disablesourcemap).
- Remove the folder corresponding to the HTML files through [html.disableHtmlFolder](/en/api/config-html.html#html-disablehtmlfolder).

## Static Assets

When you import static assets such as images, SVG, fonts, media, etc. in the code, they will also be output to the `dist/static` directory, and automatically assigned to the corresponding subdirectories according to the file type:

```bash
dist
└── static
    ├── image
    │   └── foo.[hash].png
    │
    ├── svg
    │   └── bar.[hash].svg
    │
    ├── font
    │   └── baz.[hash].woff2
    │
    └── media
        └── qux.[hash].mp4
```

You can use the [output.distPath](/en/api/config-output.html#output-distpath) config to uniformly input these static assets into a directory, for example, output to the `assets` directory:

```ts
export default {
  output: {
    distPath: {
      image: 'assets',
      svg: 'assets',
      font: 'assets',
      media: 'assets',
    },
  },
};
```

The above config produces the following directory structure:

```bash
dist
└── assets
    ├── foo.[hash].png
    ├── bar.[hash].svg
    ├── baz.[hash].woff2
    └── qux.[hash].mp4
```

## Node.js Output Directory

When the [Build Target](/guide/basic/build-target.html) of Builder contains `'node'`, or you have enabled server-side features such as SSR in the upper framework, Builder will generate some output files for Node.js and output them to the `bundles` directory:

```bash
dist
├── bundles
│   └── [name].js
├── static
└── html
```

Node.js files usually only contain JS files, no HTML or CSS. Also, JS file names will not contain hash.

You can modify the output path of Node.js files through the [output.distPath.server](/en/api/config-output.html#output-distpath) config.

For example, output Node.js files to the `server` directory:

```ts
export default {
  output: {
    distPath: {
      server: 'server',
    },
  },
};
```

## Flatten the Directory

Sometimes you don't want the dist directory to have too many levels, you can set the directory to an empty string to flatten the generated directory.

See the example below:

```ts
export default {
  output: {
    distPath: {
      js: '',
      css: '',
      html: '',
    },
    disableHtmlFolder: true,
  },
};
```

The above config produces the following directory structure:

```bash
dist
├── [name].[hash].css
├── [name].[hash].css.map
├── [name].[hash].js
├── [name].[hash].js.map
└── [name].html
```

## Not Written to Disk

By default, Builder will write the generated files to disk, so developers can view the file content or configure proxy rules for static assets.

In development, you can choose to keep the generated files in the Dev Server's memory to reduce the overhead of file operations.

Just set the `dev.writeToDisk` config to `false`:

```ts
export default {
  dev: {
    writeToDisk: false,
  },
};
```
