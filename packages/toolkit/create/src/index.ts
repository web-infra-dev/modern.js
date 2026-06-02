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
  console.log(i18n.t(localeKeys.help.optionSkills));
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

// `--no-agents-md` 逃生开关：跳过生成 AGENTS.md / CLAUDE.md
function detectAgentsMdFlag(): boolean {
  return !process.argv.slice(2).includes('--no-agents-md');
}

// `--skills=none|recommended|custom`（默认 recommended）。
// 仅记录/提示选择，不在脚手架阶段隐式安装任何 Skill。
function detectSkillsMode(): 'none' | 'recommended' | 'custom' {
  const args = process.argv.slice(2);
  let raw: string | undefined;
  const eq = args.find(arg => arg.startsWith('--skills='));
  if (eq) {
    raw = eq.split('=')[1];
  } else {
    const index = args.indexOf('--skills');
    if (index !== -1) {
      raw = args[index + 1];
    }
  }
  if (raw === undefined) {
    return 'recommended';
  }
  if (raw === 'none' || raw === 'recommended' || raw === 'custom') {
    return raw;
  }
  console.error(i18n.t(localeKeys.error.invalidSkillsMode, { value: raw }));
  process.exit(1);
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
  // 取值型 flag：其后紧跟的 token 是它的值，不能当作项目名
  const valueFlags = ['--lang', '-l', '--skills'];
  const projectNameArg = args.find((arg, index) => {
    // 跳过任何以 `-` 开头的选项（含 `--skills=xxx`、`--no-agents-md` 等）
    if (arg.startsWith('-')) {
      return false;
    }
    const prev = args[index - 1];
    if (index > 0 && valueFlags.includes(prev)) {
      return false;
    }
    return true;
  });

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

  // 子项目继承 monorepo 根目录的 AGENTS.md，不在子包内重复生成
  const generateAgentsMd = detectAgentsMdFlag() && !isSubproject;
  const skillsMode = detectSkillsMode();

  copyTemplate(templateDir, targetDir, {
    packageName: projectName,
    version,
    isSubproject,
    generateAgentsMd,
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
  console.log(i18n.t(localeKeys.message.nextSteps));
  if (!useCurrentDir) {
    console.log(
      `${dim}   ${i18n.t(localeKeys.message.step1, { projectName })}${reset}`,
    );
  }
  console.log(`${dim}   ${i18n.t(localeKeys.message.step2)}${reset}`);
  console.log(`${dim}   ${i18n.t(localeKeys.message.step3)}${reset}\n`);

  // Skills 仅做推荐提示，不在此隐式安装
  if (skillsMode === 'recommended') {
    console.log(i18n.t(localeKeys.message.skillsTitle));
    console.log(`${dim}   ${i18n.t(localeKeys.message.skillsList)}${reset}`);
    console.log(`${dim}   ${i18n.t(localeKeys.message.skillsDocs)}${reset}\n`);
  }
}

function copyTemplate(
  src: string,
  dest: string,
  options: {
    packageName: string;
    version: string;
    isSubproject: boolean;
    generateAgentsMd: boolean;
  },
) {
  fs.mkdirSync(dest, { recursive: true });

  const excludeInSubproject = [
    '.gitignore.handlebars',
    'biome.json',
    '.npmrc',
    '.nvmrc',
  ];

  // `--no-agents-md` 或子项目场景下跳过这些文件
  const agentsMdFiles = ['AGENTS.md.handlebars', 'CLAUDE.md'];

  function copyRecursive(srcDir: string, destDir: string) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      if (options.isSubproject && excludeInSubproject.includes(entry.name)) {
        continue;
      }
      if (!options.generateAgentsMd && agentsMdFiles.includes(entry.name)) {
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
