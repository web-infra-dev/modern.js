import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { isTsProject } from '@modern-js/generator-utils';
import {
  DependenceGenerator,
  i18n as commonI18n,
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
  _generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const { isNewProject } = context.config;
  if (isNewProject) {
    const appDir = context.materials.default.basePath;
    const language = isTsProject(appDir) ? Language.TS : Language.JS;
    appApi.forgeTemplate(
      language === Language.TS
        ? 'templates/modern.config.ts.handlebars'
        : 'templates/js/modern.config.js.handlebars',
      undefined,
      resourceKey =>
        resourceKey.replace('templates/', '').replace('.handlebars', ''),
    );
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

  generator.logger.debug(`start run @modern-js/rspack-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator, appApi);

  generator.logger.debug(`forge @modern-js/rspack-generator succeed `);
};
