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
    creating: '📦 Creating project "{projectName}"...',
    success: '\n✨ Project created successfully!',
    nextSteps: '\n📋 Next steps:',
    step1: '  cd {projectName}',
    step2: '  pnpm install',
    step3: '  pnpm dev',
    divider: '─'.repeat(50),
  },
  help: {
    title: '🚀 Modern.js Project Creator',
    description: 'Create a new Modern.js project with ease',
    usage: '📖 Usage:',
    usageExample: '  create [project-name] [options]',
    options: '⚙️  Options:',
    optionHelp: '  -h, --help     Display this help message',
    optionLang: '  -l, --lang     Set the language (zh or en)',
    examples: '💡 Examples:',
    example1: '  create my-app',
    example2: '  create my-app --lang zh',
    example3: '  create --help',
    moreInfo: '📚 Learn more: https://modernjs.dev',
  },
};
