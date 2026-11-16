# 依赖检查迁移与维护者 skill 移除规划

## Decision Brief

**Intent（意图）**：把已经认可的依赖规则变成开发流程中的自动保障，避免人工审计与自动检查维护两套不同规则。只防现有规则和历史实际出现过的错误，不发展通用依赖审计平台。

**Outcome（结果）**：七项依赖检查由提交检查和 CI 自动执行，迁移验证完成后彻底删除维护者依赖审计 skill。

**Scope（范围）**：仓库开发检查、提交前检查、CI 安装与构建后验证，以及旧 skill 的删除和引用清理。不改变框架运行时、公开 API 或用户应用的依赖策略。

**Visible Changes（可见变化）**：

- 明确的源码未声明依赖会阻断相关提交和 CI。
- 发布 JS 或公开类型声明仍需要、却只存在于开发依赖的包，以及缺失的发布入口文件，会在构建后的 CI 中报错。
- 删除旧 skill 的整仓双视角报告、用户 app fixture 生成、体积统计、安装耗时和多版本诊断能力，不提供替代审计系统。
- 正常的传递依赖多版本、合理的 peer 或 optional 依赖，不因本次迁移被统一禁止。

## Design Review

沿用已有私有检查包承载新增规则，不另建检查框架或审计服务。提交前检查和 CI 调用同一份规则实现，区别仅在输入范围与是否已构建。

| 责任                                                 | 归属                                                                               |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 直接依赖声明版本一致性及现有例外                     | 现有 `scripts/check-dependencies.js`                                               |
| workspace 包依赖环、workspace 协议、exports 键一致性 | 现有 `scripts/lint-package-json`                                                   |
| 源码幽灵依赖与发布产物检查                           | 扩展 `scripts/lint-package-json`，共享必要的包名识别和源码解析，不共享无关审计功能 |
| 何时执行、检查哪些提交内容                           | 现有 Rstack 提交配置                                                               |
| 完整安装、静态检查与构建后检查                       | 现有 CI 工作流                                                                     |

这是对已有检查入口的扩展，不是把旧 audit 脚本整体搬到 `scripts/` 后继续保留其全部能力。

## 执行评估

这是中等规模的开发工具迁移，涉及新增规则测试、提交检查和构建后 CI，不是框架行为改动。主要约束是低误报、规则单一来源、复用现有流程，以及删除 skill 前不能丢失检查能力。

已核实的当前状态：

- `package.json` 已有 `check-dependencies`、`lint:package-json`、`prepare-build` 等命令。
- `rstack.config.mts` 的 staged 配置在 `package.json` 变更时执行版本一致性检查，但没有执行另三项 package lint 规则。
- `scripts/lint-package-json/src/index.ts` 已调用 workspace 包环、workspace 协议和 exports 键一致性规则。
- 根 `rstest.config.mts` 当前只额外注册 `scripts/rslib` 的脚本测试项目，新规则测试需要明确接入。
- `type-check.yml` 在 PR 和 `merge_group` 场景安装依赖并执行 `prepare`，可以复用其构建结果验证产物。
- 当前 `.npmrc` 关闭了严格 peer 检查，本次不修改该策略。
- pnpm 版本为 10.13.1，其 `pack` 支持 `--json` 和 `--pack-destination`。打包生命周期行为与发布字段覆盖仍需在实施时验证。
- 当前 skill 的幽灵依赖扫描使用正则，并把 devDependencies 视为已声明，不能原样作为可靠的发布依赖门禁。
- `.claude/skills` 是指向 `.agents/skills` 的软链接。旧 skill 的外部引用目前位于 `AGENTS.md` 和 `.agents/skills/README.md`。

完成状态：七项检查各有明确执行位置，正例通过、反例失败，hooks 不执行构建或安装，CI 验证真实发布文件，旧 skill 与其运行入口不再存在。

## 七项规则与执行位置

