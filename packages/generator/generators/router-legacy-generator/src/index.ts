import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import { fs } from '@modern-js/generator-utils';
import {
  DependenceGenerator,
  i18n as commonI18n,
} from '@modern-js/generator-common';
import { i18n, localeKeys } from './locale';

const getGeneratorPath = (generator: string, distTag: string) => {
  if (process.env.CODESMITH_ENV === 'development') {
    return path.dirname(require.resolve(generator));
  } else if (distTag) {
    return `${generator}@${distTag}`;
  }
  return generator;
};

const ReactRouter6Type = `/// <reference types='@modern-js/runtime/types/router' />`;

const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const { sourceTypeFile, projectPath } = context.config;

  const appDir = context.materials.default.basePath;
  const isTs = fs.existsSync(
    path.join(appDir, projectPath || '', 'tsconfig.json'),
  );
  if (isTs) {
    const typePath = path.join(
      appDir,
      projectPath || '',
      'src',
      sourceTypeFile || 'modern-app-env.d.ts',
    );
    if (fs.existsSync(typePath)) {
      const npmrc = fs.readFileSync(typePath, 'utf-8');
      if (npmrc.includes(ReactRouter6Type)) {
        fs.writeFileSync(
          typePath,
          npmrc.replace(ReactRouter6Type, ''),
          'utf-8',
        );
      }
    }
  }
  // eslint-disable-next-line no-nested-ternary
  const configFile = fs.existsSync(path.join(appDir, 'modern.config.ts'))
    ? 'modern.config.ts'
    : fs.existsSync(path.join(appDir, 'modern.config.js'))
    ? 'modern.config.js'
    : undefined;
  if (configFile) {
    const configString = fs.readFileSync(
      path.join(appDir, configFile),
      'utf-8',
    );
    if (configString.includes('router: true')) {
      generator.logger.info(i18n.t(localeKeys.router_config));
    }
    fs.writeFileSync(
      configFile,
      configString.replace(
        'router: true',
        `router: {
      legacy: true,
    }`,
      ),
    );
  } else {
    const jsonAPI = new JsonAPI(generator);
    const pkgInfo = fs.readJSONSync(path.join(appDir, 'package.json'), 'utf-8');
    if (pkgInfo?.modernConfig?.runtime?.router === true) {
      await jsonAPI.update(
        context.materials.default.get(path.join(appDir, 'package.json')),
        {
          query: {},
          update: {
            $set: {
              'modernConfig.runtime.router': { legacy: true },
            },
          },
        },
      );
    } else {
      generator.logger.info(i18n.t(localeKeys.router_config));
    }
  }

  await appApi.runSubGenerator(
    getGeneratorPath(DependenceGenerator, context.config.distTag),
    undefined,
    {
      ...context.config,
      isSubGenerator: true,
    },
  );
};

export default async (context: GeneratorContext, generator: GeneratorCore) => {
  const appApi = new AppAPI(context, generator);

  const { locale } = context.config;
  commonI18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/router-legacy-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator, appApi);

  await appApi.runInstall(undefined, { ignoreScripts: true });

  appApi.showSuccessInfo(i18n.t(localeKeys.success));

  generator.logger.debug(`forge @modern-js/router-legacy-generator succeed `);
};
