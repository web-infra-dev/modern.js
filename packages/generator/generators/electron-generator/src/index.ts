import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import { FsAPI } from '@modern-js/codesmith-api-fs';
import {
  fs,
  isTsProject,
  getPackageManager,
  getPackageManagerText,
} from '@modern-js/generator-utils';
import { i18n, localeKeys } from './locale';

// eslint-disable-next-line max-statements
const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const fsAPI = new FsAPI(generator);
  const isTs = isTsProject(context.materials.default.basePath);
  const { material } = context.current!;

  await fsAPI.renderDir(
    material,
    'templates/base-template/**/*',
    (resourceKey: string) =>
      resourceKey
        .replace('templates/base-template/', '')
        .replace('.handlebars', isTs ? '.ts' : '.js'),
    {
      nodir: true,
      dot: true,
    },
  );

  if (context.config.isSubGenerator) {
    await appApi.forgeTemplate(
      'templates/init-template/**/*',
      undefined,
      (resourceKey: string) =>
        resourceKey
          .replace('templates/init-template/', '')
          .replace('.handlebars', ''),
    );
  }

  if (isTs) {
    await appApi.forgeTemplate(
      'templates/ts-template/**/*',
      undefined,
      (resourceKey: string) =>
        resourceKey
          .replace('templates/ts-template/', '')
          .replace('.handlebars', ''),
    );

    const appDir = context.materials.default.basePath;
    const typePath = path.join(appDir, 'src', 'modern-app-env.d.ts');
    const appendContent = `/// <reference types="@modern-js/runtime" />
/// <reference types="@modern-js/plugin-electron/global" />
      `;
    if (fs.existsSync(typePath)) {
      const npmrc = fs.readFileSync(typePath, 'utf-8');
      fs.writeFileSync(typePath, `${npmrc}\n${appendContent}`, 'utf-8');
    } else {
      fs.ensureFileSync(typePath);
      fs.writeFileSync(typePath, appendContent, 'utf-8');
    }
  } else {
    await appApi.forgeTemplate(
      'templates/js-template/**/*',
      undefined,
      (resourceKey: string) =>
        resourceKey
          .replace('templates/js-template/', '')
          .replace('.handlebars', ''),
    );
  }

  const updateInfo: Record<string, any> = {
    main: './electron/main.js',
    'scripts.dev:electron': 'modern dev electron',
    'scripts.build:electron': 'modern build electron',
    'devDependencies.@modern-js/plugin-electron': '^1.0.0',
    'devDependencies.electron': '^13',
    'devDependencies.electron-builder': '^22.11.7',
    'devDependencies.@babel/runtime': '^7.15.4',
    'devDependencies.@babel/register': '^7.15.3',
  };

  if (context.config.isSubGenerator) {
    updateInfo.modernConfig = {};
  }

  const jsonAPI = new JsonAPI(generator);
  await jsonAPI.update(context.materials.default.get('package.json'), {
    query: {},
    update: { $set: updateInfo },
  });
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);
  const { locale } = context.config;
  i18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/electron-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator, appApi);

  if (!context.config.isSubGenerator) {
    try {
      await appApi.runInstall();
    } catch (e) {
      generator.logger.error(e);
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  }

  if (!context.config.isSubGenerator) {
    const packageManager = getPackageManager(process.cwd());
    appApi.showSuccessInfo(
      i18n.t(localeKeys.success, {
        packageManager: getPackageManagerText(packageManager),
      }),
    );
  }

  generator.logger.debug(`forge @modern-js/electron-generator succeed `);
};
