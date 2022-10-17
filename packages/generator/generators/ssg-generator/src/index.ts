import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import {
  DependenceGenerator,
  i18n as commonI18n,
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
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const jsonAPI = new JsonAPI(generator);
  await jsonAPI.update(context.materials.default.get('package.json'), {
    query: {},
    update: {
      $set: {
        'modernConfig.output.ssg': true,
      },
    },
  });

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

  generator.logger.debug(`start run @modern-js/ssg-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator, appApi);

  await appApi.runInstall(undefined, { ignoreScripts: true });

  appApi.showSuccessInfo();

  generator.logger.debug(`forge @modern-js/ssg-generator succeed `);
};
