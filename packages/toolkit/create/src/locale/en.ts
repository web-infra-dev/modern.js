export const EN_LOCALE = {
  prompt: {
    projectName: 'Please enter project name: ',
  },
  error: {
    projectNameEmpty: 'Error: Project name cannot be empty',
    directoryExists:
      'Error: Directory "{projectName}" already exists and is not empty',
    createFailed: 'Error creating project:',
    invalidSkillsMode:
      'Error: invalid --skills value "{value}", expected one of: none | recommended | custom',
  },
  message: {
    welcome: '🚀 Welcome to Modern.js',
    success: '✨ Created successfully!',
    nextSteps: '📋 Next steps:',
    step1: 'cd {projectName}',
    step2: 'pnpm install',
    step3: 'pnpm dev',
    skillsTitle: '🤖 Recommended Modern.js Skills (not installed):',
    skillsList:
      'modernjs-migrate-to-v3, modernjs-dependency-audit, modernjs-issue-triage',
    skillsDocs:
      'How to install: https://modernjs.dev/guides/get-started/ai-coding-agents',
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
      '  --no-agents-md  Skip generating AGENTS.md / CLAUDE.md',
    optionSkills:
      '  --skills        Skills mode: none | recommended | custom (default: recommended; never auto-installs)',
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
