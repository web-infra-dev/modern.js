---
sidebar_position: 3
---

# 使用 Copy 工具

模块工程提供了 Copy 工具用于将已经存在的单个文件或整个目录复制到产物目录中。接下来我们学习如何使用它。

## 了解 Copy API

我们可以通过 [`buildConfig.copy`](/api/config/build-config#copy) API 来使用 Copy 工具，它包含以下两个主要配置：

- [`patterns`](/api/config/build-config#copypatterns)
- [`options`](/api/config/build-config#copyoptions)

在开始学习之前可以先花一些时间了解它们。

## API 详解

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