| 编号 | 规则                                          | 提交前检查                                       | CI                                 |
| ---- | --------------------------------------------- | ------------------------------------------------ | ---------------------------------- |
| 1    | 依赖声明版本一致性                            | `package.json` 变更时执行，保留现有例外          | 完整检查                           |
| 2    | workspace 包依赖环                            | `package.json` 变更时执行，读取完整 workspace 图 | 完整检查                           |
| 3    | workspace 协议                                | 检查变更包                                       | 完整检查                           |
| 4    | exports 与 publishConfig.exports 顶层键一致性 | 检查变更包，保留现有语义                         | 完整检查                           |
| 5    | frozen-lockfile 安装                          | 不执行                                           | 保留并明确现有安装门禁             |
| 6a   | 源码引用的外部包有依赖声明                    | 源码或 manifest 变更时检查受影响包               | 同一实现进行完整检查               |
| 6b   | 发布所需外部引用不能仅依赖 devDependencies    | 不执行                                           | 构建、打包后验证 JS 和公开 `.d.ts` |
| 7    | 发布入口目标文件存在                          | 不执行                                           | 验证包内实际生效的发布清单与文件   |

第 6a 与 6b 是同一项依赖声明规则的两个阶段，不把源码 import 一律判为生产依赖。

## 明确不做

- 不保留或重建 dependency-audit 系统，也不把整个 `audit.mjs` 改名后迁移。
- 不新增安装体积、安装耗时、传递依赖多版本报告或用户 app 自动生成流程。
- 不把包内文件循环依赖升为全仓门禁。
- 不新增许可证平台、安全扫描、通用 peer 完备性分析或统一 exports 条件结构要求。
- 不自动决定应使用 dependencies 还是 peerDependencies，不一刀切禁止 optional 依赖。
- 不修改 `.npmrc` 的 peer 策略，不主动升级或收敛业务依赖。
- 不手改锁文件、生成产物、node_modules 或包的 CHANGELOG。
- 不删除面向用户的根 `skills/`、相关 skill 回归测试或整个 `.agents/`。
- 不自动删除本地 `.agents/runs/` 中的调试现场。
- 本轮只写规划，不实施，不提交或推送。

## 文件地图

### 计划修改

- `package.json`：保留现有入口，新增产物检查和规则回归测试命令。
- `scripts/check-dependencies.js`：仅在暂存输入适配确有必要时调整调用方式，保留现有一致性政策和例外。
- `scripts/lint-package-json/package.json`：规则测试与产物检查命令，必要的直接工具依赖声明。
- `scripts/lint-package-json/src/index.ts`：接入源码依赖检查，支持完整检查和提交输入范围。
- `scripts/lint-package-json/src/utils.ts`：仅按需复用公共能力。
- `rstack.config.mts`：新增 package lint 和源码依赖检查触发条件。
- `rstest.config.mts`：注册新增脚本测试项目。
- `.github/workflows/lint-Linux.yml`：完整静态规则与新规则测试。
- `.github/workflows/check-dependencies.yml`：保留版本一致性检查，补齐需要的 `merge_group` 覆盖。
- `.github/workflows/type-check.yml`：在既有构建步骤后执行发布产物检查。
- `AGENTS.md`：用实际检查入口替换旧 skill 链接。
- `.agents/skills/README.md`：移除已删除 skill 的介绍，保留其他目录约定。

### 计划新增

- `scripts/lint-package-json/src/`：外部引用解析、源码声明检查、发布产物检查入口及规则。按真实需要划分文件，不设计插件体系。
- `scripts/lint-package-json/tests/`：正反例、隔离 fixtures，以及提交输入与真实 pack 的回归验证。
- `scripts/lint-package-json/rstest.config.mts`：复用现有 rstest 方式运行脚本规则测试。

### 最后删除

- `.agents/skills/dependency-audit/SKILL.md`
- `.agents/skills/dependency-audit/scripts/audit.mjs`
- `.agents/skills/dependency-audit/scripts/size-audit.mjs`

删除后保留有效的 `.claude/skills` 软链接。仅需修改未发布的开发工具和文档时不新增发布 changeset。若必须修复已发布包的 manifest，则先展示具体 diff 并确认，确认后按仓库规则添加 changeset。

## 执行任务

### 任务 1：确定正常包的检查边界，避免把既有用法误报为错误

**目的**：在启用新门禁前确认输入和打包语义，避免以旧正则扫描结果代替事实。

**依赖**：无。

实施时首先打开 `rstack.config.mts`、两个现有检查入口、`pnpm-workspace.yaml`、代表性包 manifest 和现有 CI 配置。

