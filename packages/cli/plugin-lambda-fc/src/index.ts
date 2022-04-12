import path from 'path';
import os from 'os';
import cp from 'child_process';
import { fs, yaml, getPackageManager, logger } from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';
import { entry, spec } from './generator';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-lambda-fc',

  setup: api => {
    return {
      async afterDeploy() {
        console.info('');
        logger.info('Deploying application to Aliyun FC...');

        // config alicloud
        logger.info(`Configure Aliyun`);
        const profDir = path.join(os.homedir(), '.fcli');
        const profPath = path.join(profDir, 'config.yaml');
        if (
          process.env.CLOUD_ACCOUNT_ID &&
          process.env.CLOUD_SECRET_ID &&
          process.env.CLOUD_SECRET_KEY
        ) {
          const region = process.env.CLOUD_REGION || 'cn-hangzhou';

          const deploySpec = {
            endpoint: `https://${process.env.CLOUD_ACCOUNT_ID}.${region}.fc.aliyuncs.com`,
            api_version: '2016-08-15',
            access_key_id: process.env.CLOUD_SECRET_ID,
            access_key_secret: process.env.CLOUD_SECRET_KEY,
            security_token: '',
            debug: false,
            timeout: process.env.CLOUD_TIMEOUT || 90,
            retries: 3,
            sls_endpoint: `${region}.log.aliyuncs.com`,
            report: true,
            enable_custom_endpoint: false,
          };

          if (!fs.existsSync(profDir)) {
            fs.mkdirSync(profDir);
          }
          fs.writeFileSync(profPath, yaml.dump(deploySpec));
        } else if (!fs.existsSync(profPath)) {
          logger.warn(
            'Deployment to Aliyun must provide AccountId, SecretId and SecretKey, visit xxx to see more information',
          );
          return;
        }

        const { appDirectory, distDirectory } = api.useAppContext();

        // create upload dir
        const publishDir = path.join(os.tmpdir(), '.modern-aliyun-serverless');
        if (!fs.existsSync(publishDir)) {
          logger.info(`Creating a tmp upload directory: ${publishDir}`);
          fs.mkdir(publishDir);
        } else {
          logger.info(
            `The tmp upload directory is already exist, empty: ${publishDir}`,
          );
          fs.emptyDirSync(publishDir);
        }

        // // create template.yml
        logger.info('Creating template.yml');
        const pkgPath = path.join(appDirectory, 'package.json');
        const { name, dependencies } = fs.readJSONSync(pkgPath);
        const jsonspec = spec({
          serviceName: `${name}-service`,
          funcName: `${name}-fun`,
        });
        const yamlStr = yaml.dump(jsonspec);
        fs.writeFileSync(path.join(publishDir, 'template.yml'), yamlStr);

        // app.js
        logger.info('Creating index.js');
        const passedConfig = {
          output: {
            path: 'dist',
          },
        };
        const appEntry = entry({ config: passedConfig });
        fs.writeFileSync(path.join(publishDir, 'index.js'), appEntry);

        // package.json
        logger.info('Creating new package.json');
        const requiredDependencies = {
          ...dependencies,
          '@webserverless/fc-express': '^1',
          '@modern-js/server': '^1',
          express: '^4',
        };
        const pkg = {
          dependencies: requiredDependencies,
        };
        fs.writeJSONSync(path.join(publishDir, 'package.json'), pkg, {
          spaces: 2,
        });

        // copy files
        logger.info('Copy file from dist directory');
        fs.copySync(distDirectory, path.join(publishDir, 'dist'));

        // install deps
        const manager = await getPackageManager(appDirectory);
        logger.info(`Install dependencies in publish dir, use ${manager}`);

        cp.execSync(`${manager} install`, {
          cwd: publishDir,
        });

        // deploy aliyun
        logger.info(`Deploying to Aliyun.`);
        const deployBin = path.join(__dirname, './deploy.js');
        cp.execSync(`node ${deployBin} deploy`, {
          cwd: publishDir,
          stdio: 'inherit',
        });
      },
    };
  },
});
