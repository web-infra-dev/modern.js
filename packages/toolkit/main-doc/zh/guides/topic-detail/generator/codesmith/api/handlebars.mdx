---
sidebar_position: 5
---

# @modern-js/codesmith-api-handlebars

微生成器中使用 [handlebars](https://handlebarsjs.com/) 进行文件操作的 API 封装，提供渲染单个模板文件和文件夹的方法。

## 使用姿势

```ts
import { HandlebarsAPI } from '@modern-js/codesmith-api-handlebars';

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const handlebarApi = new HandlebarsAPI(generator);
  await handlebarsAPI.renderTemplate(
     material.get('templates/a.js'),
     target: 'b.js',
     { data: "data" }
   );
}
```

- 创建 HandlebarsAPI 实例，参数为微生成器函数参数的 generator，具体介绍请看微生成器项目组成 。
- 调用其实例上 API 即可。

## API

### renderTemplate

渲染单个模板文件。

参数：

- templateResource: `FsResource` 模板文件资源，通过 `context.materials.get(<filename>)` 使用。
- target: `string` 目标文件路径名称。
- parameters?: `Record<string, string>` 渲染参数。

### renderTemplateDir

渲染模板文件夹。

参数：

- material: `FsMaterial` 当前微生成器执行的 material 上下文。
- findGlob: `string` 模板文件匹配正则。
- target: `(globMatch: string) => string` 目标文件路径生成函数，参数为 `resourceKey。`
- options?: `RenderTemplateDirOptions` glob 查找文件配置，具体函数可查看这里 [glob](https://www.npmjs.com/package/glob)。

```ts
type RenderTemplateDirOptions = {
  nodir?: boolean;
  dot?: boolean;
  ignore?: string | readonly string[];
};
```
