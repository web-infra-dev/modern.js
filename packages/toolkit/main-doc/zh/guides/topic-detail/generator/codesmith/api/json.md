---
sidebar_position: 2
---

# @modern-js/codesmith-api-json

微生成器中 JSON API 封装，提供常见的 JSON 文件操作方法。

## 使用姿势

```ts
import { JsonAPI } from '@modern-js/codesmith-api-json';

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const jsonAPI = new JsonAPI(generator);
  await jsonAPI.update(context.materials.default.get('package.json'), {
    query: {},
    update: {
      $set: {
        'dependencies.@modern-js/plugin-bff': `^2.0.0`,
      },
    },
  });
};
```

- 创建 JsonAPI 实例，参数为微生成器函数参数的 generator，具体介绍请看[微生成器项目组成](/docs/guides/topic-detail/generator/codesmith/structure)。
- 调用其实例上 API 即可。

## API

### get

获取 JSON 文件内容。

参数：

- resource: `FsResource`，文件资源，通过 `context.materials.default.get(<filename>)` 获取。

### extend

合并对象至 JSON 文件。

参数：

- resource: `FsResource` 通过 `context.materials.default.get(<filename>)` 获取。
- obj: `Record<string, any>` 需合并对象。

### update

更新对象字段至 JSON 文件。

参数：

- resource: `FsResource` 通过 `context.materials.default.get(<filename>)` 获取。
- operation: `{ query: Record<string, any>; update: Record<string, any> }` 更新操作，详细使用姿势查看 [declaration-update](https://www.npmjs.com/package/declaration-update)。
