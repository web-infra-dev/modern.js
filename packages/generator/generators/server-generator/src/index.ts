import path from 'path';
import {
  fs,
  getPackageVersion,
  isTsProject,
  readTsConfigByFile,
} from '@modern-js/generator-utils';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import {
  Framework,
  FrameworkAppendTypeContent,
  i18n,
  Language,
  ServerSchema,
} from '@modern-js/generator-common';

function isEmptyServerDir(serverDir: string) {
  const files = fs.readdirSync(serverDir);
  if (files.length === 0) {
    return true;
  }
  return files.every(file => {
    if (fs.statSync(path.join(serverDir, file)).isDirectory()) {
      const childFiles = fs.readdirSync(path.join(serverDir, file));
      return childFiles.length === 0;
    }
    return false;
  });
}

const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const jsonAPI = new JsonAPI(generator);
  const ans = await appApi.getInputBySchema(ServerSchema, context.config);

  const appDir = context.materials.default.basePath;
  const serverDir = path.join(appDir, 'server');

  if (fs.existsSync(serverDir) && !isEmptyServerDir(serverDir)) {
    const files = fs.readdirSync('server');
    if (files.length > 0) {
      generator.logger.warn("'server' is already exist");
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    }
  }

  const { framework } = ans;

  const language = isTsProject(appDir) ? Language.TS : Language.JS;

  if (language === Language.JS && framework === Framework.Nest) {
    generator.logger.warn('nest not support js project');
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  let updateInfo = {};

  if (framework === Framework.Express || framework === Framework.Koa) {
    updateInfo = {
      [`devDependencies.@types/${
        framework as string
      }`]: `^${await getPackageVersion(`@types/${framework as string}`)}`,
    };
  }

  if (framework === Framework.Nest) {
    updateInfo = {
      'dependencies.@nestjs/core': `^${await getPackageVersion(
        '@nestjs/core',
      )}`,
      'dependencies.@nestjs/common': `^${await getPackageVersion(
        '@nestjs/common',
      )}`,
      'dependencies.express': `^${await getPackageVersion('express')}`,
      'devDependencies.@types/express': `^${await getPackageVersion(
        '@types/express',
      )}`,
    };
  } else {
    updateInfo = {
      ...updateInfo,
      [`dependencies.${framework as string}`]: `^${await getPackageVersion(
        framework as string,
      )}`,
    };
  }

  await jsonAPI.update(
    context.materials.default.get(path.join(appDir, 'package.json')),
    {
      query: {},
      update: {
        $set: {
          'dependencies.@modern-js/plugin-server': `^${await getPackageVersion(
            '@modern-js/plugin-server',
          )}`,
          [`dependencies.@modern-js/plugin-${
            framework as string
          }`]: `^${await getPackageVersion(
            `@modern-js/plugin-${framework as string}`,
          )}`,
          ...updateInfo,
        },
      },
    },
  );

  await appApi.forgeTemplate(
    `templates/base-template/${language}/**/*`,
    undefined,
    resourceKey =>
      resourceKey
        .replace(`templates/base-template/${language}/`, '')
        .replace('.handlebars', ''),
  );

  if (language === Language.TS) {
    const tsconfigJSON = readTsConfigByFile(path.join(appDir, 'tsconfig.json'));

    if (!(tsconfigJSON.include || []).includes('server')) {
      await jsonAPI.update(
        context.materials.default.get(path.join(appDir, 'tsconfig.json')),
        {
          query: {},
          update: {
            $set: {
              include: [...(tsconfigJSON.include || []), 'server'],
            },
          },
        },
      );
    }
  }

  await appApi.forgeTemplate(
    `templates/${framework as string}/**/*`,
    resourceKey => resourceKey.includes(language),
    resourceKey =>
      resourceKey
        .replace(`templates/${framework as string}/`, 'server/')
        .replace('.handlebars', ''),
  );

  const appendTypeContent = FrameworkAppendTypeContent[framework as Framework];

  if (appendTypeContent && language === Language.TS) {
    const typePath = path.join(appDir, 'src', 'modern-app-env.d.ts');
    if (fs.existsSync(typePath)) {
      const npmrc = fs.readFileSync(typePath, 'utf-8');
      if (!npmrc.includes(appendTypeContent)) {
        fs.writeFileSync(typePath, `${npmrc}${appendTypeContent}\n`, 'utf-8');
      }
    } else {
      fs.ensureFileSync(typePath);
      fs.writeFileSync(typePath, appendTypeContent, 'utf-8');
    }
  }
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

  generator.logger.debug(`start run @modern-js/server-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator, appApi);

  await appApi.runInstall();

  appApi.showSuccessInfo();

  generator.logger.debug(`forge @modern-js/server-generator succeed `);
};
