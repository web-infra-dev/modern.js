import path from 'path';
import os from 'os';
import cp from 'child_process';
import { fs, yaml, getPackageManager, logger } from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';
import { entry, spec } from './generator';

const tmpDir = '.modern-tencent-serverless';

export default (): CliPlugin => ({
  name: '@modern-js/plugin-lambda-scf',

  setup: api => {
    return {
      async afterDeploy() {
        console.info('');
        logger.info('Deploying application to Tencent SCF...');

        const secretId = process.env.CLOUD_SECRET_ID;
        const secretKey = process.env.CLOUD_SECRET_KEY;
        if (!secretId || !secretKey) {
          logger.warn(
            'Using Tencent must provide SecretId and SecretKey, visit xxx to see more information',
          );
          return;
        }

        const { appDirectory, distDirectory } = api.useAppContext();
        const publishDir = path.join(os.tmpdir(), tmpDir);

        // create upload dir
        if (!fs.existsSync(publishDir)) {
          logger.info(`Creating a tmp upload directory: ${publishDir}`);
          fs.mkdir(publishDir);
        } else {
          logger.info(
            `The tmp upload directory is already exist, empty: ${publishDir}`,
          );
          fs.emptyDirSync(publishDir);
        }

        logger.info('Creating serverless.yml');
        const pkgPath = path.join(appDirectory, 'package.json');
        const { name, dependencies } = fs.readJSONSync(pkgPath);
        const jsonspec = spec({
          serviceName: `${name}-app`,
          funcName: `${name}-fun`,
          region: process.env.CLOUD_REGION || 'ap-guangzhou',
        });
        const yamlStr = yaml.dump(jsonspec);
        fs.writeFileSync(path.join(publishDir, 'serverless.yml'), yamlStr);

        // app.js
        logger.info('Creating app.js');
        const passedConfig = {
          output: {
            path: 'dist',
          },
        };
        const appEntry = entry({ config: passedConfig });
        fs.writeFileSync(path.join(publishDir, 'app.js'), appEntry);

        // package.json
        logger.info('Creating new package.json');
        const requiredDependencies = {
          ...dependencies,
          '@modern-js/server': '^1',
        };
        const pkg = {
          dependencies: requiredDependencies,
          private: true,
        };
        fs.writeJSONSync(path.join(publishDir, 'package.json'), pkg, {
          spaces: 2,
        });

        // copy files
        logger.info('Copy file from dist directory');
        fs.copySync(distDirectory, path.join(publishDir, 'dist'));

        // install deps
        let manager = await getPackageManager(appDirectory);
        if (manager === 'pnpm') {
          manager = 'npm';
        }
        logger.info(`Install dependencies in publish dir, use ${manager}`);

        cp.execSync(
          `${manager} install ${manager === 'npm' ? '--loglevel error' : ''}`,
          {
            cwd: publishDir,
          },
        );

        // create .env file
        const envfile = `TENCENT_SECRET_ID=${secretId}
        TENCENT_SECRET_KEY=${secretKey}`;

        fs.writeFileSync(path.join(publishDir, '.env'), envfile);

        // deploy tencent cloud
        const deployBin = path.join(__dirname, './deploy.js');
        cp.execSync(`node ${deployBin} deploy`, {
          cwd: publishDir,
          stdio: 'inherit',
        });
      },
    };
  },
});
