import path from 'path';
import { renderString } from '@modern-js/codesmith-api-handlebars';
import { fs } from '@modern-js/codesmith-utils/fs-extra';
import recursive from 'recursive-readdir';

const IgnoreFiles = [
  '.nvmrc',
  '.vscode/extensions.json',
  '.vscode/settings.json',
  '.husky/pre-commit',
  'README.md',
];

export async function handleTemplate(
  templatePath: string,
  data: Record<string, any> = {},
  { fileExtra, routerPrefix }: { fileExtra: string; routerPrefix: string } = {
    fileExtra: '',
    routerPrefix: '',
  },
) {
  const files: Record<string, string> = {};
  const templateFiles = await recursive(templatePath);
  templateFiles.forEach(filePath => {
    const file = filePath.replace(`${templatePath}/`, '');
    if (IgnoreFiles.includes(file)) {
      return;
    }
    if (fs.statSync(filePath).isFile()) {
      if (file.endsWith('.handlebars')) {
        files[
          `${routerPrefix}${file
            .replace('.handlebars', fileExtra)
            .replace('npmrc', '.npmrc')}`.replace('language', 'ts')
        ] = `${renderString(fs.readFileSync(filePath, 'utf-8'), data)}`;
      } else {
        files[`${routerPrefix}${file}`] = `${fs.readFileSync(
          filePath,
          'utf-8',
        )}`;
      }
    }
  });
  return files;
}

async function handleCodesandboxTemplate() {
  const templateDir = path.join(__dirname, 'codesandbox');
  const files: Record<string, string> = {
    ...(await handleTemplate(templateDir)),
  };

  return files;
}

async function handleCreateTemplate() {
  const createPackageMainPath = require.resolve('@modern-js/create');
  const createPackagePath = path.dirname(path.dirname(createPackageMainPath));
  const createPackageJsonPath = path.join(createPackagePath, 'package.json');

  const templateDir = path.join(createPackagePath, 'template');

  const createPackageJson = JSON.parse(
    fs.readFileSync(createPackageJsonPath, 'utf-8'),
  );
  const version = createPackageJson.version || '3.0.0';

  const files = await handleTemplate(templateDir, {
    packageName: 'modern-app',
    version,
  });

  return files;
}

async function main() {
  const codesandboxFiles = await handleCodesandboxTemplate();
  const createFiles = await handleCreateTemplate();
  const srcTemplatesDir = path.join(__dirname, '..', 'src/templates');
  const commonFiles = { ...codesandboxFiles };
  fs.writeFileSync(
    path.join(srcTemplatesDir, 'common.ts'),
    `export const commonFiles = ${JSON.stringify(commonFiles, null, 2)};`,
    'utf-8',
  );
  const mwaFiles = createFiles;
  fs.writeFileSync(
    path.join(srcTemplatesDir, 'mwa.ts'),
    `import { commonFiles } from './common';

export const MWAFiles = {
  ...commonFiles,
  ...${JSON.stringify(mwaFiles, null, 2)}
};`,
    'utf-8',
  );
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
