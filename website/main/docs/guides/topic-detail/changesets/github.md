---
sidebar_position: 9
---

# 使用 Github 相关工具

## BOT

在 Github 上，Changesets 提供了机器人用于检测当前 Pull Request 是否存在 changeset，并提供了 UI 界面添加和修改 changeset。

### 安装

点击进入[链接](https://github.com/apps/changeset-bot)，右上角选择安装，确认即可安装成功。

![安装机器人](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-install-bot.png)

### 配置

安装成功后，即可进入配置页面，根据需求选择应用仓库即可。

![配置机器人](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-config-bot.png)

### 使用

配置完成后，该机器人将会自动 check 每个 Pull Request 是否添加了 changeset，并通过回复的方式给到提示信息。


#### 未添加 changeset

![未添加 changeset 状态](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-bot-no-changeset.png)

可在仓库执行 `pnpm run change` 添加 changeset，也可直接点击下方第二个链接填写 changeset。

#### 已添加 changeset

![已添加 changeset 状态](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/changeset-bot-exist-changeset.png)

可点击下方链接修改和添加新的 changeset。

#### 不需要 changeset

可直接忽略未添加时的提示信息，它不会造成 Pull Request 不能合并的问题。

## Action

### 自动创建 Release Pull Request

Modern.js 提供了自动创建发版 Pull Request 的 Github Action，提供基于选择的分支自动执行 bump 操作，更新 lock 文件及创建 Pull Request 操作。

### 使用

在仓库中创建 `.github/workflows/release-pull-request.yml` 文件，填入以下内容：

```yaml
name: Release Pull Request

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Release Version(v1.0.0)'
        required: true

jobs:
  release:
    name: Create Release Pull Request
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@master
        with:
        # This makes Actions fetch only one branch to release
          fetch-depth: 100

      - name: Create Release Pull Request
        uses: modern-js-dev/actions@main
        with:
          # this expects you to have a script called release which does a build for your packages and calls changeset publish
          versionNumber: ${{ github.event.inputs.version }}
          type: 'pull request'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPOSITORY: ${{ github.repository }}
          REF: ${{ github.ref }}

```

将 Workflow 合并到主分支后，进入 Github 仓库对应的 Action 页面，选择 Release Pull Request：

![Release Pull Request Action](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/action-pull-request.png)

选择本次发布的分支并填入版本号，版本号格式推荐 v1.0.0，点击 Run workflow 按钮：

![Run Release Pull Request](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/run-pull-request-action.png)

workflow 运行完成后将自动创建 `Release-${version}` 的 Pull Request，自动完成 `bump` changeset 相关版本号并更新 lock 文件，Pull Request 的内容为执行 `gen-release-note` 命令自动生成的 Release Note。

![Release Pull Request](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/release-pull-request.png)

### 自动 Release

Modern.js 提供了自动创建发版 Pull Request 的 Github Action，提供基于选择的分支自动执行 release 操作，将包发布到 NPM 上。


#### 使用

在仓库中创建 `.github/workflows/release.yml` 文件，填入以下内容：

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      version:
        type: choice
        description: 'Release Version(canary, alpha, pre, latest)'
        required: true
        default: 'canary'
        options:
        - canary
        - alpha
        - pre
        - latest
      branch:
        description: 'Release Branch(confirm release branch)'
        required: true
        default: 'main'

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@master
        with:
        # This makes Actions fetch only one branch to release
          fetch-depth: 1

      - name: Release
        uses: modern-js-dev/actions@main
        with:
          # this expects you to have a script called release which does a build for your packages and calls changeset publish
          version: ${{ github.event.inputs.version }}
          branch: ${{ github.event.inputs.branch }}
          type: 'release'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          REPOSITORY: ${{ github.repository }}
          REF: ${{ github.ref }}

```

配置仓库的 NPM_TOKEN:

![配置 Token](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/github-set-npm-token.png)

将 Workflow 合并到主分支后，进入 Github 仓库对应的 Action 页面，选择 Release：

![Release Action](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/release-action.png)

选择分支名称和发布版本类型，点击 Run workflow 按钮：

![Run Release Action](https://lf3-static.bytednsdoc.com/obj/eden-cn/zq-uylkvT/ljhwZthlaukjlkulzlp/run-release-workflow.png)

Workflow 将自动完成仓库 build 和发布到 NPM 流程。
