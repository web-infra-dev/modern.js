# 命令预览

模块工程项目可以使用的命令：

## `modern build`

``` bash
Usage: modern build [options]

构建模块命令

Options:
  -w, --watch            使用监听模式构建代码
  --tsconfig [tsconfig]  指定 tsconfig.json 文件的路径 (default:
                         "./tsconfig.json")
  --platform [platform]  构建所有或者指定平台的产物
  --no-dts               关闭 DTS 类型文件生成和类型检查
  --no-clear             关闭自动清除产物输出目录的行为
  -h, --help             展示当前命令的信息
```

当想要启动项目构建的时候，可以执行 `modern build` 命令。在使用这个命令的时候，我们可以：

- 当想要以观察模式启动构建时，使用 `--watch` 选项。
- 当想要指定项目编译读取的 TypeScript 配置文件的路径时，使用 `build --tsconfig ./path/config.json` 选项。使用该选项后，会覆盖所有 [`buildConfig`](/zh/api/config-build) 里 [`dts.tsconfigPath`](/zh/api/config-build) 配置。
- 当需要关闭项目的 DTS 类型文件生成和类型检查行为时，可以使用 `--no-dts` 选项。**注意：类型文件的生成依赖类型检查的结果。如果关闭了类型检查，那么类型文件也不会生成**。
- 当需要关闭自动清除产物输出目录的行为时，可以使用 `--no-clear` 选项。

除了以上，模块工程还支持 `platform` 构建模式，可以用于执行其他工具的构建任务。例如，目前官方支持在安装了 `@modern-js/plugin-storybook` 插件后，可以通过执行 `modern build --platform` 或者 `modern build --platform storybook` 命令启动 Storybook 构建任务生成 Storybook 产物。

:::tip{title=注意}
在执行 Storybook 构建的时候，它需要读取项目的构建产物。因此**在执行 `modern build --platform` 命令启动 Storybook 构建的时候，要先执行一次 `modern build` 确保源码构建产物的存在**。
:::

## `modern new`

``` bash
Usage: modern new [options]

模块化工程方案中执行生成器

Options:
  -d, --debug            开启 Debug 模式，打印调试日志信息 (default: false)
  -c, --config <config>  生成器运行默认配置(JSON 字符串)
  --dist-tag <tag>       生成器使用特殊的 npm Tag 版本
  --registry             生成器运行过程中定制 npm Registry
  -h, --help             display help for command
```

`modern new` 命令用于启动微生成器功能，它可以为项目启用默认没有提供的功能。

目前可以开启的功能有：

- Storybook 调试
- Tailwind CSS 支持
- Modern.js Runtime API

关于这些功能，可以通过[【使用微生成器】](/zh/guide/use-micro-generator) 章节了解更多。

## `modern dev`

``` bash
Usage: modern dev [options]

本地开发命令

Options:
  -h, --help             display help for command

Commands:
[dev-tools-subCommand]
```

模块工程解决方案提供了使用调试工具的能力，可以通过 `modern dev` 命令来启动。不过要注意的是，默认情况下是没有提供调试相关的插件，因此此时执行 `modern dev` 会提示： *"No dev tools found available"*。

目前官方支持的调试工具有 [Storybook](https://storybook.js.org/)，因此在你执行 `modern new` 命令开启它后，就可以执行 `modern dev` 或者 `modern dev storybook` 执行它。

## `modern test`

``` bash
Usage: modern test [options]

Options:
  -h, --help  display help for command
```
`modern test` 命令会自动将 `src/tests/*.test.(js|ts|jsx|tsx)` 文件当做测试用例运行。


## `modern lint`

``` bash
Usage: modern lint [options] [...files]

lint and fix source files

Options:
  --no-fix    disable auto fix source file
  -h, --help  display help for command
```

运行 [ESLint](https://eslint.org/) 检查代码语法情况。通常情况下，我们只需要在 `git commit` 阶段通过 [lint-staged](https://github.com/okonet/lint-staged) 检查本次提交修改的部分代码。

- `--no-fix` 参数设置后可以关闭自动修复 lint 错误代码的能力。

## `modern change`

``` bash
Usage: modern change [options]

创建变更集

Options:
  --empty     创建空变更集 (default: false)
  --open      使用编辑器中打开创建的变更集 (default: false)
  -h, --help  display help for command
```

`modern change` 命令用于生成 [changesets](https://github.com/changesets/changesets) 需要的 Markdown 文件。

## `modern pre`

``` bash
Usage: modern pre [options] <enter|exit> [tag]

进入和退出预发布模式

Options:
  -h, --help  display help for command
```

可以使用 `modern pre` 命令在正式发布前[预发布](https://github.com/atlassian/changesets/blob/main/docs/prereleases.md)一个版本。

## `modern bump`

``` bash
Usage: modern bump [options]

使用变更集自动更新发布版本和变更日志

Options:
  --canary       创建一个预发布版本进行测试 (default: false)
  --preid <tag>  在对预发布版本进行版本控制时指定标识符 (default: "next")
  --snapshot     创建一个特殊版本进行测试 (default: false)
  -h, --help     display help for command
```

按照 [changesets](https://github.com/changesets/changesets) 生成的变更记录的 Markdown 文件修改 `package.json` 中的版本号， 同时生成 `CHANGELOG.md` 文件。

## `modern release`

``` bash
Usage: modern release [options]

发布 npm 包

Options:
  --tag <tag>       发布 npm 包使用特定的 tag (default: "")
  --ignore-scripts  发布时忽略 package.json 中的 scripts 命令，仅支持在 pnpm monorepo
                    中使用 (default: "")
  -h, --help        display help for command
```

`modern release` 命令可以将模块发布到 [npm Registry](https://www.npmjs.com/) 上。

- `--tag` 参数可以指定发布时具体的 [dist tags](https://docs.npmjs.com/adding-dist-tags-to-packages)。

## `modern gen-release-note`

``` bash
Usage: modern gen-release-note [options]

根据当前仓库 changeset 信息生成 Release Note

Options:
  --repo <repo>      仓库名称，用于生成 Pull Request 链接， 例如： modern-js-dev/modern.js
  --custom <cumtom>  自定义 Release Note 生成函数
  -h, --help         display help for command
```

根据当前仓库的 changeset 信息自动生成 [Release Note](https://en.wikipedia.org/wiki/Release_notes)。

:::tip{title=注意}
需要在 `bump` 命令之前执行。
:::

## `modern upgrade`

``` bash
Usage: modern upgrade [options]

升级 Modern.js 到最新版本

Options:
  --registry <registry>  定制 npm registry (default: "")
  -d,--debug             开启 Debug 模式，打印调试日志信息 (default: false)
  --cwd <cwd>            项目路径 (default: "")
  -h, --help             display help for command
```

`modern upgrade` 命令，用于升级项目 Modern.js 相关依赖至最新版本。

在项目根目录下执行命令 `npx modern upgrade`，会默认将当前执行命令项目的 `package.json` 中的 Modern.js 相关依赖更新至最新版本。

命令在 `@modern-js/module-tools` 版本 **>= 1.17.0** 提供，之前版本可使用 `npx @modern-js/upgrade` 进行升级。
