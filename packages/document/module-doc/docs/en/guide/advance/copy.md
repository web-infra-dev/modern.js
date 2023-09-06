---
sidebar_position: 3
---

# Use the Copy Tools

The Module Project provides the Copy utility for copying already existing individual files or entire directories into the output directory. Next we learn how to use it.

## Understanding the Copy API

We can use the Copy tool via the [`buildConfig.copy`](/en/api/config/build-config#copy) API, which contains the following two main configurations.

- [`patterns`](/en/api/config/build-config#copypatterns)
- [`options`](/en/api/config/build-config#copyoptions)

## API Description

`copy.patterns` is used to find files to be copied and configure the output path.

The `patterns.from` parameter is used to specify the file or directory to be copied. It accepts either a Glob pattern string or a specific path. A Glob pattern string refers to the [fast-glob pattern syntax](https://github.com/mrmlnc/fast-glob#pattern-syntax). Therefore, we can use it in two ways as follows:

```ts
export default defineConfig({
  buildConfig: {
    copy: {
      patterns: [
        { from: './index.html', to: '' },
        { from: './*.html', to: '' },
      ],
    },
  },
});
```


The `patterns.context` parameter is generally used in conjunction with `patterns.from`. By default, its value is the same as [`buildConfig.sourceDir`](/api/config/build-config#sourcedir). Therefore, we can specify the file `src/data.json` to be copied in the following way:

> By default, `buildConfig.sourceDir` is set to `src`.

```ts
export default defineConfig({
  buildConfig: {
    copy: {
      patterns: [
        { from: './data.json' to: ''},
      ],
    },
  },
});
```

When the specified file is not in the source code directory, you can modify the `context` configuration. For example, to specify the file `temp/index.html` in the project directory to be copied:

```ts
import path from 'path';

export default defineConfig({
  buildConfig: {
    copy: {
      patterns: [
        {
          from: './index.html',
          context: path.join(__dirname, './temp')
          to: '',
        }
      ],
    },
  },
});
```

The `patterns.to` parameter is used to specify the output path for the copied files. By default, its value corresponds to [buildConfig.outDir](/api/config/build-config#outDir). Therefore, we can copy `src/index.html` to the `dist` directory as follows:

```ts
export default defineConfig({
  buildConfig: {
    copy: {
      patterns: [{ from: './index.html' }],
    },
  },
});
```

When we configure `patterns.to`:

- If it is a relative path, the path will be calculated relative to `buildConfig.outDir` to determine the absolute path for copying the files.
- If it is an absolute path, the value will be used directly.

Finally, `patterns.globOptions` is used to configure the [globby](https://github.com/sindresorhus/globby) object for finding files to copy. Its configuration can be referenced from:

- [globby.options](https://github.com/sindresorhus/globby#options)

## Examples of Different Scenarios

### Copying Files

```ts
export default defineConfig({
  buildConfig: [
    {
      outDir: 'dist',
      copy: {
        patterns: [
          /**
           * copy file to file
           */
          {
            from: './temp-1/a.png',
            context: __dirname,
            to: './temp-1/b.png',
          },
        ],
      },
    },
  ],
});
```

### Copying Files to a Directory

```ts
export default defineConfig({
  buildConfig: [
    {
      outDir: 'dist',
      copy: {
        patterns: [
          /**
           * copy file to dir
           */
          {
            from: './temp-2/a.png',
            context: __dirname,
            to: './temp-2',
          },
        ],
      },
    },
  ],
});
```

### Copying from Directory to Directory

```ts
export default defineConfig({
  buildConfig: [
    {
      outDir: 'dist',
      copy: {
        patterns: [
          /**
           * copy dir to dir
           */
          {
            from: './temp-3/',
            to: './temp-3',
            context: __dirname,
          },
        ],
        options: {
          enableCopySync: true,
        },
      },
    },
  ],
});
```

### Copying from Directory to File

```ts
export default defineConfig({
  buildConfig: [
    {
      outDir: 'dist',
      copy: {
        patterns: [
          /**
           * copy dir to file
           */
          {
            from: './temp-4/',
            context: __dirname,
            to: './temp-4/_index.html',
          },
        ],
        options: {
          enableCopySync: true,
        },
      },
    },
  ],
});
```

### Using Glob

```ts
export default defineConfig({
  buildConfig: [
    {
      outDir: 'dist',
      copy: {
        patterns: [
          /**
           * copy glob to dir
           */
          {
            from: './*.html',
            to: './temp-5',
          },
        ],
        options: {
          enableCopySync: true,
        },
      },
    },
    {
      copy: {
        patterns: [
          /**
           * copy glob to file
           */
          {
            from: './*.html',
            to: './temp-6/index.html',
          },
        ],
        options: {
          enableCopySync: true,
        },
      },
    },
  ],
});
```
