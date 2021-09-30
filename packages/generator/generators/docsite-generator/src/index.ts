import path from 'path';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import {
  i18n,
  DependenceGenerator,
  PackageManager,
} from '@modern-js/generator-common';
import { fs, getPackageManager } from '@modern-js/generator-utils';

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
  await appApi.forgeTemplate('templates/**/*');

  const appDir = process.cwd();

  const packageManager = getPackageManager(appDir);

  if (packageManager === PackageManager.Pnpm) {
    const npmrcPath = path.join(appDir, '.npmrc');
    const npmrcAppendContent = `public-hoist-pattern[]=styled-components
public-hoist-pattern[]=react-router-dom
public-hoist-pattern[]=antd
public-hoist-pattern[]=react-router-dom
public-hoist-pattern[]=@mdx-js/react
public-hoist-pattern[]=prism-react-renderer
public-hoist-pattern[]=react-live
    `;
    if (fs.existsSync(npmrcPath)) {
      const npmrc = fs.readFileSync(npmrcPath, 'utf-8');
      fs.writeFileSync(npmrcPath, `${npmrc}\n${npmrcAppendContent}`, 'utf-8');
    } else {
      fs.ensureFileSync(npmrcPath);
      fs.writeFileSync(npmrcPath, npmrcAppendContent, 'utf-8');
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
  i18n.changeLanguage({ locale });
  appApi.i18n.changeLanguage({ locale });

  if (!(await appApi.checkEnvironment())) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }

  generator.logger.debug(`start run @modern-js/@modern-js/docsite-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, appApi);

  await appApi.runInstall();

  appApi.showSuccessInfo();

  generator.logger.debug(
    `forge @modern-js/@modern-js/docsite-generator succeed `,
  );
};
