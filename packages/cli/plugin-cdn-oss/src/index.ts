import path from 'path';
import os from 'os';
import { fs, logger, yaml } from '@modern-js/utils';
import type { CliPlugin } from '@modern-js/core';
import OSS from 'ali-oss';
import walk from 'walk';

type AliYunConfigYaml = {
  access_key_id: string;
  access_key_secret: string;
};

export default (): CliPlugin => ({
  name: '@modern-js/plugin-cdn-oss',

  setup: async api => {
    const defaultRegion = 'cn-hangzhou';

    return {
      async beforeDeploy() {
        console.info('');
        logger.info('Uploading resource to OSS...');

        // config aliyun
        logger.info(`Configure Aliyun`);
        const profDir = path.join(os.homedir(), '.fcli');
        const profPath = path.join(profDir, 'config.yaml');
        const region = process.env.CLOUD_REGION || defaultRegion;
        if (
          process.env.CLOUD_ACCOUNT_ID &&
          process.env.CLOUD_SECRET_ID &&
          process.env.CLOUD_SECRET_KEY
        ) {
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
            'Using Aliyun must provide AccountId, SecretId and SecretKey, visit xxx to see more information',
          );
          return;
        }

        const { distDirectory } = api.useAppContext();

        const staticDir = process.env.CLOUD_STATIC_DIR || 'static';
        const uploadDir = process.env.CLOUD_UPLOAD_DIR || 'upload';
        const prefix = process.env.CLOUD_BUCKET_PATH || '';
        const bucket = process.env.CLOUD_BUCKET_NAME;
        const bucketRegion = process.env.CLOUD_BUCKET_REGION || region;
        const endpoint = `oss-${bucketRegion}.aliyuncs.com`;

        if (!bucket) {
          logger.warn('Uploading to Aliyun OSS must provider bucket name');
          return;
        }

        // walk static and upload files
        const staticRoot = path.join(distDirectory, staticDir);
        const uploadRoot = path.join(distDirectory, uploadDir);
        const fl: string[] = [];
        walk.walkSync(staticRoot, {
          listeners: {
            file: (root, stats, next) => {
              if (path.extname(stats.name) === '.map') {
                return next();
              }
              fl.push(path.join(root, stats.name));
              return next();
            },
          },
        });
        walk.walkSync(uploadRoot, {
          listeners: {
            file: (root, stats, next) => {
              fl.push(path.join(root, stats.name));
              return next();
            },
          },
        });

        // create oss client
        const config = fs.readFileSync(profPath, 'utf-8');
        const {
          access_key_id: accessKeyId,
          access_key_secret: accessKeySecret,
        } = yaml.load(config) as AliYunConfigYaml;

        const ossClient = new OSS({
          accessKeyId: process.env.CLOUD_SECRET_ID || accessKeyId,
          accessKeySecret: process.env.CLOUD_SECRET_KEY || accessKeySecret,
          bucket,
          endpoint,
        });

        // upload files
        const uploadPromise = fl.map(filepath => {
          const uploadPath = path.relative(distDirectory, filepath);
          return ossClient
            .put(path.join(prefix, uploadPath), filepath)
            .then(() => {
              logger.info(`Upload ${uploadPath} success`);
            });
        });

        await Promise.all(uploadPromise);
        logger.info('Upload files to OSS success');
      },
    };
  },
});