- 记录现有四项静态检查及安装步骤的基线，不把未执行的检查记为通过。
- 核实 Rstack 是否为检查命令提供实际暂存内容，特别是部分暂存和跨包 manifest 变更。
- 确定源码检查的包边界、实际 TS 配置和别名处理，不能把内置模块、包自引用、`#imports`、虚拟模块或模板字符串误判为 npm 包。
- 普通 workspace 包与测试 fixtures、create 模板、预编译目录按其实际归属区分。现有一致性检查的 examples 例外保持不变。
- 在隔离目录验证 pnpm pack 后实际 manifest、文件清单、publishConfig 字段覆盖及生命周期行为，不从 npm dry-run 推测 pnpm 的行为。
- 输出已知正常模式和确切违规样例，作为后续回归测试输入。

**验证信号**：日志记录明确的暂存行为、有效发布字段和文件列表，以及基线检查实际结果。若发现正常模式，后续任务增加对应正例，不扩大规则范围。

### 任务 2：让明确的源码未声明依赖在提交检查与 CI 中失败

**目的**：将幽灵依赖能力迁出 skill，并使其可靠到可以作为门禁。

**依赖**：任务 1。

- 在现有 package lint 包中实现外部引用识别与声明检查，不照搬旧正则。
- 覆盖静态 import、export-from、字符串 require 和动态 import，类型引用在源码阶段仍需声明。
- 依据实际配置识别本地路径和别名，包边界以内的引用不当作外部依赖。
- 源码阶段接受 dependencies、devDependencies、peerDependencies、optionalDependencies 的有效声明，生产放置由产物阶段判断。
- 增加完整扫描与提交范围输入，源码或 manifest 变化均可触发，manifest 删除依赖时也检查该包的相关源码。
- 错误输出包含包名、文件、引用的外部包与违反的规则，失败返回非零退出码。
- 接入 rstest，至少覆盖未声明引用、已声明引用、类型引用、别名、Node 内置模块、包自引用、注释和模板字符串、嵌套 package 边界。

**验证**：运行新规则测试命令，正例通过，未声明引用反例失败，旧 package lint 规则继续通过其回归测试。

### 任务 3：在真实发布文件上拦截开发依赖泄漏和入口缺失

**目的**：防止源码仓库内可用、用户安装后不可用的问题，不要求提交时构建。

**依赖**：任务 1、任务 2 的必要解析能力。

- 在现有检查包中新增根命令 `check-package-artifacts` 对应入口。无参数检查 `packages/` 下可发布包，允许包目录参数聚焦验证，不检查私有工具包的生产发布行为。
- 复用已构建内容，读取 pnpm 实际打包后的有效 manifest 和文件，不执行 install、不联网，不重复运行全仓构建。
- 检查适用的 `main`、`module`、`types`、`bin`、exports 和 typesVersions 显式目标。正确处理包内 `package.json`、嵌套条件、合法空目标及仓库实际使用的模式映射，不增加新的条件导出规范。
- 检查实际发布 JS 和公开 `.d.ts` 可达文件中的明确外部引用。若所需包仅在 devDependencies 中，则报错。
- 已内联且不再保留外部引用的依赖不报错。合理 peer、optional 依赖及预编译可选 loader 按其已确认语义处理，不自动改变归属。
- 明确区分未构建、打包失败、入口缺失和依赖声明错误，不能因为缺 dist 而静默跳过。
- 增加历史问题的最小复现测试：生产引用仅在 dev、公开类型引用仅在 dev、错误 types 路径、文件在工作区存在却未被打包、publishConfig 覆盖字段。
- 保留 BFF 类型可移植性等已有定向回归测试，本次不新增完整条件导出或声明兼容性分析器。

**验证**：隔离正反例验证上述错误均可被拦截。已构建的代表性 builder、runtime 和 BFF 包通过真实 pack 验证，再执行完整可发布包检查。

### 任务 4：让 hooks 快速预检，让 CI 使用同一规则完成最终验证

**目的**：把已经验证的规则接入日常流程，而不是只增加无人调用的脚本。

**依赖**：任务 2、任务 3。

