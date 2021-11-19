import path from 'path';
import { getPackageVersion } from '@modern-js/generator-utils';
import { GeneratorContext, GeneratorCore } from '@modern-js/codesmith';
import { AppAPI } from '@modern-js/codesmith-api-app';
import { JsonAPI } from '@modern-js/codesmith-api-json';
import {
  i18n,
  DeployTypeSchema,
  BooleanConfig,
  CDNType,
  LambdaType,
} from '@modern-js/generator-common';

const docLinks: Record<string, string> = {
  oss: 'https://modernjs.dev/docs/guides/features/server-side/deploy/upload-cdn/oss',
  cos: 'https://modernjs.dev/docs/guides/features/server-side/deploy/upload-cdn/cos',
  fc: 'https://modernjs.dev/docs/guides/features/server-side/deploy/modern-server/use-lambda/aliyun-fc',
  scf: 'https://modernjs.dev/docs/guides/features/server-side/deploy/modern-server/use-lambda/tencent-scf',
  host: 'https://modernjs.dev/docs/guides/features/server-side/deploy/static-hosting',
  docker:
    'https://modernjs.dev/docs/guides/features/server-side/deploy/modern-server/any-container/docker',
  webServer:
    'https://modernjs.dev/docs/guides/features/server-side/deploy/modern-server/web-server',
};

const handleTemplateFile = async (
  context: GeneratorContext,
  generator: GeneratorCore,
  appApi: AppAPI,
) => {
  const jsonAPI = new JsonAPI(generator);

  const ans = await appApi.getInputBySchema(DeployTypeSchema, context.config);

  const appDir = context.materials.default.basePath;
  const { disableModernServer, cdnType, lambdaType } = ans as Record<
    string,
    string
  >;

  const updateInfo: Record<string, string> = {};

  const addDep = async (dep: string) => {
    const version = await getPackageVersion(dep);
    updateInfo[`devDependencies.${dep}`] = version;
  };
  if (disableModernServer === BooleanConfig.YES) {
    await addDep('@modern-js/plugin-static-hosting');
    generator.logger.info(
      `未使用 Modern.js 内置的服务器, 你可能希望使用静态 Web 服务器部署应用, 相关内容可以查看官网：\n- ${docLinks.host}\n`,
    );
  }

  if (cdnType !== CDNType.NO) {
    await addDep(`@modern-js/plugin-cdn-${cdnType}`);
    generator.logger.info(
      `使用 ${cdnType} 平台上传资源文件, 相关内容可以查看官网：\n- ${docLinks[cdnType]}\n`,
    );
  } else {
    generator.logger.info(
      `未选择 CDN 上传平台, 你可能希望直接使用内置的 Web Server 托管静态资源, 相关内容可以查看官网：\n- ${docLinks.webServer}\n`,
    );
  }

  if (lambdaType !== LambdaType.NO) {
    await addDep(`@modern-js/plugin-lambda-${lambdaType}`);
    generator.logger.info(
      `使用 ${lambdaType} 部署应用, 相关内容可以查看官网：\n- ${docLinks[lambdaType]}\n`,
    );
  } else {
    generator.logger.info(
      `未云函数部署应用, 你可能希望使用其他容器部署应用, 相关内容可以查看官网: \n- ${docLinks.docker}\n`,
    );
  }

  await jsonAPI.update(
    context.materials.default.get(path.join(appDir, 'package.json')),
    {
      query: {},
      update: {
        $set: {
          ...updateInfo,
        },
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

  generator.logger.debug(`start run @modern-js/cloud-deploy-generator`);
  generator.logger.debug(`context=${JSON.stringify(context)}`);
  generator.logger.debug(`context.data=${JSON.stringify(context.data)}`);

  await handleTemplateFile(context, generator, appApi);

  await appApi.runInstall();

  generator.logger.debug(`forge @modern-js/cloud-deploy-generator succeed `);
};
