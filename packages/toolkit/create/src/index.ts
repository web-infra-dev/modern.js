import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { getLocaleLanguage } from '@modern-js/i18n-utils/language-detector';
import Handlebars from 'handlebars';
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

function showHelp() {
  console.log(i18n.t(localeKeys.help.title));
  console.log(i18n.t(localeKeys.help.description));
  console.log('');
  console.log(i18n.t(localeKeys.help.usage));
  console.log(i18n.t(localeKeys.help.usageExample));
  console.log('');
  console.log(i18n.t(localeKeys.help.options));
  console.log(i18n.t(localeKeys.help.optionHelp));
  console.log(i18n.t(localeKeys.help.optionLang));
  console.log('');
  console.log(i18n.t(localeKeys.help.examples));
  console.log(i18n.t(localeKeys.help.example1));
  console.log(i18n.t(localeKeys.help.example2));
  console.log(i18n.t(localeKeys.help.example3));
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

async function getProjectName(): Promise<string> {
  const args = process.argv.slice(2);
  const projectNameArg = args.find(
    (arg, index) =>
      arg !== '--lang' &&
      arg !== '-l' &&
      arg !== '--help' &&
      arg !== '-h' &&
      (index === 0 ||
        (args[index - 1] !== '--lang' &&
          args[index - 1] !== '-l' &&
          args[index - 1] !== '--help' &&
          args[index - 1] !== '-h')),
  );

  if (projectNameArg) {
    return projectNameArg;
  }

  const projectName = await promptInput(i18n.t(localeKeys.prompt.projectName));

  if (!projectName) {
    console.error(i18n.t(localeKeys.error.projectNameEmpty));
    process.exit(1);
  }

  return projectName;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  console.log(i18n.t(localeKeys.message.welcome));
  console.log('');

  const projectName = await getProjectName();
  const targetDir = path.isAbsolute(projectName)
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

  console.log('');
  console.log(i18n.t(localeKeys.message.creating, { projectName }));

  copyTemplate(templateDir, targetDir, {
    packageName: projectName,
    version,
  });

  const targetPackageJson = path.join(targetDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(targetPackageJson, 'utf-8'));
  packageJson.name = projectName;

  fs.writeFileSync(
    targetPackageJson,
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );

  console.log(i18n.t(localeKeys.message.success));
  console.log(i18n.t(localeKeys.message.nextSteps));
  console.log('');
  console.log(i18n.t(localeKeys.message.step1, { projectName }));
  console.log(i18n.t(localeKeys.message.step2));
  console.log(i18n.t(localeKeys.message.step3));
  console.log('');
}

function copyTemplate(
  src: string,
  dest: string,
  options: {
    packageName: string;
    version: string;
  },
) {
  fs.mkdirSync(dest, { recursive: true });

  function copyRecursive(srcDir: string, destDir: string) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      let destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyRecursive(srcPath, destPath);
      } else {
        if (entry.name.endsWith('.handlebars')) {
          const templateContent = fs.readFileSync(srcPath, 'utf-8');
          const template = Handlebars.compile(templateContent);
          const rendered = template({
            packageName: options.packageName,
            version: options.version,
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
