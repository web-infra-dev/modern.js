---
sidebar_position: 4
---

# ESLint 全量规则集

<!-- 参考 [实战教程 - 确认编程环境](../handbook/c03-ide/3.1-setting-up) 确保本地 IDE 环境正常。 -->

**Modern.js ESLint 规则集**是全量的 **ESLint** 规则集合，包含 `@modern-js` （对于 Node.js 项目的 Lint 规则）和 `@modern-js-app`（对于前端项目的 Lint 规则）。

下面以具体问题介绍更多 ESLint 用法。

## Q: 如何处理 Lint

### 实时自动修复

多数问题会被 ESLint 规则的自动修复功能或 [Prettier](https://prettier.io/) 的代码格式化功能（已被集成到 ESLint 里）自动解决，开发者不需要关心问题的细节和解决方式。

:::info 注
主要在 IDE 保存文件的环节执行这种自动修复，少数漏网之鱼会在提交代码环节被自动修复。
:::info 注
### 批量自动修复

在少数情况下，比如旧项目迁移的时候，可以执行以下命令，批量修复和检查所有文件：

```bash
pnpm run lint:error
```

### 人工修复

对于无法自动修复的问题，可以在 IDE 里点击问题提示框里的规则链接，打开这条规则的文档，查看问题的解释和解决方案。


### 声明例外情况

目前阶段，有些规则并不能做到足够智能，多数情况下会有很大收益，在少数情况下也许不适用。但如果为了这些少数情况就把整个规则关掉或改掉，得不偿失。

这种情况下可以用 [eslint-disable](https://eslint.org/docs/user-guide/configuring/rules#disabling-rules) 注释，对符合**少数情况**的代码块做标注，声明这里是一个例外，应该忽略。比如：

```js
/* eslint-disable filenames/match-exported */
...
/* eslint-enable filenames/match-exported */
```

:::info 注
在 VS Code 编辑器里输入 eslint，会自动出现关于 "eslint-disable" 的提示框，选择提示选项生成对应注释对。
:::

【Modern.js ESLint 规则集】要求 [eslint-disable](https://eslint.org/docs/user-guide/configuring/rules#disabling-rules) 必须成对使用，必须明确表达要影响的范围，以及在这个范围内明确表达要禁用什么规则，目的是让**例外**有明确的、最小化的范围，避免 [eslint-disable](https://eslint.org/docs/user-guide/configuring/rules#disabling-rules) 被滥用，导致不属于例外的代码也被禁用了规则。

### 添加自定义配置

<!-- 见 [如何自定义 Lint 规则](/guide/more-guides/more-about-lint#q-如何自定义-lint-规则) -->

## Q: 如何自定义 ESLint 规则

### 仓库根目录下 `package.json` 里的 "eslintConfig" 字段

这个地方是整个仓库的默认 ESLint 配置，是针对纯 Node.js 代码（只能在 Node.js 里运行）设计的。

如果项目在某些规则上确实有特殊要求或不可避免的兼容问题（不是例外），可以在这里增加规则配置。该配置会优先于默认的【Modern.js ESLint 规则集】，比如：

```json
 "eslintConfig": {
    "extends": [
      "@modern-js"
    ],
    "rules": {
      "filenames/match-exported": "off"
    }
  },

```

### `src/.eslintrc.json` 文件

Modern.js 的 MWA 项目、模块项目，源代码目录里都会默认有这个配置文件，是针对 Universal JS 代码设计的。

:::info 注
Universal JS 代码是既能浏览器端也能在服务器端运行的代码。
:::

如果项目在某些规则上确实有特殊要求或不可避免的兼容问题（不是例外），可以在这里增加规则配置，该配置会优先于默认的【Modern.js ESLint 规则集】，比如：

```json
{
  "extends": [
    "@modern-js-app"
  ],
  "rules": {
    "filenames/match-exported": "off"
  }
}
```

如果有需要，还可以继续在不同的子目录里增加 `.eslintrc.json` 文件，针对这个子目录里的代码做特殊配置：

```json
{
  "rules": {
    "filenames/match-exported": "off"
  }
}
```

:::tip 提示
注意：没有必要使用 `extends` 字段，会自动继承父目录的配置。
:::

### package.json 里的 `eslintIgnore` 字段

把包含 `.js`、`.jsx`、`.ts`、`.tsx` 文件、但不需要做代码检查和自动修复的目录，添加到 `eslintIgnore` 里，可以优化 ESLint 检查的速度，比如：

```json
 "eslintIgnore": [
    "node_modules",
    "dist",
    "output"
  ],
```

## Q: 如何升级 ESLint 插件的版本

只要不是 Major 版本的变化（不符合 [Semver](https://semver.org/) 规则的 `^` 符号），就可以直接在业务项目的 `package.json` 里指定这个依赖，删除 Lock 文件（或尝试手动删除 Lock 文件中这个包名的内容），执行 `pnpm install` 重新安装依赖并且生成新的 Lock 文件。

做完这些操作之后，在业务项目的 `./node_modules` 目录里，这个插件应该只存在一份，并且升级到了你指定的版本。

:::tip 提示
- Major 版本就是主版本号。更多信息，请阅读【[Semantic Versioning](https://semver.org/#summary)】。
- 所有被 Modern.js 封装的上游项目（比如 ESLint、[ESLint 插件](https://eslint.org/docs/user-guide/configuring/plugins#plugins)、[React Router](https://reactrouter.com/) 等），也都可以这样升级。
- Modern.js 也会在每次发版中尽量及时的升级这些上游依赖。
- Major 版本的升级需要由 Modern.js 来发版。
:::

## Q: WebStorm 有时候会报 ESLint 错误

由于 WebStorm 认为 ESLint 执行目录是根据 `.eslintrc` 文件来决定的。因此 `src/.eslintrc` 文件位置的放置会导致 `tsconfig.json` 文件指定的位置（项目根目录下）在 `src/` 目录下找不到。

此时需要手动配置一下：

```json
--parser-options=project:../tsconfig.json
```

![webstorm-lint-error](https://lf3-static.bytednsdoc.com/obj/eden-cn/aphqeh7uhohpquloj/modern-js/docs/webstorm-lint-error.png)
