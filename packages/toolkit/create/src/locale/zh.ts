export const ZH_LOCALE = {
  prompt: {
    projectName: '请输入项目名称: ',
  },
  error: {
    projectNameEmpty: '错误: 项目名称不能为空',
    directoryExists: '错误: 目录 "{projectName}" 已存在且不为空',
    createFailed: '创建项目时出错:',
    agentsMdOnlyConflict:
      '错误: --agents-md-only 只更新当前项目，不能与项目名或 --no-agents-md 同时使用',
  },
  message: {
    welcome: '🚀 欢迎使用 Modern.js',
    success: '✨ 创建成功！',
    agentsMd:
      '✔ 已生成 AGENTS.md 和 CLAUDE.md —— AI 编码助手会自动读取。（--no-agents-md 可跳过）',
    nextSteps: '📋 下一步：',
    step1: 'cd {projectName}',
    step2: 'pnpm install',
    step3: 'pnpm dev',
  },
  agentsCmd: {
    created: '✔ 已创建 {file}',
    updatedBlock: '✔ 已更新 {file} 中的 modernjs-agent-rules 块',
    addedBlock: '✔ 已在 {file} 顶部添加 modernjs-agent-rules 块',
    linked: '✔ 已向 {file} 添加 `@AGENTS.md` 引用',
    unchanged: '• {file} 已是最新',
    done: '✨ 完成 —— AI 编码助手会读取 {location}。',
    targetNotFound: '错误: 目标目录 "{dir}" 不存在',
    notAProject: '错误: 当前目录不是 Modern.js 项目，请在项目根目录运行',
    unsupportedVersion:
      '• 当前 @modern-js/app-tools@{version} 不支持随包文档，未修改任何文件。可在 AGENTS.md 中补充 https://modernjs.dev/llms.txt 供 AI 工具获取框架知识，或升级到 {since} 及以上后重新执行本命令',
  },
  help: {
    title: '🚀 Modern.js 项目创建工具',
    description: '快速创建一个新的 Modern.js 项目',
    usage: '📖 用法:',
    usageExample: '  create [项目名称] [选项]',
    options: '⚙️  选项:',
    optionHelp: '  -h, --help     显示帮助信息',
    optionVersion: '  -v, --version  显示版本信息',
    optionLang: '  -l, --lang     设置语言 (zh 或 en)',
    optionSub: '  -s, --sub       标记为子项目（monorepo 中的子包）',
    optionNoAgentsMd:
      '  --no-agents-md  跳过生成 AGENTS.md / CLAUDE.md（AI 编码助手指引文件）',
    optionAgentsMdOnly:
      '  --agents-md-only  仅为当前项目补齐/更新 AGENTS.md / CLAUDE.md（不创建项目）',
    examples: '💡 示例:',
    example1: '  create my-app',
    example2: '  create my-app --lang zh',
    example3: '  create my-app --sub',
    example4:
      '  create --agents-md-only   (为已有项目补齐/更新 AGENTS.md 和 CLAUDE.md)',
    moreInfo: '📚 更多信息: https://modernjs.dev',
  },
  version: {
    message: '@modern-js/create 版本: {version}',
  },
};
