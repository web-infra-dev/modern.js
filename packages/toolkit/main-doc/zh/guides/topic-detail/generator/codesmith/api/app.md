---
sidebar_position: 1
---

# @modern-js/codesmith-api-app

微生成器开发过程中常用 API 的组合封装，包含 fs、git、npm 等其他包的 API 封装，在能满足需求时，推荐使用该 npm 包的 API。

## 使用姿势

```typescript
import { AppAPI } from '@modern-js/codesmith-api-app';

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);
  await appApi.runInstall();
}
```

- 创建 AppAPI 实例，参数和微生成器函数参数一致，为 context 和 generator，具体介绍请看[微生成器项目组成](/docs/guides/topic-detail/generator/codesmith/structure)。
- 调用其实例上 API 即可。

## API

### checkEnvironment

检查当前生成器运行环境，检查项为：

1. node 及 node 版本，默认大于 12.22.12，可传递参数执行 node 版本。
2. 可使用 yarn、pnpm 或者 npm。

参数：

- nodeVersion?: `string` 校验的 node 版本。

### runInstall

安装依赖，可传入安装依赖命令，默认根据 config 中的 `packageManager` 值进行。

参数：

- command?: `string` 安装依赖命令。

### runGitAndInstall

该函数完成以下动作：

1. 校验当前生成器执行目录是否为一个 git 仓库。
2. 如果不是一个 git 仓库，初始化为一个 git 仓库。
3. 安装依赖。
4. 在非 monorepo 项目(判断条件，config 中 `isMonorepoSubProject` 不存在或者为 false)中提交初始 commit，commit 信息为 feat: init，支持自定义。

参数：
- commitMessage?: `string` 初始化 commit message 信息。
- installFunc?: `() => Promise<void>` 安装依赖函数。

### forgeTemplate

渲染生成器模板文件。

参数：

- templatePattern: string 模板文件匹配正则，例如： `templates/base-templates/**/*` 。
- filter?: `(resourceKey: string) => boolean` 过滤函数，参数为 templatePattern 匹配的文件路径，返回 true 表示渲染该文件，返回 false 表示不渲染该文件。
- rename?: `(resourceKey: string) => string` 重命名函数，参数为 templatePattern 匹配的文件路径，返回新文件名。默认会替换 resourceKey 开头的 templates 目录和结尾的 .handlebars 后缀。
- parameters?: `Record<string, any>` 渲染参数，当模板中存在 handlebars 或者 ejs 变量时，使用其传递对应变量值。
- type?: `'handlebars' | 'ejs'`  模板文件类型，默认为 handlebars。

例如:

```typescript
await appApi.forgeTemplate(
    'templates/base-templates/**/*',
    undefined,
    resourceKey =>
      resourceKey
        .replace('templates/base-templates/', '')
        .replace('.handlebars', ''),
  );

 await appApi.forgeTemplate(
    'templates/base-template/**/*',
    resourceKey => !resourceKey.include('eslintrc.json'),
    resourceKey =>
      resourceKey
        .replace('templates/base-template/', projectPath)
        .replace('language', language as string)
        .replace('.handlebars', ''),
    {
      name: packageName as string,
      language,
      isTs: language === Language.TS,
      packageManager: getPackageManagerText(packageManager as any),
    },
  );
```

### showSuccessInfo

展示成功信息。

参数：

- successInfo?: `string`，默认为 Success || 成功。

### runSubGenerator

运行子生成器。

参数：

- subGenerator: `string` 子生成器名称或者路径。
- relativePwdPath?: `string` 子生成器运行的相对路径。
- config?: `Record<string, unknown>` 子生成器运行的默认 config 配置。

例如：

```typescript
  await appApi.runSubGenerator(
    getGeneratorPath('@modern-js/repo-generator', context.config.distTag),
    undefined,
    { ...context.config, hasPlugin: false },
  );
```

### getInputBySchema

通过 schema 完成用户交互输入。

参数：

- schema: `FormilySchema | Question[]` 问题列表，支持 Formily schema 和 inquirer 类型。
- type: `'formily' | 'inquirer'` 类型，默认值为 formily。
- configValue: `Record<string, unknown> = {}`  schema 默认值，传入该值的 schema 字段对应的问题将不再和用户交互。
- validateMap?: `Record<string, (input: unknown, data?: Record<string, unknown>) => { success: boolean; error?: string }>` schema 中特殊字段的验证函数。
- initValue?: `Record<string, any>` schema 中字段的初始化值。

Formily Schema 类型支持方式可参考[自定义输入相关类型定义](/docs/guides/topic-detail/generator/plugin/api/input/type)。

### getInputBySchemaFunc

通过 schema 完成用户交互输入，schema 参数值为函数，用户处理国际化问题，仅支持 Formily schema。


参数：

- schema: `config?: Record<string, any>) => FormilySchema` 获取问题列表函数，config 参数为当前生成器中的 config 配置信息。
- configValue: `Record<string, unknown> = {}`  schema 默认值，传入该值的 schema 字段对应的问题将不再和用户交互。
- validateMap?: `Record<string, (input: unknown, data?: Record<string, unknown>) => { success: boolean; error?: string }>` schema 中特殊字段的验证函数。
- initValue?: `Record<string, any>` schema 中字段的初始化值。

Formily Schema 类型支持方式可参考[自定义输入相关类型定义](/docs/guides/topic-detail/generator/plugin/api/input/type)。
