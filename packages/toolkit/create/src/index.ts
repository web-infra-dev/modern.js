import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { getLocaleLanguage } from '@modern-js/i18n-utils/language-detector';
import { i18n, localeKeys } from './locale';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.resolve(__dirname, '..', 'template');

const detectLanguage = (): 'zh' | 'en' => {
  const langIndex = process.argv.findIndex(
    arg => arg === '--lang' || arg === '-l',
  );
  if (langIndex !== -1 && process.argv[langIndex + 1]) {
    const lang = process.argv[langIndex + 1];
    return lang === 'zh' ? 'zh' : 'en';
  }

  const detectedLang = getLocaleLanguage();
  if (detectedLang === 'zh') {
    return 'zh';
  }

  return 'en';
};

i18n.changeLanguage({ locale: detectLanguage() });

function renderTemplate(template: string, data: Record<string, any>): string {
  let result = template;

  const unlessRegex = /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g;
  result = result.replace(unlessRegex, (match, condition, content) => {
    const value = data[condition];
    if (!value) {
      return content;
    }
    return '';
  });

  const varRegex = /\{\{(\w+)\}\}/g;
  result = result.replace(varRegex, (match, key) => {
    const value = data[key];
    return value !== undefined && value !== null ? String(value) : match;
  });

  return result;
}

function showVersion() {
  const createPackageJson = path.resolve(__dirname, '..', 'package.json');
  const createPackage = JSON.parse(fs.readFileSync(createPackageJson, 'utf-8'));
  const version = createPackage.version || 'unknown';
  console.log(i18n.t(localeKeys.version.message, { version }));
  process.exit(0);
}

function showHelp() {
  console.log(i18n.t(localeKeys.help.title));
  console.log(i18n.t(localeKeys.help.description));
  console.log('');
  console.log(i18n.t(localeKeys.help.usage));
  console.log(i18n.t(localeKeys.help.usageExample));
  console.log('');
  console.log(i18n.t(localeKeys.help.options));
  console.log(i18n.t(localeKeys.help.optionHelp));
  console.log(i18n.t(localeKeys.help.optionVersion));
  console.log(i18n.t(localeKeys.help.optionLang));
  console.log(i18n.t(localeKeys.help.optionSub));
  console.log(i18n.t(localeKeys.help.optionNoAgentsMd));
  console.log('');
  console.log(i18n.t(localeKeys.help.examples));
  console.log(i18n.t(localeKeys.help.example1));
  console.log(i18n.t(localeKeys.help.example2));
  console.log(i18n.t(localeKeys.help.example3));
  if (localeKeys.help.example4) {
    console.log(i18n.t(localeKeys.help.example4));
  }
  console.log('');
  console.log(i18n.t(localeKeys.help.moreInfo));
  console.log('');
  process.exit(0);
}

