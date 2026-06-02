export const ZH_LOCALE = {
  prompt: {
    projectName: '请输入项目名称: ',
  },
  error: {
    projectNameEmpty: '错误: 项目名称不能为空',
    directoryExists: '错误: 目录 "{projectName}" 已存在且不为空',
    createFailed: '创建项目时出错:',
    invalidSkillsMode:
      '错误: --skills 取值 "{value}" 非法，应为 none | recommended | custom 之一',
  },
  message: {
    welcome: '🚀 欢迎使用 Modern.js',
    success: '✨ 创建成功！',
    nextSteps: '📋 下一步：',
    step1: 'cd {projectName}',
    step2: 'pnpm install',
    step3: 'pnpm dev',
    skillsTitle: '🤖 推荐的 Modern.js Skills（未安装）：',
    skillsList:
      'modernjs-migrate-to-v3、modernjs-dependency-audit、modernjs-issue-triage',
    skillsDocs:
      '安装方式：https://modernjs.dev/guides/get-started/ai-coding-agents',
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
    optionNoAgentsMd: '  --no-agents-md  跳过生成 AGENTS.md / CLAUDE.md',
    optionSkills:
      '  --skills        Skills 模式：none | recommended | custom（默认 recommended；不会自动安装）',
    examples: '💡 示例:',
    example1: '  create my-app',
    example2: '  create my-app --lang zh',
    example3: '  create my-app --sub',
    example4: '  create --help',
    moreInfo: '📚 更多信息: https://modernjs.dev',
  },
  version: {
    message: '@modern-js/create 版本: {version}',
  },
};
