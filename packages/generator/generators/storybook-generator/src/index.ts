import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import {
  path,
  getPackageVersion,
  isTsProject,
} from '@modern-js/generator-utils';
import {
  DependenceGenerator,
  i18n,
  Language,
} from '@modern-js/generator-common';

const getGeneratorPath = (generator: string, distTag: string) => {
  if (process.env.CODESMITH_ENV === 'development') {
    return path.dirname(require.resolve(generator));
  } else if (distTag) {
    return `${generator}@${distTag}`;
  }
  return generator;
};

const handleTemplateFile = async (
  context: GeneratorContext,
  appApi: AppAPI,
) => {
  const appDir = context.materials.default.basePath;
  const language = isTsProject(appDir) ? Language.TS : Language.JS;
  appApi.forgeTemplate('templates/base-template/**/*', undefined, resourceKey =>
    resourceKey
      .replace('templates/base-template/', '')
      .replace('.handlebars', `.${language}x`),
  );

  if (language === Language.TS) {
    appApi.forgeTemplate('templates/ts-template/**/*', undefined, resourceKey =>
      resourceKey
        .replace('templates/ts-template/', '')
        .replace('.handlebars', ``),
    );
  }

  const runtimeDependence = '@modern-js/runtime';

  await appApi.runSubGenerator(
    getGeneratorPath(DependenceGenerator, context.config.distTag),
    undefined,
    {
      ...context.config,
      devDependencies: {
        ...(context.config.devDependencies || {}),
        [runtimeDependence]: await getPackageVersion(runtimeDependence),
      },
    },
  );
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

  generator.logger.debug(`start run @modern-js/storybook-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, appApi);

  generator.logger.debug(`forge @modern-js/storybook-generator succeed `);
};
