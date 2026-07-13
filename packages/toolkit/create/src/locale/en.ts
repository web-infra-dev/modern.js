export const EN_LOCALE = {
  prompt: {
    projectName: 'Please enter project name: ',
  },
  error: {
    projectNameEmpty: 'Error: Project name cannot be empty',
    directoryExists:
      'Error: Directory "{projectName}" already exists and is not empty',
    createFailed: 'Error creating project:',
  },
  message: {
    welcome: '🚀 Welcome to Modern.js',
    success: '✨ Created successfully!',
    agentsMd:
      '✔ AGENTS.md & CLAUDE.md generated — AI coding agents will pick them up automatically. (--no-agents-md to skip)',
    nextSteps: '📋 Next steps:',
    step1: 'cd {projectName}',
    step2: 'pnpm install',
    step3: 'pnpm dev',
  },
  help: {
    title: '🚀 Modern.js Project Creator',
    description: 'Create a new Modern.js project with ease',
    usage: '📖 Usage:',
    usageExample: '  create [project-name] [options]',
    options: '⚙️  Options:',
    optionHelp: '  -h, --help     Display this help message',
    optionVersion: '  -v, --version  Display version information',
    optionLang: '  -l, --lang     Set the language (zh or en)',
    optionSub: '  -s, --sub       Mark as a subproject (package in monorepo)',
    optionNoAgentsMd:
      '  --no-agents-md  Skip generating AGENTS.md / CLAUDE.md for AI coding agents',
    examples: '💡 Examples:',
    example1: '  create my-app',
    example2: '  create my-app --lang zh',
    example3: '  create my-app --sub',
    example4: '  create --help',
    moreInfo: '📚 Learn more: https://modernjs.dev',
  },
  version: {
    message: '@modern-js/create version: {version}',
  },
};
