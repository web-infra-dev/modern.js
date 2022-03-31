import * as path from 'path';
import { fs } from '@modern-js/utils';
import _ from 'lodash';
import execa from 'execa';
import chalk from 'chalk';
import axios from './axios';

import {
  BUTTER_REGISTER_ENDPOINT,
  BUTTER_UNREGISTER_ENDPOINT,
  BUTTER_HOST,
  BUTTER_TYPE_ROUTE_MAP,
} from './env';
import { SESSION_HEADER, NPM_REGISTRY } from './constants';
import loggerModule from './logger';
import { pickOneExisting } from './utils';

const logger = loggerModule.scope('BUTTER__');

const generateSource = async (
  root: string,
  payload: any,
  tmpDir: string,
  userTsconfigFile = 'tsconfig.json',
) => {
  logger.info(`generating library source code into ${tmpDir}`);
  const { name, version, title, desc, comps, maintainers } = payload;
  const pkgJson = path.resolve(tmpDir, 'package.json');
  const esmFile = `./dist/${_.last(name.split('/')).toLowerCase()}`;
  const pkg = {
    name,
    version,
    main: 'dist/index.js',
    module: esmFile,
    esnext: esmFile,
    scripts: {
      build:
        'rm -rf ./dist && jupiter build -f cjs,esm -n && jupiter build -m docs -n',
      prepublishOnly: 'yarn build',
    },
    files: ['dist'],
    dependencies: comps,
    devDependencies: {
      '@modern-js/module-tools': '^1.0.0',
      react: '^16.12.0',
      'react-dom': '^16.12.0',
      typescript: '^3.8.3',
    },
    peerDependencies: {
      react: '^16.12.0',
      'react-dom': '^16.12.0',
    },
    // eslint-disable-next-line @typescript-eslint/no-shadow
    maintainers: maintainers.map(name => ({ name })),
    meta: {
      title,
      desc,
      comps,
    },
    unpkg: true,
  };
  await fs.outputJson(pkgJson, pkg, { spaces: 2 });

  const entryFile = path.resolve(tmpDir, 'src/index.ts');
  const entryContent = Object.keys(comps)
    // eslint-disable-next-line @typescript-eslint/no-shadow
    .map(name => {
      const lastName = _.last(name.split('/'));
      const importName = _.upperFirst(_.camelCase(lastName));
      return `import ${importName} from "${name}";\nexport { ${importName} };`;
    })
    .join('\n');
  await fs.outputFile(entryFile, entryContent, { encoding: 'utf8' });

  const tsconfigFile = path.resolve(tmpDir, userTsconfigFile);
  await fs.copy(path.resolve(__dirname, 'static/tsconfig.json'), tsconfigFile);

  const readmeFile = await pickOneExisting(root, [
    'README.md',
    'readme.md',
    'Readme.md',
  ]);
  if (readmeFile) {
    await fs.copy(readmeFile, path.resolve(tmpDir, 'README.md'));
  }

  await Promise.all(
    ['config', 'assets', 'docs', 'node_modules'].map(async dirname => {
      const dir = path.resolve(root, dirname);
      if (fs.pathExistsSync(dir)) {
        await fs.symlink(dir, path.resolve(tmpDir, dirname));
      }
    }),
  );
};
const generateSourceAndBuild = async (root, payload, tsconfigFile) => {
  const { name, version } = payload;
  const tmpDir = path.resolve(root, 'node_modules/.block-tools/tmp');
  try {
    await fs.remove(tmpDir);
    await fs.ensureDir(tmpDir);
    await generateSource(root, payload, tmpDir, tsconfigFile);
    logger.info('library source code generated, build and publish...');
    await execa('npm', ['publish', `--registry=${NPM_REGISTRY}`], {
      cwd: tmpDir,
      stdio: [null, 1, 2],
    });
    return { name, version };
  } catch (err) {
    logger.error('generate source and build failed\n', err);
    return null;
  } finally {
    logger.info(`clean up ${tmpDir}`);
    await fs.remove(tmpDir);
  }
};

const registerPackage = async ({ name, version }, options) => {
  const token =
    process.env.BUTTER_TOKEN ||
    options.token ||
    '8e67a15cc75fe39b784a924351f6e517';

  logger.info(`registering to Butter... ${chalk.grey(BUTTER_HOST)}`);

  try {
    const res = await axios.post(
      BUTTER_REGISTER_ENDPOINT,
      {
        name,
        version,
      },
      {
        headers: {
          [SESSION_HEADER]: token,
        },
      },
    );
    const { errors, data: pkg } = res.data;

    if (errors) {
      logger.error('registration failed\n', JSON.stringify(errors, null, 4));
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    } else if (!pkg || !pkg._id) {
      logger.warn(
        'package registered, but no ID returned',
        JSON.stringify(res.data, null, 4),
      );
    } else {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const { name, version, _id, packageType } = pkg;
      logger.success(
        `package registered ${chalk.blue(`${name}@${version}`)} / ${chalk.grey(
          _id,
        )}`,
      );
      const butterRoute =
        BUTTER_TYPE_ROUTE_MAP[packageType] || BUTTER_TYPE_ROUTE_MAP.COMP;
      const butterURL = `${BUTTER_HOST}/${butterRoute}/${name}@${version}`;
      logger.info(
        `it be live at ${chalk.underline.green(
          butterURL,
        )} within a few minutes.`,
      );
    }
  } catch (err) {
    logger.error('Failed to register package\n', err);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
};

const unregisterPackage = async ({ name, version }, options) => {
  const { token } = options;

  logger.info(`unregistering in Butter... ${chalk.grey(BUTTER_HOST)}`);

  try {
    const res = await axios.post(
      BUTTER_UNREGISTER_ENDPOINT,
      {
        name,
        version,
      },
      {
        headers: {
          [SESSION_HEADER]: token,
        },
      },
    );
    const { errors } = res.data;

    if (errors) {
      logger.error('unregistration failed\n', JSON.stringify(errors, null, 4));
      // eslint-disable-next-line no-process-exit
      process.exit(1);
    } else {
      logger.success(`package unregistered in butter`);
    }
  } catch (err) {
    logger.error('Failed to unregister package\n', err);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
};

const registerGroup = async (root, payload, options) => {
  const { tsconfig: userTsconfigFile = 'tsconfig.json' } = options;

  const pkg = await generateSourceAndBuild(root, payload, userTsconfigFile);
  if (pkg) {
    return registerPackage(pkg, options);
  }
  return null;
};

export { registerPackage, registerGroup, unregisterPackage };
