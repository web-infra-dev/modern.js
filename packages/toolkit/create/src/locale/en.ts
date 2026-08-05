export const EN_LOCALE = {
  prompt: {
    projectName: 'Please enter project name: ',
  },
  error: {
    projectNameEmpty: 'Error: Project name cannot be empty',
    directoryExists:
      'Error: Directory "{projectName}" already exists and is not empty',
    createFailed: 'Error creating project:',
    agentsMdOnlyConflict:
      'Error: --agents-md-only only updates the current project and cannot be combined with a project name or --no-agents-md',
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
  agentsCmd: {
    created: '✔ Created {file}',
    updatedBlock: '✔ Updated the modernjs-agent-rules block in {file}',
    addedBlock: '✔ Added the modernjs-agent-rules block to the top of {file}',
    linked: '✔ Added the `@AGENTS.md` import to {file}',
    unchanged: '• {file} is already up to date',
    done: '✨ Done — AI coding agents will read {location}.',
    targetNotFound: 'Error: target directory "{dir}" does not exist',
    notAProject: 'Error: not a Modern.js project — run this in a project root',
    unsupportedVersion:
      '• @modern-js/app-tools@{version} does not ship bundled docs; nothing was changed. Add https://modernjs.dev/llms.txt to AGENTS.md so AI tools can reach the framework docs, or upgrade to {since} or later and re-run this command',
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
    optionAgentsMdOnly:
      '  --agents-md-only  Only add/refresh AGENTS.md / CLAUDE.md in the current project (no scaffolding)',
    examples: '💡 Examples:',
    example1: '  create my-app',
    example2: '  create my-app --lang zh',
    example3: '  create my-app --sub',
    example4:
      '  create --agents-md-only   (add/refresh AGENTS.md & CLAUDE.md in an existing project)',
    moreInfo: '📚 Learn more: https://modernjs.dev',
  },
  version: {
    message: '@modern-js/create version: {version}',
  },
};
