---
sidebar_position: 3
---

# Use the Copy Tools

The Module Project provides the Copy utility for copying already existing individual files or entire directories into the product directory. Next we learn how to use it.

## Understanding the Copy API

We can use the Copy tool via the [`buildConfig.copy`](/en/api/config/build-config#copy) API, which contains the following two main configurations.

- [`patterns`](/en/api/config/build-config#copypatterns)
- [`options`](/en/api/config/build-config#copyoptions)

It is recommended to spend some time getting to know them before you start learning.

## API Description

`copy.patterns` 用于寻找复制的文件以及配置输出的路径。

其中 `patterns.from` 用于指定要复制的文件或者目录。它接收 Glob 形式字符串或具体路径。Glob 形式字符串是指 [fast-glob pattern-syntax](https://github.com/mrmlnc/fast-glob#pattern-syntax)。因此我们可以按照如下两种方式使用它：

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

`patterns.context` 一般和 `patterns.from` 配合使用，默认情况下它的值与 [`buildConfig.sourceDir`](/api/config/build-config#sourcedir) 相同，因此我们可以按照如下方式指定 `src/data.json` 文件为要复制的文件：

> 默认情况下，`buildConfig.sourceDir` 为 `src`

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

当指定的文件不在源码目录的时候，可以修改 `context` 配置。例如指定项目目录下的 `temp/index.html` 为要复制的文件：

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

`patterns.to` 用于指定复制文件的输出路径，默认情况下它的值为 [`buildConfig.outDir`](/api/config/build-config#outDir)对应的值。因此我们按照如下方式将 `src/index.html` 复制到 `dist` 目录下：

```ts
export default defineConfig({
  buildConfig: {
    copy: {
      patterns: [{ from: './index.html' }],
    },
  },
});
```

当我们配置了 `patterns.to` 的时候：

- 如果是相对路径，则该路径会相对于 `buildConfig.outDir` 计算出复制文件输出的绝对路径。
- 如果是绝对路径，则会直接使用该值。

最后 `patterns.globOptions` 用于配置寻找复制文件 [globby](https://github.com/sindresorhus/globby) 对象，其配置可参考：

- [globby.options](https://github.com/sindresorhus/globby#options)

## 不同场景使用示例

### 将文件复制文件

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

### 将文件复制到目录

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

### 从目录复制到目录

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

### 从目录到文件

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

### 使用 Glob

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