- 在 Rstack staged 配置中，manifest 变更触发规则 1 至 4 和源码依赖检查，源码变更触发受影响包的源码依赖检查。
- workspace 环判断保留完整图，不能只读修改的几个文件。
- 提交检查使用任务 1 已验证的暂存输入。若 Rstack 对全图检查不能保证暂存语义，使用最小只读 index 输入适配，不自动 stash、add 或改写用户文件。
- manifest 的同次提交检查合并执行，避免每个文件都重复全仓扫描。不承诺未测量的耗时数字。
- hooks 不安装、不构建、不打包、不访问网络。
- CI 保留完整版本一致性和 package lint，安装步骤明确 frozen-lockfile，运行新规则测试。
- 复用 type-check 的既有构建结果执行产物检查，覆盖 PR 与最终合并组合，不新建七个工作流或重复全仓构建。
- 新测试使用 Node 进程参数调用，避免 Windows CMD 单引号问题，接入既有 Windows 测试路径。

**验证**：隔离 hooks 测试覆盖仅改源码、仅改 manifest、跨包环和部分暂存场景，不在当前仓库执行真实 commit。Linux 与 Windows 的新规则测试通过，CI 配置包含安装、完整静态检查、构建后产物检查三个阶段。

### 任务 5：验证替代入口后删除旧 skill，避免双轨维护

**目的**：交付一个自动检查体系，而不是保留旧系统作为隐含依赖。

**依赖**：任务 4 和最终检查通过。外部 CI 暂不可执行时必须记录未验证项，不把它记为已通过。

- 删除文件地图中的旧 skill 三个文件，不迁移多版本、体积、耗时、用户 app fixture 或源码环报告代码。
- 更新 `AGENTS.md` 的依赖检查入口和 `.agents/skills/README.md`，避免失效链接。
- 保留 `.claude/skills` 的有效软链接、其他 skills 和未提交的本地运行现场。
- 检查新增脚本、测试和 CI 不再引用旧目录。
- 如果新增规则发现现存发布包错误，先列明具体违规和拟修复 manifest diff。未经确认不批量修改业务包，也不把真实违规加成静默忽略。

**验证**：执行最终验收，确认旧目录不存在、操作入口无残留引用、七项规则有测试及调用路径。

**提交边界**：各任务完成后保留可审查的工作区改动并更新日志，不自动 commit、push 或创建 PR。

## 风险与计划内处理

| 风险                                       | 不改变范围的处理                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| 注释、模板或别名造成源码误报               | 使用可靠解析和实际配置，增加正例，不继续扩展正则猜测                       |
| 源码引用被 bundle 内联，或只有内部类型使用 | 生产放置依据真实发布 JS 和公开声明，不依据 src 目录猜测                    |
| 打包执行生命周期，改变当前工作区           | 在隔离工作副本和临时输出目录打包已构建文件，验证无需重新构建，失败明确报错 |
| 模式导出与 publishConfig 导致路径判断错误  | 以包内有效 manifest 和实际文件集为准，先验证仓库已有正常模式               |
| 同一提交触发多次完整扫描                   | 合并任务调用，按受影响包处理局部规则，完整图规则仅执行一次                 |
| CI 已有历史失败                            | 记录失败原因，不把它说成新规则验证通过，先明确是否影响本次交付             |

仅有证据需要的例外可以局部、带原因地加入测试和规则，不建立通用配置平台。后续实现细节仅在未开始任务中细化。

## 停止信号

出现以下情况需要暂停并确认，而不是自行扩大实现：

- 必须更改框架运行时、公开 API、业务依赖归属或已有 peer 策略才能继续。
- 新规则要求批量修复发布包或增加大范围忽略，超出已确认的历史错误边界。
- 实现产物验证必须新增用户 app 系统、完整文档站构建、审计框架或复杂提交隔离系统。
- 需要引入新的外部服务或显著改变 CI 构建成本和执行结构。
- 七项规则尚未有可靠替代入口，却需要提前删除 skill。

## 最终验证

以下新命令属于本规划的交付内容，现在尚不存在，也没有执行。完整验收在实施后运行。

