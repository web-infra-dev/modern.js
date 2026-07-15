# 运行协议（冻结参数清单）

> 本文件与代码一起以 commit 冻结；任何变更需重新过 review。

## 自包含与目录隔离（v2.1 整改）
- **自包含**：commit 内含 template-src/（两套项目文件+pnpm-lock）与 template-src/docs-snapshot/（323 文件）；检出后 `node setup-templates.mjs` 物化两棵模板（pnpm@10.13.1 --frozen-lockfile）并自动对照 committed manifest 哈希校验（MANIFEST MATCH 才可用）
- **exposed/private 目录隔离**：模板与 runs 在独立根（默认 /tmp/modernjs-ab-exposed，env AB_EXPOSED_ROOT），与实验私有代码（graders/bank/engine/runner/results）无共同祖先；runDir 一切可达路径（含 node_modules 符号链接 realpath）都只落在 exposed 树内——agent 无法通过向上遍历发现判分逻辑
- **组名对齐**：runner 写入的 group 标签 = 统计脚本冻结常量（主对比 PROD-A/PROD-B；探索组 G0/GA/GA2/GB），合成数据端到端 --final 验证通过

## 执行栈
- Claude Code CLI：2.1.210（runner 启动时回读校验并写入日志）
- 模型：pin `claude-fable-5`；每 run 从 stream-json init 回读实际 model id；**同一 wave 内出现任何漂移 → 中止整个实验（exit 3）并留档**
- effort：CLI 默认（未显式设置，记录于此）
- runner：runner2.mjs（SEED=20260716，wave 顺序与臂序由该 seed 唯一决定，--dry 可复现打印）

## 权限与工具
- permission mode：`--dangerously-skip-permissions`（一次性沙箱目录）
- 工具面：Claude Code 默认内置工具集；干净 HOME 下无任何 MCP server、无 skills、无 hooks，故实际可用面 = 内置工具
- max-turns：30；单 run 硬超时 10 分钟（SIGKILL，计 accuracy fail + timeout 标记）

## 环境隔离
- 每 run 独立目录：项目文件真实复制；node_modules 只读共享（符号链接指向 template）
- 干净 HOME：每 run 独立 HOME 副本，仅含 `.claude/.credentials.json`（认证）与 `.claude/settings.json`（model pin）；无用户 CLAUDE.md / memories / MCP / skills / hooks
- sentinel 预检：pilot 开跑前每臂 1 次探针 run（sentinel.mjs），要求模型枚举上下文来源，断言仅有 run 目录 CLAUDE.md→AGENTS.md；transcript 归档
- fixture：每 run 前 `fixture.mjs verify-pre`（项目文件哈希 = manifest）；每 wave 后 `verify-shared`（共享 docs 未被污染，失败即中止 exit 4）

## 分组与文案
- 主实验两臂：PROD-A（llms-full.txt 线上指引）/ PROD-B（捆绑文档指引），SHA 见 PREREG-SHA256SUMS；diff 仅知识源步骤块
- 两臂文件系统差异（声明）：**双模板双树**——B 臂模板 node_modules 含 main-doc 捆绑 docs（真实产品形态），A 臂为独立安装树、物理不含捆绑 docs；manifest.json 的 armTrees 段记录两树 @modern-js 包版本一致、项目文件一致、A 树 mainDocPresent=false，docs 差异清单 = sharedDocs 段
- 探索四组（G0/GA/GA2/GB 极简指针）：机制诊断用，agents-variants/，不入决策

## 包管理与模板
- 两棵模板统一用 pnpm 10.13.1（npx pnpm@10.13.1，CI=true）安装；@modern-js/* 全部 3.6.0
- @modern-js/server-runtime 预装进两棵模板（判分引擎实测：不预装则按官方文档写的自定义 Web Server 正确答案会 TS2307 构建失败被误杀）
- agent 子进程环境注入 npm_config_verify_deps_before_run=false：防 pnpm v10+ 的 verify-deps 在符号链接 node_modules 的 run 目录里清库重装、污染共享模板（实测发生过一次，已由 fixture verify-shared 机制覆盖）

## 网络与缓存
- 网络经公司代理（HTTPS_PROXY），对两臂一致；A 臂线上抓取的 URL/状态/字节数由依从性记录覆盖
- 构建缓存：判分器在每次 build 前清共享 node_modules/.cache（防跨 run 污染）；judge build 串行

## 依从性记录（ITT，每 run）
- local_docs_reads：Read/Grep/Glob/Bash 命中 `main-doc/docs` 的次数
- online_docs_fetches：WebFetch 命中 modernjs.dev 次数；webfetch_errors：其中失败数
- bash_online_fetches：Bash 内 curl/wget 命中 modernjs.dev 次数
- 不依从 run 不剔除，进 ITT 主分析并另表诊断

## 判分
- 引擎 engine.mjs + graders/（run 树之外，agent 退出后挂载）；QA 答案取 runDir/ANSWER.md 或 runner 落盘的 .final-answer.txt
- primary = exact binary pass；abstained 独立字段；无模型单测（canonical + mutation fixtures）全绿的 commit 才有执行资格——两套矩阵都要绿：`node test-graders.mjs`（pilot 10 题）与 `node test-graders.mjs --bank taskbank-35.json`（35 题全量，每题 correct + ≥2 wrong，QA 题含"正确关键词出现在否定语境"负例）
- pass/fail 各随机抽 ≥10% 盲审（复核人不见分组）

## 决策（冻结，见 prereg_ab_analysis.py 常量）
- 主集 L1/L2/L3/L5（28 题）；WIN = 置换 p<0.05 且 mean(d)>0；NI 备用 = bootstrap-t 下界 > −0.03；否则证据不足；冲突以置换为准
- 业务映射（待张翔确认后并入）：WIN(B) → 采用捆绑文档方案；NI(B) 成立 → 按预注册顺位 tie-break（time-to-correct 配对差 → 每成功任务成本 → 线上失败率/离线可靠性），任一显著优即采用 B；证据不足 → 维持 llms.txt 线上方案并报告
