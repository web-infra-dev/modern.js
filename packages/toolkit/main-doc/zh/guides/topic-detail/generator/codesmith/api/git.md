---
sidebar_position: 4
---

# @modern-js/codesmith-api-git

微生成器中使用 git 相关操作的 API 封装，提供判断 git 仓库，初始化及提交代码等方法。

## 使用姿势

```typescript
import { GitAPI } from '@modern-js/codesmith-api-git';

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const gitApi = new GitAPI(generatorCore, generatorContext);
  await gitApi.initGitRepo();
}
```

- 创建 GitAPI 实例，参数和微生成器函数参数一致，为 context 和 generator，具体介绍请看微生成器项目组成
- 调用其实例上 API 即可。

## API

### isInGitRepo

当前目录是否为 git 仓库。

参数：

- cwd?: `string` git 命令的执行目录，默认为微生成器 `outputPath`。

### initGitRepo

初始化为 git 仓库。init 的默认分支名可通过生成器 config 中的 defaultBranch 进行配置。

参数：

- cwd?: `string` git 命令的执行目录，默认为微生成器 `outputPath`。
- force?: `boolean` 当前目录已经为 git 仓库时使用该参数会强制执行 git init。

### addAndCommit

执行 `git add .` 和 `git commit` 提交当前变更。

参数：
- commitMessage: `string` commit 信息。
- cwd?: `string` git 命令的执行目录，默认为微生成器 `outputPath`。