| 命令或验证动作                                                                                                             | 预期结果                                                                     |
| -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `pnpm install --ignore-scripts --frozen-lockfile`                                                                          | 安装成功，锁文件不需要更新，安装失败不记作通过                               |
| `pnpm run test:dependencies`                                                                                               | 新检查正反例、暂存输入和真实 pack 回归全部通过，断言违规返回非零退出码       |
| `pnpm run check-dependencies`                                                                                              | 保留现有政策与例外，完整一致性检查通过                                       |
| `pnpm run lint:package-json`                                                                                               | 现有三项规则和源码依赖检查通过                                               |
| `pnpm --filter @scripts/lint-package-json build`                                                                           | 检查工具类型构建通过                                                         |
| `pnpm run prepare-build`                                                                                                   | 可发布包按既有流程构建成功，不以部分成功代替通过                             |
| `pnpm run check-package-artifacts`                                                                                         | 发布依赖放置与入口文件检查通过，未构建或打包失败不能被跳过                   |
| `pnpm check`                                                                                                               | 仓库代码与格式检查通过                                                       |
| `git diff --check`                                                                                                         | 无空白错误                                                                   |
| `rg -n --hidden -e dependency-audit -e size-audit AGENTS.md .agents/skills package.json rstack.config.mts .github scripts` | 操作入口无旧引用，无匹配时预期退出码为 1。规划文档中的历史说明不属于运行入口 |
| `test ! -e .agents/skills/dependency-audit && test -d .claude/skills`                                                      | 旧目录不存在，现有 skills 软链接仍有效                                       |
| 既有 Linux 与 Windows CI，以及 PR / merge_group 组合                                                                       | 七项规则执行路径有效，记录真实通过、失败和未运行状态                         |

需要新增工具依赖时，通过 pnpm 自动更新锁文件，随后再运行 frozen-lockfile 验证，不手动编辑锁文件。

## 补充批准：存量修复与第六项的归属判断

用户已同意在同一个 PR 修复已确认的存量发布问题。随后取消本次 correct 命令要求，改为普通讨论，并明确选择“保留类型门禁，分类处理”。

- 发布 JS 与公开类型的外部依赖合同仍作为门禁，不机械指定 dependencies 字段。
- 自有运行依赖和独立共享类型工具按用途使用 dependencies。
- 框架、React 和 Node 宿主类型按已验证合同使用 peerDependencies，并保留本地 dev 版本，不通过无依据的 optional 标记隐藏问题。
- 捕获异常的解析探测与实际模块加载区分，不能把开发态探测当作生产依赖。
- 发布入口检查只验证声明入口及外部依赖，不扩展为所有内部相对模块或完整声明闭包的语义检查。该边界在检查 README 和测试中明确。
- 对已做的机械宿主依赖移动进行了撤回和分类，修复本地类型路径与打包白名单，并为实际发布变更加 changeset。

## 执行日志

- **语言**：使用与本规划相同的中文。
- **更新时机**：每完成一个任务、开始下一个任务前，追加带日期和任务编号的记录。交接未完成工作前记录进展及剩余事项，更新此文档，不只更新聊天。
- **记录内容**：用具体行为说明哪些条件下现在会通过或失败，或核实了什么，记录真实验证结果，不只写“完成接入”。
- **最终核对**：交付前对照任务、承诺行为与最终验证表，明确未满足的要求、失败项和未运行项。
- **修改边界**：获得批准后的 Decision Brief、Design Review，以及已开始或已完成的任务保持不变。需要改变已批准范围或设计时，先提出替代方案并获得确认。

[2026-11-16] 规划阶段：已读取现有检查、CI、构建与测试配置，核实 pnpm 版本和 pack 参数，未运行依赖检查、安装或构建，未修改实现或删除 skill。本规划等待用户确认后实施。

[2026-11-16] 执行授权：用户已批准切分支实施，并明确要求完成后独立 sub-agent 代码审核，通过后提交除本规划文档之外的代码、push 并向 main 创建 PR，最后由 sub-agent 使用 explain-pr 生成中文解释并填写 PR Summary。此授权取代规划阶段不实施、不提交的限制，本规划文档始终不提交。

[2026-11-16] 任务 1：在 chore/dependency-checks-migration 分支完成基线核实。原版本一致性、原 package lint 和 frozen-lockfile 安装通过。Rstack 使用 lint-staged，但全图检查不能只依赖部分暂存隐藏，因此新增检查直接读取 Git index，版本一致性使用仅含 index manifest 与 workspace 定义的临时输入。pnpm pack 的字段覆盖与生命周期隔离已由真实打包 fixtures 验证。

[2026-11-16] 任务 2 至 4：源码检查、发布产物检查、暂存输入和 CI 接入代码已实现。最新 test:dependencies 为 51/51 通过，私有检查工具构建、完整版本一致性、暂存版本一致性和 frozen-lockfile 安装通过。prepare-build 后台任务退出码为 0。已确认排除仅在 workspace 测试启用的 modern:source 条件，并将类型包的空 main 视为未设置，不忽略未知条件或真实依赖问题。