function promptInput(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// flags that consume the next argument as their value
const VALUE_FLAGS = ['--lang', '-l'];
// flags that stand alone
const BOOLEAN_FLAGS = [
  '--help',
  '-h',
  '--version',
  '-v',
  '--sub',
  '-s',
  '--no-sub',
  '--no-agents-md',
];

function detectSubprojectFlag(): boolean | null {
  const args = process.argv.slice(2);
  if (args.includes('--sub') || args.includes('-s')) {
    return true;
  }
  if (args.includes('--no-sub')) {
    return false;
  }
  return null;
}

function detectNoAgentsMdFlag(): boolean {
  return process.argv.slice(2).includes('--no-agents-md');
}

function isDirectoryEmpty(dirPath: string): boolean {
  if (!fs.existsSync(dirPath)) {
    return false;
  }
  try {
    const files = fs.readdirSync(dirPath);
    return files.length === 0;
  } catch {
    return false;
  }
}

async function getProjectName(): Promise<{
  name: string;
  useCurrentDir: boolean;
}> {
  const args = process.argv.slice(2);
  // a positional argument is anything that is not a flag itself and not
  // the value of a value-consuming flag (only --lang/-l takes a value;
  // boolean flags must not swallow the argument that follows them)
  const projectNameArg = args.find(
    (arg, index) =>
      !VALUE_FLAGS.includes(arg) &&
      !BOOLEAN_FLAGS.includes(arg) &&
      !(index > 0 && VALUE_FLAGS.includes(args[index - 1])),
  );

  if (projectNameArg) {
    return { name: projectNameArg, useCurrentDir: false };
  }

  // 如果当前目录为空，直接使用当前目录名作为项目名
  const currentDir = process.cwd();
  if (isDirectoryEmpty(currentDir)) {
    return { name: path.basename(currentDir), useCurrentDir: true };
  }

  const projectName = await promptInput(i18n.t(localeKeys.prompt.projectName));

  if (!projectName) {
    console.error(i18n.t(localeKeys.error.projectNameEmpty));
    process.exit(1);
  }

  return { name: projectName, useCurrentDir: false };
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    return;
  }

  console.log(`\n${i18n.t(localeKeys.message.welcome)}\n`);
  const { name: projectName, useCurrentDir } = await getProjectName();
  const targetDir = useCurrentDir
    ? process.cwd()
    : path.isAbsolute(projectName)
      ? projectName
      : path.resolve(process.cwd(), projectName);

  if (fs.existsSync(targetDir)) {
    const files = fs.readdirSync(targetDir);
    if (files.length > 0) {
      console.error(i18n.t(localeKeys.error.directoryExists, { projectName }));
      process.exit(1);
    }
  }

  const createPackageJson = path.resolve(__dirname, '..', 'package.json');
  const createPackage = JSON.parse(fs.readFileSync(createPackageJson, 'utf-8'));
  const version = createPackage.version || 'latest';

  const subprojectFlag = detectSubprojectFlag();
  const isSubproject = subprojectFlag === true;
  const noAgentsMd = detectNoAgentsMdFlag();

  copyTemplate(templateDir, targetDir, {
    packageName: projectName,
    version,
    isSubproject,
    noAgentsMd,
  });

  const targetPackageJson = path.join(targetDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(targetPackageJson, 'utf-8'));
  packageJson.name = projectName;

  if (isSubproject) {
    delete packageJson['lint-staged'];
    delete packageJson['simple-git-hooks'];
    if (packageJson.scripts) {
      delete packageJson.scripts.prepare;
      delete packageJson.scripts.lint;
    }
    if (packageJson.devDependencies) {
      delete packageJson.devDependencies['lint-staged'];
      delete packageJson.devDependencies['simple-git-hooks'];
      delete packageJson.devDependencies['@biomejs/biome'];
    }
  }

  fs.writeFileSync(
    targetPackageJson,
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );

  // ANSI escape codes: \x1b[2m = dim, \x1b[3m = italic, \x1b[0m = reset
  const dim = '\x1b[2m\x1b[3m';
  const reset = '\x1b[0m';

  console.log(`${i18n.t(localeKeys.message.success)}\n`);
  if (!noAgentsMd && !isSubproject) {
    console.log(`${i18n.t(localeKeys.message.agentsMd)}\n`);
  }
  console.log(i18n.t(localeKeys.message.nextSteps));
  if (!useCurrentDir) {
    console.log(
      `${dim}   ${i18n.t(localeKeys.message.step1, { projectName })}${reset}`,
    );
  }
  console.log(`${dim}   ${i18n.t(localeKeys.message.step2)}${reset}`);
  console.log(`${dim}   ${i18n.t(localeKeys.message.step3)}${reset}\n`);
}

function copyTemplate(
  src: string,
  dest: string,
  options: {
    packageName: string;
    version: string;
    isSubproject: boolean;
    noAgentsMd: boolean;
  },
) {
  fs.mkdirSync(dest, { recursive: true });

  const excludeInSubproject = [
    '.gitignore.handlebars',
    'biome.json',
    '.npmrc',
    '.nvmrc',
    // agent files are managed at the monorepo root in subproject setups
    'AGENTS.md',
    'CLAUDE.md',
  ];

  const agentFiles = ['AGENTS.md', 'CLAUDE.md'];

  function copyRecursive(srcDir: string, destDir: string) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      if (options.isSubproject && excludeInSubproject.includes(entry.name)) {
        continue;
      }
      if (options.noAgentsMd && agentFiles.includes(entry.name)) {
        continue;
      }

      const srcPath = path.join(srcDir, entry.name);
      let destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyRecursive(srcPath, destPath);
      } else {
        if (entry.name.endsWith('.handlebars')) {
          const templateContent = fs.readFileSync(srcPath, 'utf-8');
          const rendered = renderTemplate(templateContent, {
            packageName: options.packageName,
            version: options.version,
            isSubproject: options.isSubproject,
          });
          destPath = destPath.replace(/\.handlebars$/, '');
          fs.writeFileSync(destPath, rendered, 'utf-8');
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  }

  copyRecursive(src, dest);
}

main().catch(error => {
  console.error(i18n.t(localeKeys.error.createFailed), error);
  process.exit(1);
});
