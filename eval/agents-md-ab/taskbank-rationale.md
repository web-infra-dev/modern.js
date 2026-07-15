

## 每层设计说明（无偏性论证）

**总体无偏原则（适用于所有层）**
1. **逐题文档核对**：每题 `doc_source` 均已在实验实际使用的捆绑文档（323 mdx，v3.6.0）中逐字验证过字段名/API 名/默认值（如 `dev.server.proxy`、`resolve.alias`、`defer` 必须接对象、`x-modern-ssr-fallback`、`registryHooks`），无一编造；L4 四题额外验证了关键词在捆绑文档中 **0 命中**（`grep -rl` 计数为 0），确保"本地没有、线上有"的缺口属性成立。
2. **两组对称约束**：所有 prompt 统一禁止 dev server 与安装依赖（预装除外），A/B 两组约束字面相同；判分只依赖离线可复现信号（文件正则/AST、`pnpm build` 退出码、构建产物 HTML、判分器自起 serve 的 HTTP 响应、答案关键词），不依赖任何需要联网的判分步骤，避免"A 组联网判分更顺"之类的通道偏差。
3. **离线可完成性核对**：模板实测只预装 `@modern-js/runtime`/`app-tools`/`plugin-bff`/`hono`；凡官方步骤需要新依赖的任务（SSG 插件、server-runtime）一律改为"写入 package.json + 不要求构建"，两组同样不需要安装，消除环境导致的系统性失败。BFF 全链路题（L3-01）实测依赖已预装，可 build + serve 判分。
4. **区分度设计**：L1–L3 全部优先选择 v2→v3 变化点或 Modern.js 特有约定（`.data` 文件、`modern.routes.ts`、`src/modern.runtime.ts`、`defineServerConfig`），即"没文档指引大概率按训练数据答错、有指引照抄文档必对"的题眼；纯记忆题（如 React 通识）被刻意排除。

**L0（3 题，权重 1.0）**：不依赖任何 Modern.js 知识——纯文本改动、严格格式输出、以及一道 AGENTS.md Key facts 直答题（L0-02）。它们是两组的"地板对照"：若两组 L0 通过率有差异，说明差异来自 agent 基线能力/指令遵循而非知识源，可用于归因校准。L0-02 与 L5-01 的知识点相邻但测点不同（前者答案直接写在两组共享的 AGENTS.md Key facts 里，测"读没读指引"；后者 Key facts 不含 entry 细节，测"查没查文档"），已在预注册中声明。

**L1（8 题，权重 1.0）**：每题答案完整落在 configure 目录单个页面内，且 8 题中 5 题（port/ssr mode/alias/proxy/env 前缀）是已验证的 v2→v3 字段迁移点或与 CRA/Vite/Next 易混点，3 题（distPath/title/meta）是稳定字段作为"低难度锚点"防止全层过难。判分具体到字段路径与产物正则，杜绝判分员自由裁量。

**L2（8 题，权重 1.5）**：每题需要综合 2 个文档页（路由+DataLoader、BFF 路由规则+prefix 配置、CSS Modules 用法+cssModules 配置、deploy 命令+产物结构、SSG 指南+ssg 配置、SSR 降级配置+渲染指南、SSR+Loader、配置式+约定式路由共存），对应"指引让 agent 沿文档内链接跳转"的能力；code 与 qa 混合（5 code / 3 qa），避免单一判分通道偏向某组。

**L3（8 题，权重 2.0）**：多步改码，全部按 guides 的真实步骤核对（enable-bff 三步、web-server 的 defineServerConfig、defer/Await、error.tsx/loading.tsx 约定、多入口主入口命名规则、modern.runtime.ts、data-write）。8 题中 6 题要求 `pnpm build` 通过（客观硬信号），2 题（L3-02/涉及未预装依赖）降级为文件断言并在 prompt 中明示离线规则——对两组同样明示，不构成信息不对称。

**L4（4 题，权重 1.0）**：全部出自捆绑时被排除的 `plugin/` 目录（cli/runtime/server 插件 API 与插件结构字段），且已逐词验证捆绑文档 0 命中、仓库 `packages/document/docs/en/plugin/` 中真实存在。设计意图：A 组（线上 llms-full.txt）可直接答对；B 组（本地捆绑文档）正确行为是发现缺页并兜底（声明缺失或转查线上），预注册了"诚实兜底 0.5 分、编造 0 分"的规则，使该层测的是**兜底行为**而非惩罚 B 组本身；4 题未采用 community/tutorials 出题的原因也预先声明：tutorials 示例代码存于 .txt sandbox 文件、community 主体为 release note/贡献指南，与"应用开发任务域"不匹配，强行出题会引入任务域偏移，反而破坏无偏性（如需 community 覆盖，可将 L4-04 替换为贡献指南 `pnpm run test:e2e`/Rstest 题，已备选）。

**L5（4 题，权重 1.5）**：四个变化点全部在捆绑文档 `guides/upgrade/` 中逐字核对（modern new 移除、useRuntimeContext→use(RuntimeContext) 且 isBrowser 提升顶层、pages 目录移除、webpack 移除→tools.rspack）。这是"训练数据主动误导"层：无指引时模型高置信度输出 v2 答案，判分规则对旧答案显式判 0（负向关键词），最大化两组区分度；两组文档（本地 upgrade 目录与线上 llms-full.txt）都完整包含这四个事实，不存在只利于一组的信息差。

**权重说明**：L2=1.5、L3=2.0 反映多步任务的信息量更大；L4 降回 1.0 是因为它只对 B 组构成"额外行为测试"，压低权重防止 4 道缺口题主导总分造成对 B 组的结构性惩罚；L5=1.5 因其是实验假设（"指引矫正过时训练数据"）的直接检验点。加权总分 = Σ(weight × pass)，满分 47.0。