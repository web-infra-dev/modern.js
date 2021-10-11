import path from 'path';
import { merge } from 'lodash';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import {
  i18n,
  SolutionSchema,
  SolutionGenerator,
  Solution,
  SolutionDefualtConfig,
} from '@modern-js/generator-common';

const getGeneratorPath = (generator: string, distTag: string) => {
  if (process.env.CODESMITH_ENV === 'development') {
    return path.dirname(require.resolve(generator));
  } else if (distTag) {
    return `${generator}@${distTag}`;
  }
  return generator;
};

const mergeDefaultConfig = (context: GeneratorContext) => {
  const { solution } = context.config;

  if (solution) {
    merge(SolutionDefualtConfig[solution as Solution], context.config);
  }
};

const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const { solution } = await appApi.getInputBySchema(
    SolutionSchema,
    context.config,
  );

  if (!solution || !SolutionGenerator[solution as Solution]) {
    generator.logger.error('solution is not valid ');
  }
  await appApi.runSubGenerator(
    getGeneratorPath(
      SolutionGenerator[solution as Solution],
      context.config.distTag,
    ),
    undefined,
    context.config,
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

  generator.logger.debug(`start run @modern-js/repo-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  mergeDefaultConfig(context);

  try {
    await handleTemplateFile(context, generator, appApi);
  } catch (e) {
    generator.logger.error(e);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`forge @modern-js/repo-generator succeed `);
};