[2026-11-16] 范围停止信号：完整源码 lint 检出 7 处存量引用问题。对 30 个可发布包的实际 tarball 验证，在排除已确认的正常开发条件后仍检出 233 条诊断，其中 21 个包存在仅声明为 dev 的发布引用。另有 utils 的 .npmignore compiled/ 排除 dist/compiled 导致公开入口缺失，plugin 的 typesVersions 指向不存在文件，types 的声明存在未解析本地引用。完整 lint 与产物门禁目前失败，不可标记通过。尚未修改任何业务包 manifest、未删除 skill、未提交或创建 PR。按已批准停止信号，先请求用户决定是否在同 PR 修复存量发布问题，或批准仅阻断新增违规的迁移方式。

[2026-11-16] 用户同意同 PR 修复存量问题后，已修改部分业务 manifest 和类型路径，尚未提交、push 或删除旧 skill。随后用户指出 React 类型直接迁入 dependencies 存在宿主类型兼容风险，要求通过 correct 重新审视规则。已暂停继续批量迁移和发布操作，不把“发布引用存在”直接等同于“必须放 dependencies”。correct 命令禁止模型通过 Skill 工具调用，需要用户直接执行。已尝试调用但未运行该命令的工作流，等待用户直接调用后对齐修正规则和需撤回的改动。

[2026-11-16] 补充批准后完成分类修复：宿主引用从机械 production 移动改为 peer 加 dev 合同，独立共享类型工具按实际用途提供依赖，未增加 React 运行时依赖。React hook 公开类型在 @types/react 与 react-dom 18.3.0 和 19.0.0 的隔离环境中编译通过，验证范围为 Collector、StreamSSRExtender、WrapRootFn，不宣称覆盖所有 React 运行时组合。

[2026-11-16] 任务 5：旧 skill 三个文件已经删除，AGENTS.md 和维护者 README 已改为脚本入口，.claude/skills 链接仍有效。实现代码与 changeset 已暂存，本规划文档未暂存。最新依赖回归 55/55 通过，全仓单测共 1052 个，其中 1049 通过、3 跳过、0 失败。私有检查工具构建、pnpm check、源码与暂存检查、版本与暂存版本检查、frozen-lockfile 安装和 30 个实际包入口/外部依赖检查通过。最终 prepare-build 重跑退出码 0，独立 sub-agent 审核正在进行，未提交或创建 PR。

[2026-11-16] 独立审核完成：修复合法继承配置文件误拒绝、exports 数组不可达后备目标误报、无扩展名 Node bin 漏检，以及 JSONC-only 修改未触发 hook 四个 P2 问题，补充对应回归后 sub-agent 复审通过。最终依赖回归 65/65 通过，全仓单测 1062 个，其中 1059 通过、3 跳过、0 失败。实际 rs staged 流水线通过。检查工具类型构建、全仓 lint/格式、安装、source/version 完整与暂存检查、30 个实际包检查和 changeset status 通过，本地未运行完整 framework/e2e 套件或原生 Windows。

[2026-11-16] 提交与 PR：审核通过后提交 4cd77ef6f7 并 push，创建面向 main 的 PR https://github.com/web-infra-dev/modern.js/pull/9176。本规划文档不在提交中。CI 发现既有 changeset 校验要求内部 peer 显式版本格式，修正为 workspace:^3.11.3，当前有效范围不变，未改校验器。该 12 个 manifest、14 个字符串的窄修复经同一 sub-agent 独立复审通过，pnpm check-changeset 与其他本地门禁通过，再提交 9319b5a814 并 push。

[2026-11-16] 解释与最终核对：另一个 sub-agent 已使用 explain-pr 生成中文解释，已填写并读取验证 PR Summary，保留其他模板章节。最终 head 9319b5a814 上再次调用 explain-pr 确认说明仍准确。用户要求的切分支、实施、独立审核、提交、push、PR 和中文 Summary 已完成。仅本规划文档保持未跟踪，远端 CI 在后续 push 后重新执行，尚不能宣称全部 CI 已通过。

[2026-11-16] 文档提交授权更新：用户要求将本规划文档一起提交，此要求取代前文记录的文档排除规则。本次仅提交规划文档，不改动实现代码。
