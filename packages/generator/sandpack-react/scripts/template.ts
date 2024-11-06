import path from 'path';
import { renderString } from '@modern-js/codesmith-api-handlebars';
import { fs } from '@modern-js/codesmith-utils/fs-extra';
import { Solution } from '@modern-js/generator-common';
import { getModernVersion } from '@modern-js/generator-utils';
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
async function handleBaseTemplate() {
  const templateDir = path.join(
    require.resolve('@modern-js/base-generator'),
    '../../',
    'templates',
  );
  const baseTemplate = path.join(templateDir, 'base-template');
  const pnpmTemplate = path.join(templateDir, 'pnpm-template');
  const files: Record<string, string> = {
    ...(await handleTemplate(baseTemplate)),
    ...(await handleTemplate(pnpmTemplate)),
  };

  return files;
}

async function handleMWATemplate() {
  const templateDir = path.join(
    require.resolve('@modern-js/mwa-generator'),
    '../../',
    'templates',
  );
  const entryTemplateDir = path.join(
    require.resolve('@modern-js/entry-generator'),
    '../../',
    'templates',
  );
  const baseTemplate = path.join(templateDir, 'base-template');
  const tsTemplate = path.join(templateDir, 'ts-template');
  const modernVersion = await getModernVersion(Solution.MWA);
  const files = {
    ...(await handleTemplate(baseTemplate, {
      name: 'modern-app',
      isMonorepoSubProject: false,
      modernVersion,
      isTs: true,
      packageManager: 'pnpm',
    })),
    ...(await handleTemplate(tsTemplate)),
    ...(await handleTemplate(
      entryTemplateDir,
      {},
      { fileExtra: '.tsx', routerPrefix: 'src/' },
    )),
  };
  return files;
}

async function main() {
  const codesandboxFiles = await handleCodesandboxTemplate();
  const baseFiles = await handleBaseTemplate();
  const srcTemplatesDir = path.join(__dirname, '..', 'src/templates');
  const commonFiles = { ...codesandboxFiles, ...baseFiles };
  fs.writeFileSync(
    path.join(srcTemplatesDir, 'common.ts'),
    `export const commonFiles = ${JSON.stringify(commonFiles, null, 2)};`,
    'utf-8',
  );
  const mwaFiles = await handleMWATemplate();
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
